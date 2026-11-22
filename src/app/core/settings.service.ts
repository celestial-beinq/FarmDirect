import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject } from '@angular/core';
import { Role } from './accounts';
import { AuthService } from './auth.service';
import { Supabase, friendlyError } from './supabase';

/** One email notification a user can switch on or off. */
export interface NotifyTopic {
  id: string;
  label: string;
  hint: string;
  /** Whether it is on before the user has changed anything. */
  on: boolean;
}

/** What each role can be notified about. */
export const NOTIFY_TOPICS: Record<Role, NotifyTopic[]> = {
  customer: [
    {
      id: 'orderUpdates',
      label: 'Order updates',
      hint: 'When a farm confirms, dispatches or delivers your order.',
      on: true,
    },
    {
      id: 'poolUpdates',
      label: 'Livestock pool updates',
      hint: 'When a pool you joined is fully funded or the animal is ready.',
      on: true,
    },
    {
      id: 'offers',
      label: 'New produce & offers',
      hint: 'Fresh harvests and deals from farms you have bought from.',
      on: false,
    },
  ],
  farmer: [
    {
      id: 'newOrders',
      label: 'New orders',
      hint: 'As soon as a customer pays for an order from your farm.',
      on: true,
    },
    {
      id: 'lowStock',
      label: 'Low-stock alerts',
      hint: 'When a listing drops below your low-stock level.',
      on: true,
    },
    {
      id: 'reviews',
      label: 'New reviews',
      hint: 'When a customer reviews one of your products.',
      on: true,
    },
    {
      id: 'weeklySummary',
      label: 'Weekly sales summary',
      hint: 'A short email every Monday with last week’s sales.',
      on: false,
    },
  ],
  admin: [
    {
      id: 'farmerApplications',
      label: 'Farmer applications',
      hint: 'When a farm submits or resubmits its verification documents.',
      on: true,
    },
    {
      id: 'listingApprovals',
      label: 'Listings awaiting approval',
      hint: 'When a farmer adds produce that needs checking.',
      on: true,
    },
    {
      id: 'newReviews',
      label: 'New reviews',
      hint: 'When customers post reviews that may need moderating.',
      on: false,
    },
    {
      id: 'dailySummary',
      label: 'Daily marketplace summary',
      hint: 'Orders, revenue and new sign-ups from the previous day.',
      on: true,
    },
  ],
};

export interface UserSettings {
  /** Topic id → on/off. Topics missing here use their default. */
  notify: Record<string, boolean>;
  /** Farmers: a listing with fewer units than this counts as low stock. */
  lowStockThreshold: number;
}

export const DEFAULT_LOW_STOCK = 5;
const STORAGE_PREFIX = 'fd_settings_';

/**
 * Reads and saves the signed-in user's settings. They live in the
 * `profiles.settings` column, with a copy in this browser so the page still
 * works in demo mode (no Supabase) or before the migration has been run.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(Supabase);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** The current user's settings, with defaults filled in. */
  readonly settings = computed<UserSettings>(() => {
    const profile = this.auth.profile();
    const stored = (profile?.settings ?? this.readLocal(profile?.id)) as Partial<UserSettings>;
    return normalise(profile?.role ?? 'customer', stored);
  });

  readonly lowStockThreshold = computed(() => this.settings().lowStockThreshold);

  /** Saves settings. Returns an error message, or null on success. */
  async save(next: UserSettings): Promise<string | null> {
    const profile = this.auth.profile();
    if (!profile) return 'Please sign in first.';
    const clean = normalise(profile.role, next);

    this.writeLocal(profile.id, clean);
    this.auth.profile.set({ ...profile, settings: clean });

    const client = this.supabase.client;
    if (!client || !isUuid(profile.id)) return null; // demo mode: browser copy only
    const { error } = await client.from('profiles').update({ settings: clean }).eq('id', profile.id);
    return error ? friendlyError(error) : null;
  }

  private readLocal(userId: string | undefined): unknown {
    if (!this.isBrowser || !userId) return {};
    try {
      return JSON.parse(localStorage.getItem(STORAGE_PREFIX + userId) ?? '{}');
    } catch {
      return {};
    }
  }

  private writeLocal(userId: string, value: UserSettings): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(value));
    } catch {
      // Storage may be full or blocked; the database copy still applies.
    }
  }
}

/** Fills in defaults and drops anything unknown or out of range. */
function normalise(role: Role, raw: Partial<UserSettings> | null | undefined): UserSettings {
  const notify: Record<string, boolean> = {};
  for (const topic of NOTIFY_TOPICS[role]) {
    const value = raw?.notify?.[topic.id];
    notify[topic.id] = typeof value === 'boolean' ? value : topic.on;
  }
  const threshold = Math.floor(Number(raw?.lowStockThreshold));
  return {
    notify,
    lowStockThreshold:
      Number.isFinite(threshold) && threshold >= 1 && threshold <= 1000
        ? threshold
        : DEFAULT_LOW_STOCK,
  };
}

const isUuid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
