/**
 * Helpers shared by the edge functions: CORS, clients, sign-in check,
 * rate limiting and JSON responses.
 *
 * Secrets are read from the function's environment (set with
 * `supabase secrets set ...`). They are never sent to the browser.
 */
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

/** Comma-separated list of site origins allowed to call the functions. */
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

/** The site's own address, used for the payment return link. */
export const SITE_URL = (Deno.env.get('SITE_URL') ?? ALLOWED_ORIGINS[0] ?? '').replace(/\/$/, '');

/** Only our own website may call these functions from a browser. */
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin)
      ? origin
      : (ALLOWED_ORIGINS[0] ?? ''),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

export function json(req: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });
}

/** A problem that is safe to show to the caller. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Full-access client. Bypasses RLS, so use it only after checking the caller. */
export function adminClient(): SupabaseClient {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** The signed-in user making this request, checked with Supabase Auth. */
export async function requireUser(req: Request): Promise<User> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Please sign in first.');
  const { data, error } = await adminClient().auth.getUser(token);
  if (error || !data.user)
    throw new HttpError(401, 'Your session has expired. Please sign in again.');
  return data.user;
}

/** Refuses the request if `key` has made more than `max` calls in the window. */
export async function rateLimit(
  admin: SupabaseClient,
  key: string,
  max: number,
  windowSeconds: number,
): Promise<void> {
  const { data, error } = await admin.rpc('check_rate_limit', {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) throw new Error(`Rate limit check failed: ${error.message}`);
  if (data !== true)
    throw new HttpError(429, 'Too many requests. Please wait a minute and try again.');
}

export function clientIp(req: Request): string {
  return (req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
}

export function paystackSecret(): string {
  return requireEnv('PAYSTACK_SECRET_KEY');
}

/**
 * Wraps a function so that CORS pre-flight, wrong methods and errors are
 * handled the same way everywhere. Unexpected errors are logged on the
 * server and the caller only sees a generic message.
 */
export function serve(handler: (req: Request) => Promise<Response>): void {
  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
    if (req.method !== 'POST') return json(req, 405, { error: 'Method not allowed.' });
    try {
      return await handler(req);
    } catch (error) {
      if (error instanceof HttpError) return json(req, error.status, { error: error.message });
      console.error(error);
      return json(req, 500, { error: 'Something went wrong. Please try again.' });
    }
  });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID.test(value);
