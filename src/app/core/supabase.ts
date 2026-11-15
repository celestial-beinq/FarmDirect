import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

/**
 * The connection to Supabase.
 *
 * It uses the public "anon" key, which is safe to ship to browsers: what a
 * visitor can read or change is decided by the Row Level Security policies
 * in the database, not by this key. Secret keys are never used here.
 */
@Injectable({ providedIn: 'root' })
export class Supabase {
  /** False until .env has been filled in (see SETUP.md). */
  readonly configured = !!(environment.supabaseUrl && environment.supabaseAnonKey);

  /** Null on the server and when Supabase is not configured. */
  readonly client: SupabaseClient | null =
    this.configured && isPlatformBrowser(inject(PLATFORM_ID))
      ? createClient(environment.supabaseUrl, environment.supabaseAnonKey)
      : null;
}

/** Turns a Supabase / network error into a sentence fit to show a person. */
export function friendlyError(error: unknown): string {
  const message = (error as { message?: string })?.message ?? '';
  if (/row-level security|permission denied|not allowed/i.test(message)) {
    return "You don't have permission to do that.";
  }
  if (/failed to fetch|network/i.test(message)) {
    return 'Could not reach the server. Check your connection and try again.';
  }
  return message || 'Something went wrong. Please try again.';
}
