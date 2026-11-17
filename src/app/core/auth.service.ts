import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { Profile, Role } from './accounts';
import { sanitizeEmail, sanitizeText } from './sanitizer';
import { Supabase, friendlyError } from './supabase';

const DASHBOARDS: Record<Role, string> = {
  customer: '/account',
  farmer: '/farmer',
  admin: '/admin',
};

/** 5 minutes of inactivity triggers automatic admin logout for high security. */
export const ADMIN_INACTIVITY_LIMIT_MS = 5 * 60 * 1000;
export const ADMIN_LAST_ACTIVE_KEY = 'fd_admin_last_active';

export interface SignUpDetails {
  email: string;
  password: string;
  fullName: string;
  role: 'customer' | 'farmer';
  farmName?: string;
  farmLocation?: string;
}

/** Sign-in, sign-up and "who is signed in", backed by Supabase Auth. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(Supabase);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Access to the Supabase client for auth session verification. */
  get supabaseClient() {
    return this.supabase.client;
  }

  isSupabaseConfigured(): boolean {
    return this.supabase.configured;
  }

  /** The signed-in person's profile, or null when signed out. */
  readonly profile = signal<Profile | null>(null);
  readonly userId = computed(() => this.profile()?.id ?? null);
  /** Where the account icon should lead: the user's dashboard, or sign-in. */
  readonly homePath = computed(() => {
    const profile = this.profile();
    return profile ? DASHBOARDS[profile.role] : '/login';
  });

  /** Resolves once we know whether someone is signed in. */
  readonly ready: Promise<void>;

  /* --- Inactivity Watchdog State --- */
  private watchdogIntervalId: ReturnType<typeof setInterval> | null = null;
  private lastActivityTime = Date.now();
  private activityListenerCleanup: (() => void) | null = null;

  constructor() {
    const client = this.supabase.client;
    if (!client) {
      this.ready = Promise.resolve();
    } else {
      this.ready = client.auth
        .getSession()
        .then(({ data }) => this.loadProfile(data.session?.user.id ?? null));

      client.auth.onAuthStateChange((event, session) => {
        if (event === 'INITIAL_SESSION') return; // handled by getSession above
        // Supabase asks that we don't call it again from inside this callback.
        setTimeout(() => this.loadProfile(session?.user.id ?? null));
      });
    }

    // Effect to monitor admin profile and toggle the 5-min inactivity watchdog
    if (this.isBrowser) {
      effect(() => {
        const currentProfile = this.profile();
        if (currentProfile?.role === 'admin') {
          this.startAdminInactivityWatchdog();
        } else {
          this.stopAdminInactivityWatchdog();
        }
      });
    }
  }

  private async loadProfile(userId: string | null): Promise<void> {
    if (!userId) {
      this.profile.set(null);
      return;
    }
    if (userId === this.profile()?.id) return;
    await this.reloadProfile(userId);
  }

  /** Re-reads the profile from the database (e.g. after it is edited). */
  async reloadProfile(userId = this.userId()): Promise<void> {
    const client = this.supabase.client;
    if (!client || !userId) return;
    let { data } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
    // Safety retry in case auth trigger is still committing profile
    if (!data) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const retry = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
      data = retry.data;
    }

    if (data && data.role === 'admin' && this.isBrowser) {
      // Check if previous admin session has exceeded the 5-min inactivity window
      const stored = localStorage.getItem(ADMIN_LAST_ACTIVE_KEY);
      const lastActive = stored ? Number(stored) : NaN;
      if (!isNaN(lastActive) && Date.now() - lastActive >= ADMIN_INACTIVITY_LIMIT_MS) {
        console.warn('[Security] Admin session expired due to inactivity (> 5 minutes).');
        await this.handleAdminInactivityTimeout();
        return;
      }
      this.recordActivity();
    }

    this.profile.set(
      data
        ? {
            id: data.id,
            role: data.role,
            name: data.full_name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            status: data.status,
            joined: data.created_at,
          }
        : null,
    );
  }

  /** Returns an error message, or null on success. */
  async signIn(email: string, password: string): Promise<string | null> {
    const client = this.supabase.client;
    if (!client) return 'Sign-in is not set up yet.';

    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail) return 'Please enter a valid email address.';
    if (!password || password.trim().length < 8) {
      return 'Password must be at least 8 characters.';
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    if (error) return friendlyError(error);

    if (this.isBrowser) {
      this.recordActivity();
    }

    await this.loadProfile(data.user.id);
    return null;
  }

  /**
   * Creates an account. `confirmEmail` is true when Supabase has sent a
   * confirmation link that must be clicked before signing in.
   */
  async signUp(details: SignUpDetails): Promise<{ error: string | null; confirmEmail: boolean }> {
    const client = this.supabase.client;
    if (!client) return { error: 'Sign-up is not set up yet.', confirmEmail: false };

    const cleanEmail = sanitizeEmail(details.email);
    const cleanName = sanitizeText(details.fullName, 120);
    const cleanFarmName = details.farmName ? sanitizeText(details.farmName, 120) : '';
    const cleanFarmLocation = details.farmLocation ? sanitizeText(details.farmLocation, 160) : '';

    if (!cleanEmail) return { error: 'Please enter a valid email address.', confirmEmail: false };
    if (!cleanName) return { error: 'Please enter your full name.', confirmEmail: false };
    if (!details.password || details.password.trim().length < 8) {
      return { error: 'Password must be at least 8 characters.', confirmEmail: false };
    }

    const { data, error } = await client.auth.signUp({
      email: cleanEmail,
      password: details.password,
      options: {
        emailRedirectTo: `${location.origin}/login`,
        // Read by the database when it creates the profile. The role is
        // re-checked there: nobody can sign up as an admin.
        data: {
          full_name: cleanName,
          role: details.role,
          farm_name: cleanFarmName,
          farm_location: cleanFarmLocation,
        },
      },
    });
    if (error) return { error: friendlyError(error), confirmEmail: false };
    if (data.session) await this.loadProfile(data.session.user.id);
    return { error: null, confirmEmail: !data.session };
  }

  async signOut(): Promise<void> {
    this.stopAdminInactivityWatchdog();
    if (this.isBrowser) {
      localStorage.removeItem(ADMIN_LAST_ACTIVE_KEY);
      sessionStorage.removeItem(ADMIN_LAST_ACTIVE_KEY);
    }
    await this.supabase.client?.auth.signOut();
    this.profile.set(null);
  }

  /** Quick sign-in with mock profile for instant testing of all 3 dashboards. Only allowed when debug mode is enabled. */
  signInDemo(role: Role): void {
    if (!environment.debug) {
      console.warn('Demo login is disabled in production / secure mode.');
      return;
    }

    if (this.isBrowser) {
      this.recordActivity();
    }

    if (role === 'admin') {
      this.profile.set({
        id: 'u-admin-1',
        role: 'admin',
        name: 'FarmDirect HQ',
        email: 'admin@farmdirect.ng',
        phone: '0802 000 0001',
        address: '14 Kofo Abayomi Street, Victoria Island, Lagos',
        status: 'active',
        joined: '2026-01-10T09:00:00Z',
      });
    } else if (role === 'farmer') {
      this.profile.set({
        id: 'u-farmer-1',
        role: 'farmer',
        name: 'Segun Adeleke',
        email: 'segun@ogunvalley.ng',
        phone: '0803 111 2233',
        address: 'KM 14 Abeokuta-Ibadan Expressway, Ogun State',
        status: 'active',
        joined: '2026-03-02T10:00:00Z',
      });
    } else {
      this.profile.set({
        id: 'u-cust-1',
        role: 'customer',
        name: 'Ngozi Adebayo',
        email: 'ngozi.adebayo@gmail.com',
        phone: '0805 333 4455',
        address: 'Plot 18 Admiralty Way, Lekki Phase 1, Lagos',
        status: 'active',
        joined: '2026-06-12T14:20:00Z',
      });
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                      ADMIN 5-MINUTE INACTIVITY WATCHDOG                    */
  /* -------------------------------------------------------------------------- */

  /** Records user interaction timestamp (throttled to at most once per 2s). */
  recordActivity(): void {
    const now = Date.now();
    if (now - this.lastActivityTime < 2000) return;
    this.lastActivityTime = now;
    if (this.isBrowser) {
      try {
        localStorage.setItem(ADMIN_LAST_ACTIVE_KEY, String(now));
      } catch {
        // In case storage quota is restricted
      }
    }
  }

  /** Starts activity listeners and periodic timer checking for 5 minutes of idle time. */
  private startAdminInactivityWatchdog(): void {
    if (!this.isBrowser || this.watchdogIntervalId) return;

    this.recordActivity();

    // Listen to user interaction events across the window
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];
    const onUserInteraction = () => this.recordActivity();

    events.forEach((ev) => window.addEventListener(ev, onUserInteraction, { passive: true }));

    // When the browser tab gains focus or becomes visible again, check if elapsed > 5 mins
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        this.checkAdminInactivity();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onVisibilityChange);

    this.activityListenerCleanup = () => {
      events.forEach((ev) => window.removeEventListener(ev, onUserInteraction));
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onVisibilityChange);
    };

    // Check every 5 seconds if 5 minutes have elapsed since last recorded interaction
    this.watchdogIntervalId = setInterval(() => {
      this.checkAdminInactivity();
    }, 5000);
  }

  private checkAdminInactivity(): void {
    if (!this.isBrowser || this.profile()?.role !== 'admin') return;

    let lastActive = this.lastActivityTime;
    try {
      const stored = localStorage.getItem(ADMIN_LAST_ACTIVE_KEY);
      if (stored) {
        const parsed = Number(stored);
        if (!isNaN(parsed) && parsed > lastActive) {
          lastActive = parsed;
          this.lastActivityTime = parsed;
        }
      }
    } catch {
      // Fallback to memory timestamp
    }

    if (Date.now() - lastActive >= ADMIN_INACTIVITY_LIMIT_MS) {
      console.warn('[Security] Admin idle for 5 minutes. Logging out automatically.');
      void this.handleAdminInactivityTimeout();
    }
  }

  private async handleAdminInactivityTimeout(): Promise<void> {
    this.stopAdminInactivityWatchdog();
    if (this.isBrowser) {
      localStorage.removeItem(ADMIN_LAST_ACTIVE_KEY);
      sessionStorage.removeItem(ADMIN_LAST_ACTIVE_KEY);
    }
    await this.signOut();
    await this.router.navigate(['/login'], {
      queryParams: { reason: 'inactivity' },
    });
  }

  private stopAdminInactivityWatchdog(): void {
    if (this.watchdogIntervalId) {
      clearInterval(this.watchdogIntervalId);
      this.watchdogIntervalId = null;
    }
    if (this.activityListenerCleanup) {
      this.activityListenerCleanup();
      this.activityListenerCleanup = null;
    }
  }
}

