/**
 * POST /functions/v1/verify-payment   { reference }
 *
 * Called when the customer returns from Paystack. Asks Paystack (using the
 * secret key) whether the payment really succeeded — the browser's word is
 * never taken for it — and if so releases the orders.
 */
import {
  HttpError,
  adminClient,
  json,
  paystackSecret,
  rateLimit,
  requireUser,
  serve,
} from '../_shared/server.ts';

serve(async (req) => {
  const user = await requireUser(req);
  const admin = adminClient();
  await rateLimit(admin, `verify:${user.id}`, 20, 60);

  const body = await req.json().catch(() => null);
  const reference = typeof body?.reference === 'string' ? body.reference : '';
  if (!/^fd_[0-9a-f]{32}$/.test(reference)) throw new HttpError(400, 'Unknown payment reference.');

  const { data: payment } = await admin
    .from('payments')
    .select('id, customer_id, status')
    .eq('reference', reference)
    .maybeSingle();
  // Same answer whether it does not exist or belongs to someone else.
  if (!payment || payment.customer_id !== user.id)
    throw new HttpError(404, 'Unknown payment reference.');
  if (payment.status === 'success') return json(req, 200, { status: 'success' });

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${paystackSecret()}` } },
  );
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.status) {
    console.error('Paystack verify failed', response.status, result?.message);
    throw new HttpError(502, 'We could not confirm your payment yet. Please try again shortly.');
  }

  if (result.data?.status !== 'success') {
    // "abandoned", "failed", "ongoing"... — nothing has been paid.
    return json(req, 200, { status: result.data?.status === 'failed' ? 'failed' : 'pending' });
  }

  const { data: outcome, error } = await admin.rpc('confirm_payment', {
    p_reference: reference,
    p_amount_kobo: result.data.amount,
  });
  if (error) throw new Error(`confirm_payment failed: ${error.message}`);
  if (outcome === 'amount_mismatch') {
    throw new HttpError(409, 'The amount paid does not match this order. Please contact support.');
  }

  return json(req, 200, { status: 'success' });
});
