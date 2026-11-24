import { sanitizeEmail, sanitizeNumber, sanitizePhone, sanitizeText, sanitizeUrl } from './sanitizer';

describe('sanitizeUrl', () => {
  it('keeps safe links', () => {
    expect(sanitizeUrl('https://abc.supabase.co/storage/doc.jpg')).toBe('https://abc.supabase.co/storage/doc.jpg');
    expect(sanitizeUrl('http://example.com/doc.pdf')).toBe('http://example.com/doc.pdf');
    expect(sanitizeUrl('/images/yam.jpg')).toBe('/images/yam.jpg');
    expect(sanitizeUrl('images/yam.jpg')).toBe('/images/yam.jpg');
  });

  it('refuses script and data links, in any letter case', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    expect(sanitizeUrl('JaVaScRiPt:alert(1)')).toBe('');
    expect(sanitizeUrl('  javascript:alert(1)')).toBe('');
    expect(sanitizeUrl('vbscript:x')).toBe('');
    expect(sanitizeUrl('data:text/html,<script>x</script>')).toBe('');
    expect(sanitizeUrl('file:///etc/passwd')).toBe('');
  });

  it('refuses links that only look like site paths but go to another website', () => {
    expect(sanitizeUrl('//evil.com/x.png')).toBe('');
    expect(sanitizeUrl('/\\evil.com')).toBe('');
    expect(sanitizeUrl('\\\\evil.com')).toBe('');
  });

  it('refuses links with characters that could break out of an attribute', () => {
    expect(sanitizeUrl('https://ok.com/a b')).toBe('');
    expect(sanitizeUrl('https://ok.com/"onerror="alert(1)')).toBe('');
    expect(sanitizeUrl('"><script>alert(1)</script>')).toBe('');
  });

  it('refuses anything that is not text', () => {
    expect(sanitizeUrl(42)).toBe('');
    expect(sanitizeUrl(null)).toBe('');
  });
});

describe('sanitizeText', () => {
  it('removes script tags and event handlers', () => {
    expect(sanitizeText('Yam <script>alert(1)</script>')).toBe('Yam alert(1)');
    expect(sanitizeText('<img src=x onerror=alert(1)>')).not.toContain('onerror');
  });

  it('removes invisible control characters and trims', () => {
    expect(sanitizeText('  Ofada\u0000 Rice\u0007  ')).toBe('Ofada Rice');
  });

  it('cuts text to the allowed length', () => {
    expect(sanitizeText('a'.repeat(500), 120)).toHaveLength(120);
  });
});

describe('other cleaners', () => {
  it('cleans emails', () => {
    expect(sanitizeEmail('  NGOZI@Example.COM ')).toBe('ngozi@example.com');
  });

  it('keeps only phone characters', () => {
    expect(sanitizePhone('0803 <b>111</b> 2233')).toBe('0803 111 2233');
  });

  it('keeps numbers finite and in range', () => {
    expect(sanitizeNumber('abc', 1, 5)).toBe(1);
    expect(sanitizeNumber(Infinity, 1, 5)).toBe(1);
    expect(sanitizeNumber(99, 1, 5)).toBe(5);
    expect(sanitizeNumber(-3, 0, 10)).toBe(0);
  });
});
