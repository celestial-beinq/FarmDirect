/**
 * POST /functions/v1/paystack-webhook
 *
 * Paystack calls this itself when a payment succeeds, so orders are
 * released even if the customer closes the tab before returning to the site.
 *
 * There is no user sign-in here (see supabase/config.toml). Instead every
 * request must carry a signature made with our Paystack secret key;
 * anything without a valid signature is rejected.
 */
import { adminClient, clientIp, paystackSecret, rateLimit } from '../_shared/server.ts';

async function hmacSha512Hex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Compares two strings without leaking where they differ through timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const admin = adminClient();
    try {
      await rateLimit(admin, `webhook:${clientIp(req)}`, 120, 60);
    } catch {
      return new Response('Too many requests', { status: 429 });
    }

    const raw = await req.text();
    const expected = await hmacSha512Hex(paystackSecret(), raw);
    const received = req.headers.get('x-paystack-signature') ?? '';
    if (!safeEqual(expected, received)) return new Response('Invalid signature', { status: 401 });

    const event = JSON.parse(raw);
    if (
      event?.event === 'charge.success' &&
      event.data?.status === 'success' &&
      event.data?.currency === 'NGN' &&
      typeof event.data?.reference === 'string' &&
      Number.isSafeInteger(event.data?.amount) &&
      event.data.amount > 0
    ) {
      const { error } = await admin.rpc('confirm_payment', {
        p_reference: event.data.reference,
        p_amount_kobo: event.data.amount,
      });
      // An unknown reference (e.g. a payment made outside this site) is not our problem.
      if (error && !error.message.includes('Unknown payment reference')) throw error;
    }

    return new Response('ok', { status: 200 });
  } catch (error) {
    console.error(error);
    // A 500 tells Paystack to retry later.
    return new Response('Server error', { status: 500 });
  }
});
