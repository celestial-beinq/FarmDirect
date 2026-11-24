/**
 * Server-side rendering entry point, in the shape Netlify's Angular runtime
 * expects (see node_modules/@netlify/angular-runtime/README.md). On Netlify the
 * handler runs as an Edge Function; locally `ng serve` uses `reqHandler`.
 *
 * Static files (JS, CSS, images, prerendered pages) are served by Netlify's CDN
 * and get their security headers from netlify.toml. Pages rendered here get
 * the same headers from `withSecurityHeaders` below — keep the two in sync.
 *
 * Rate limiting: the old Express server kept counters in memory, which does not
 * work on serverless hosts (each request may hit a fresh instance). Sign-in is
 * rate limited by Supabase Auth, and the edge functions use the `rate_limits`
 * table. For more, enable Netlify's rate limiting rules in the dashboard.
 */
import { AngularAppEngine, createRequestHandler } from '@angular/ssr';
import {
  getAllowedHosts,
  getContext,
  getTrustProxyHeaders,
} from '@netlify/angular-runtime/app-engine.js';

const angularAppEngine = new AngularAppEngine({
  allowedHosts: getAllowedHosts(),
  trustProxyHeaders: getTrustProxyHeaders(),
});

/** Limits where scripts, styles, images and network calls may come from. */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.paystack.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self' https://*.paystack.co https://checkout.paystack.com",
].join('; ');

const SECURITY_HEADERS: Record<string, string> = {
  // Browsers must not guess file types (stops disguised scripts).
  'X-Content-Type-Options': 'nosniff',
  // The site may not be embedded in another site's frame (stops clickjacking).
  'X-Frame-Options': 'DENY',
  // Disable the buggy legacy XSS auditor in favour of the CSP.
  'X-XSS-Protection': '0',
  // Don't leak full page addresses to other sites.
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Disable camera, microphone, geolocation; allow payment for Paystack.
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self "https://*.paystack.co")',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

/** Only on the live site: HTTPS-only and the CSP would get in the way of `ng serve`. */
const PRODUCTION_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
};

function withSecurityHeaders(response: Response, live: boolean): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  if (live) {
    for (const [name, value] of Object.entries(PRODUCTION_HEADERS)) headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function netlifyAppEngineHandler(request: Request): Promise<Response> {
  const context = getContext();
  /** True on Netlify; undefined under `ng serve`. */
  const live = !!context;
  const { pathname } = new URL(request.url);

  // Health check for uptime monitors.
  if (pathname === '/api/health') {
    return withSecurityHeaders(
      Response.json(
        { status: 'healthy', timestamp: new Date().toISOString() },
        { headers: { 'Cache-Control': 'no-store' } },
      ),
      live,
    );
  }

  // Unknown /api routes return JSON 404 rather than rendering a page.
  if (pathname.startsWith('/api/')) {
    return withSecurityHeaders(Response.json({ error: 'Endpoint not found' }, { status: 404 }), live);
  }

  const result = await angularAppEngine.handle(request, context);
  return withSecurityHeaders(result ?? new Response('Not found', { status: 404 }), live);
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createRequestHandler(netlifyAppEngineHandler);
