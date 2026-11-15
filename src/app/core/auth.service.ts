import { Injectable, computed, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Profile, Role } from './accounts';
import { Supabase, friendlyError } from './supabase';

const DASHBOARDS: Record<Role, string> = {
  customer: '/account',
  farmer: '/farmer',
  admin: '/admin',
};

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

  constructor() {
    const client = this.supabase.client;
    if (!client) {
      this.ready = Promise.resolve();
      return;
    }

    this.ready = client.auth
      .getSession()
      .then(({ data }) => this.loadProfile(data.session?.user.id ?? null));

    client.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return; // handled by getSession above
      // Supabase asks that we don't call it again from inside this callback.
      setTimeout(() => this.loadProfile(session?.user.id ?? null));
    });
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
    const { data } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
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
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) return friendlyError(error);
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
    const { data, error } = await client.auth.signUp({
      email: details.email,
      password: details.password,
      options: {
        emailRedirectTo: `${location.origin}/login`,
        // Read by the database when it creates the profile. The role is
        // re-checked there: nobody can sign up as an admin.
        data: {
          full_name: details.fullName,
          role: details.role,
          farm_name: details.farmName ?? '',
          farm_location: details.farmLocation ?? '',
        },
      },
    });
    if (error) return { error: friendlyError(error), confirmEmail: false };
    if (data.session) await this.loadProfile(data.session.user.id);
    return { error: null, confirmEmail: !data.session };
  }

  async signOut(): Promise<void> {
    await this.supabase.client?.auth.signOut();
    this.profile.set(null);
  }
}

/**
 * Lets a route open only for the given role; everyone else goes to sign-in.
 * This is for convenience only — the real protection is in the database,
 * which refuses data to the wrong role whatever page is open.
 */
export function roleGuard(role: Role): CanActivateFn {
  return async () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    await auth.ready;
    return auth.profile()?.role === role ? true : router.createUrlTree(['/login']);
  };
}
