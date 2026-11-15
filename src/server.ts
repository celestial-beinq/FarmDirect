import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/** True when running as the real web server (not inside `ng serve` or the build). */
const standalone = isMainModule(import.meta.url) || !!process.env['pm_id'];

// Don't advertise what the server is built with.
app.disable('x-powered-by');

// Behind a host's load balancer the visitor's address arrives in a header.
// Set TRUST_PROXY=1 there so rate limiting counts real visitors, not the proxy.
if (process.env['TRUST_PROXY']) {
  app.set('trust proxy', Number(process.env['TRUST_PROXY']) || 1);
}

/**
 * Security headers on every response.
 */
app.use((_req, res, next) => {
  // Browsers must not guess file types (stops disguised scripts).
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // The site may not be embedded in another site's frame (stops clickjacking).
  res.setHeader('X-Frame-Options', 'DENY');
  // Don't leak full page addresses to other sites.
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // The site never needs the camera, microphone or location.
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (standalone) {
    // Only ever load this site over HTTPS (takes effect on HTTPS responses).
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    // Limits where scripts, styles, images and network calls may come from,
    // so injected content cannot load code from, or send data to, elsewhere.
    // ('unsafe-inline' is needed for the small inline scripts and styles
    // Angular adds when it renders pages on the server.)
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https://images.unsplash.com https://*.supabase.co",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "object-src 'none'",
        "form-action 'self'",
      ].join('; '),
    );
  }
  next();
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Rate limiting for page requests: at most 120 a minute from one address.
 * Rendering a page costs server time, so this stops one visitor (or bot)
 * from tying the server up. Static files above are not counted.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;
const hits = new Map<string, { count: number; resetAt: number }>();

app.use((req, res, next) => {
  const now = Date.now();
  const key = req.ip ?? 'unknown';
  const entry = hits.get(key);

  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }
  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
    res.status(429).type('text/plain').send('Too many requests. Please try again in a minute.');
    return;
  }
  next();
});

// Forget addresses whose window has passed, so the list cannot grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of hits) {
    if (entry.resetAt <= now) hits.delete(key);
  }
}, WINDOW_MS).unref();

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (standalone) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
