import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { Request, Response, NextFunction } from 'express';
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

// Request size limits to protect against denial-of-service via large payloads.
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

/**
 * CORS handling:
 * Allow configured origins or local development origins.
 */
const configuredOrigins = (process.env['ALLOWED_ORIGINS'] ?? '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const isOriginAllowed = (origin: string): boolean => {
  if (!origin) return true; // Non-browser / same-origin requests
  if (configuredOrigins.includes(origin)) return true;
  // Local development fallback
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
};

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers['origin'];
  if (typeof origin === 'string') {
    if (isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    }
  }

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, apikey, x-client-info',
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

/**
 * Security headers on every response.
 */
app.use((_req: Request, res: Response, next: NextFunction) => {
  // Browsers must not guess file types (stops disguised scripts).
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // The site may not be embedded in another site's frame (stops clickjacking).
  res.setHeader('X-Frame-Options', 'DENY');
  // Disable buggy legacy XSS auditor in favor of strict CSP.
  res.setHeader('X-XSS-Protection', '0');
  // Don't leak full page addresses to other sites.
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Limit browser features: disable camera, microphone, geolocation; allow payment for Paystack.
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self "https://*.paystack.co")',
  );
  // Cross-Origin isolation protections
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  if (standalone) {
    // Only ever load this site over HTTPS with preloading.
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    // Limits where scripts, styles, images and network calls may come from,
    // so injected content cannot load code from, or send data to, elsewhere.
    res.setHeader(
      'Content-Security-Policy',
      [
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
      ].join('; '),
    );
  }
  next();
});

/**
 * Factory for memory-bounded rate limiters.
 */
function createRateLimiter(windowMs: number, maxRequests: number, message: string) {
  const store = new Map<string, { count: number; resetAt: number }>();

  // Cleanup interval
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key);
    }
  }, windowMs).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = req.ip ?? 'unknown';
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count++;
    if (entry.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      res.status(429).type('application/json').json({
        error: 'Too many requests',
        message,
      });
      return;
    }
    next();
  };
}

/** Rate limiter for authentication routes: max 15 requests per 15 minutes. */
const authRateLimiter = createRateLimiter(
  15 * 60_000,
  15,
  'Too many sign-in attempts. Please wait 15 minutes before trying again.',
);

/** Rate limiter for general API routes: max 60 requests per minute. */
const apiRateLimiter = createRateLimiter(
  60_000,
  60,
  'Too many API requests. Please slow down and try again shortly.',
);

/** Rate limiter for page rendering: max 120 requests per minute. */
const pageRateLimiter = createRateLimiter(
  60_000,
  120,
  'Too many page requests. Please try again in a minute.',
);

/**
 * Serve static files from /browser before rate limiters.
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Apply targeted rate limiters:
 */
app.use('/login', authRateLimiter);
app.use('/api', apiRateLimiter);

/**
 * Health check endpoint for container monitors and uptime checkers.
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Unhandled /api routes return 404 JSON rather than executing SSR.
 */
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

/**
 * Apply page rate limiting to SSR requests.
 */
app.use(pageRateLimiter);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req: Request, res: Response, next: NextFunction) => {
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