/**
 * Route protection guard:
 * 1. Checks user authentication state and verifies active Supabase session.
 * 2. Enforces 5-minute inactivity timeout for admin accounts.
 * 3. Checks user profile status (rejects suspended accounts).
 * 4. Enforces strict role access (admin only for admin routes, farmer for farmer routes).
 * 5. Redirects unauthorized users to sign-in with return URL, or to their own dashboard.
 */
export function roleGuard(requiredRole: Role): CanActivateFn {
  return async (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);

    await auth.ready;

    // Verify session with Supabase client if configured and not debug mode
    if (auth.isSupabaseConfigured() && !environment.debug) {
      const client = auth.supabaseClient;
      if (client) {
        const { data } = await client.auth.getSession();
        if (!data.session) {
          return router.createUrlTree(['/login'], {
            queryParams: { next: state.url },
          });
        }
      }
    }

    const profile = auth.profile();

    // Not authenticated
    if (!profile) {
      return router.createUrlTree(['/login'], {
        queryParams: { next: state.url },
      });
    }

    // Inactivity check for Admin accounts
    if (profile.role === 'admin' && isBrowser) {
      const stored = localStorage.getItem(ADMIN_LAST_ACTIVE_KEY);
      const lastActive = stored ? Number(stored) : NaN;
      if (!isNaN(lastActive) && Date.now() - lastActive >= ADMIN_INACTIVITY_LIMIT_MS) {
        localStorage.removeItem(ADMIN_LAST_ACTIVE_KEY);
        await auth.signOut();
        return router.createUrlTree(['/login'], {
          queryParams: { reason: 'inactivity' },
        });
      }
      auth.recordActivity();
    }

    // Account suspended check
    if (profile.status === 'suspended') {
      return router.createUrlTree(['/login'], {
        queryParams: { error: 'suspended' },
      });
    }

    // Role authorization check:
    // - 'admin' route requires 'admin' role
    // - 'farmer' route requires 'farmer' role
    // - 'customer' route accepts 'customer' or 'admin'
    const isAuthorized =
      profile.role === requiredRole ||
      (requiredRole === 'customer' && profile.role === 'admin');

    if (isAuthorized) {
      return true;
    }

    // If authenticated but unauthorized for this specific role, route to their own dashboard
    return router.createUrlTree([auth.homePath()]);
  };
}
