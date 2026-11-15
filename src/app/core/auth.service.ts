import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DEMO_CUSTOMER_ID, DEMO_FARMER_ID, Role } from './accounts';
import { PoolService } from './pool.service';
import { StoreService } from './store.service';

export interface Session {
  role: Role;
  /** The customer or farmer id this session belongs to ("admin" for admins). */
  id: string;
}

const STORAGE_KEY = 'farmdirect.session';

const DASHBOARDS: Record<Role, string> = {
  customer: '/account',
  farmer: '/farmer',
  admin: '/admin',
};

/**
 * Demo sign-in: choosing a role signs you in as that role's sample account.
 * There are no passwords — real authentication needs a backend.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private loaded = false;

  readonly session = signal<Session | null>(null);
  /** Where the account icon should lead: the user's dashboard, or sign-in. */
  readonly homePath = computed(() => {
    const session = this.session();
    return session ? DASHBOARDS[session.role] : '/login';
  });

  constructor() {
    afterNextRender(() => this.restore());
  }

  /** Loads the saved session. Safe to call more than once. */
  restore(): void {
    if (this.loaded || !this.isBrowser) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) this.session.set(JSON.parse(saved));
    } catch {
      // Unreadable storage: stay signed out.
    }
    this.loaded = true;
  }

  signIn(role: Role): void {
    const id =
      role === 'customer' ? DEMO_CUSTOMER_ID : role === 'farmer' ? DEMO_FARMER_ID : 'admin';
    this.session.set({ role, id });
    this.save();
  }

  signOut(): void {
    this.session.set(null);
    this.save();
  }

  private save(): void {
    try {
      const session = this.session();
      if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage blocked: the session lasts until the page is closed.
    }
  }
}

/** Lets a route open only for the given role; everyone else goes to sign-in. */
export function roleGuard(role: Role): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    // Dashboards need saved data straight away, so load it before the page opens.
    auth.restore();
    inject(StoreService).restore();
    inject(PoolService).restore();
    return auth.session()?.role === role ? true : inject(Router).createUrlTree(['/login']);
  };
}
