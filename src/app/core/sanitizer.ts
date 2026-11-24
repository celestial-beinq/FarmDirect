/**
 * Input sanitization and XSS protection helpers.
 */

const DANGEROUS_TAGS_PATTERN = /<\s*\/?\s*(script|iframe|object|embed|applet|form|base|link|meta)[^>]*>/gi;
const DANGEROUS_ATTRIBUTES_PATTERN = /\s*(on\w+|formaction|action|xmlns)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const CONTROL_CHARS_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const SAFE_URL_SCHEME_PATTERN = /^(https?:\/\/|\/|\.\/)/i;

/**
 * Sanitizes plain text inputs by removing control characters, stripping executable tags and handlers,
 * and trimming excess whitespace.
 */
export function sanitizeText(value: unknown, maxLength = 1000): string {
  if (value === null || value === undefined) return '';
  const str = String(value)
    .replace(CONTROL_CHARS_PATTERN, '')
    .replace(DANGEROUS_TAGS_PATTERN, '')
    .replace(DANGEROUS_ATTRIBUTES_PATTERN, '')
    .trim();
  return str.slice(0, maxLength);
}

/**
 * Validates and sanitizes a URL. Only http, https, and safe relative URLs are allowed.
 * Prevents javascript:, data:, and vbscript: execution vectors.
 */
export function sanitizeUrl(url: unknown, fallback = ''): string {
  if (typeof url !== 'string') return fallback;
  const clean = url.trim().replace(CONTROL_CHARS_PATTERN, '');
  if (!clean) return fallback;

  // Reject dangerous schemes
  const lower = clean.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('file:')
  ) {
    return fallback;
  }

  // "//evil.com" and "/\evil.com" look like site paths but browsers treat them
  // as links to another website. Backslashes, quotes, angle brackets and
  // whitespace never belong in a link we store.
  if (/^[/\\]{2}|^\/\\/.test(clean) || /[\\\s"'<>`]/.test(clean)) {
    return fallback;
  }

  // Must match safe schemes or relative paths
  if (SAFE_URL_SCHEME_PATTERN.test(clean)) {
    return clean;
  }

  // If it's a relative path without leading slash
  if (/^[a-zA-Z0-9_\-./]+$/.test(clean) && !clean.includes('://')) {
    return `/${clean.replace(/^\/+/, '')}`;
  }

  return fallback;
}

/**
 * Sanitizes email addresses by trimming, lowercasing, and stripping control chars.
 */
export function sanitizeEmail(email: unknown): string {
  if (typeof email !== 'string') return '';
  return email
    .trim()
    .toLowerCase()
    .replace(CONTROL_CHARS_PATTERN, '')
    .slice(0, 254);
}

/**
 * Sanitizes a phone number, preserving standard formatting characters (+, digits, spaces, hyphens, brackets).
 */
export function sanitizePhone(phone: unknown): string {
  if (typeof phone !== 'string') return '';
  return phone.replace(/[^\d+\s()\-]/g, '').trim().slice(0, 30);
}

/**
 * Ensures a number is finite and constrained within an optional range.
 */
export function sanitizeNumber(value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.min(Math.max(num, min), max);
}
