/**
 * POST /functions/v1/checkout
 *
 * Turns the customer's basket into orders and starts a Paystack payment.
 *
 * The browser sends only WHAT it wants (product ids, pack sizes, amounts).
 * Every price is looked up here from the database, so a tampered request
 * cannot buy anything for less than it costs.
 */
import { buyOptions } from '../_shared/pricing.ts';
import {
  HttpError,
  SITE_URL,
  adminClient,
  isUuid,
  json,
  paystackSecret,
  rateLimit,
  requireUser,
  serve,
} from '../_shared/server.ts';

interface Line {
  kind: 'crop' | 'animal' | 'pool';
  productId: string;
  /** crop: pack size label, e.g. "5kg" */
  option?: string;
  /** crop: how many packs */
  qty?: number;
  /** pool: an existing pool to join; leave out to start a new one */
  poolId?: string;
  /** pool: contribution in naira */
  amount?: number;
}

interface PricedLine {
  farmId: string;
  productId: string;
  poolId: string | null;
  /** set when this line should open a new pool */
  newPoolFor: { productId: string; name: string; target: number } | null;
  kind: Line['kind'];
  title: string;
  detail: string;
  image: string;
  unitPrice: number;
  qty: number;
}

function parseLines(body: unknown): Line[] {
  const items = (body as { items?: unknown })?.items;
  if (!Array.isArray(items) || items.length === 0)
    throw new HttpError(400, 'Your basket is empty.');
  if (items.length > 50) throw new HttpError(400, 'Too many items in one order.');

  return items.map((raw) => {
    const item = raw as Record<string, unknown>;
    if (!['crop', 'animal', 'pool'].includes(item.kind as string) || !isUuid(item.productId)) {
      throw new HttpError(400, 'Your basket contains an item we could not read.');
    }
    if (item.poolId !== undefined && !isUuid(item.poolId)) {
      throw new HttpError(400, 'Your basket contains an item we could not read.');
    }
    return {
      kind: item.kind as Line['kind'],
      productId: item.productId,
      option: typeof item.option === 'string' ? item.option.slice(0, 60) : undefined,
      qty: typeof item.qty === 'number' ? item.qty : undefined,
      poolId: item.poolId as string | undefined,
      amount: typeof item.amount === 'number' ? item.amount : undefined,
    };
  });
}

serve(async (req) => {
  const user = await requireUser(req);
  const admin = adminClient();
  await rateLimit(admin, `checkout:${user.id}`, 10, 60);

  const lines = parseLines(await req.json().catch(() => null));

  // ---- Who is buying ----
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, status, full_name, address, email')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'customer') {
    throw new HttpError(403, 'Only customer accounts can place orders.');
  }
  if (profile.status !== 'active') {
    throw new HttpError(403, 'This account is suspended and cannot place orders.');
  }
  if (!profile.address.trim()) {
    throw new HttpError(400, 'Add a delivery address to your profile before ordering.');
  }

  // ---- What is being bought, at database prices ----
  const productIds = [...new Set(lines.map((l) => l.productId))];
  const { data: products } = await admin
    .from('products')
    .select(
      'id, farm_id, kind, name, category, price, unit, image, min_share, status, farms(status)',
    )
    .in('id', productIds);
  const byId = new Map((products ?? []).map((p) => [p.id, p]));

  const poolIds = [...new Set(lines.map((l) => l.poolId).filter(Boolean))] as string[];
  const { data: pools } = poolIds.length
    ? await admin
        .from('pools')
        .select('id, product_id, name, target, raised, status')
        .in('id', poolIds)
    : { data: [] };
  const poolById = new Map((pools ?? []).map((p) => [p.id, p]));

  const priced: PricedLine[] = lines.map((line) => {
    const product = byId.get(line.productId);
    const farm = product?.farms as unknown as { status: string } | null;
    if (!product || product.status !== 'live' || farm?.status !== 'verified') {
      throw new HttpError(
        409,
        'An item in your basket is no longer available. Please remove it and try again.',
      );
    }
    const base = {
      farmId: product.farm_id,
      productId: product.id,
      poolId: null,
      newPoolFor: null,
      kind: line.kind,
      image: product.image,
    };

    if (line.kind === 'crop') {
      if (product.kind !== 'crop')
        throw new HttpError(400, 'Your basket contains an item we could not read.');
      const option = buyOptions(product.price, product.unit).find((o) => o.label === line.option);
      const qty = line.qty ?? 0;
      if (!option)
        throw new HttpError(409, `"${product.name}" is no longer sold in that pack size.`);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
        throw new HttpError(400, `Choose between 1 and 99 of "${product.name}".`);
      }
      return { ...base, title: product.name, detail: option.label, unitPrice: option.price, qty };
    }

    if (product.kind !== 'livestock')
      throw new HttpError(400, 'Your basket contains an item we could not read.');

    if (line.kind === 'animal') {
      return {
        ...base,
        title: product.name,
        detail: 'Entire animal',
        unitPrice: product.price,
        qty: 1,
      };
    }

    // ---- A share in a buying pool ----
    const amount = line.amount ?? 0;
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new HttpError(400, 'Enter a whole-naira amount for your livestock share.');
    }

    if (line.poolId) {
      const pool = poolById.get(line.poolId);
      if (!pool || pool.product_id !== product.id || pool.status !== 'open') {
        throw new HttpError(409, 'That buying pool is no longer open.');
      }
      const remaining = pool.target - pool.raised;
      const minimum = Math.min(product.min_share, remaining);
      if (amount < minimum || amount > remaining) {
        throw new HttpError(
          409,
          `"${pool.name}" now accepts between ₦${minimum} and ₦${remaining}. Please update your share.`,
        );
      }
      return {
        ...base,
        poolId: pool.id,
        title: `${product.name} share`,
        detail: pool.name,
        unitPrice: amount,
        qty: 1,
      };
    }

    if (amount < product.min_share || amount >= product.price) {
      throw new HttpError(
        400,
        `A new pool for "${product.name}" needs a first share between ₦${product.min_share} and the animal's price.`,
      );
    }
    const name = `${product.category} Pool ${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
    return {
      ...base,
      newPoolFor: { productId: product.id, name, target: product.price },
      title: `${product.name} share`,
      detail: name,
      unitPrice: amount,
      qty: 1,
    };
  });

  const total = priced.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);

  // ---- Record the payment, pools, orders and items ----
  const reference = `fd_${crypto.randomUUID().replaceAll('-', '')}`;
  const { data: payment, error: paymentError } = await admin
    .from('payments')
    .insert({ customer_id: user.id, reference, amount: total })
    .select('id')
    .single();
  if (paymentError || !payment)
    throw new Error(`Could not create payment: ${paymentError?.message}`);

  for (const line of priced) {
    if (!line.newPoolFor) continue;
    const { data: pool, error } = await admin
      .from('pools')
      .insert({
        product_id: line.newPoolFor.productId,
        name: line.newPoolFor.name,
        target: line.newPoolFor.target,
        created_by: user.id,
      })
      .select('id')
      .single();
    if (error || !pool) throw new Error(`Could not create pool: ${error?.message}`);
    line.poolId = pool.id;
  }

  // One order per farm, because each farm fulfils its own.
  const byFarm = new Map<string, PricedLine[]>();
  for (const line of priced) byFarm.set(line.farmId, [...(byFarm.get(line.farmId) ?? []), line]);

  for (const [farmId, farmLines] of byFarm) {
    const { data: order, error } = await admin
      .from('orders')
      .insert({
        customer_id: user.id,
        customer_name: profile.full_name,
        farm_id: farmId,
        payment_id: payment.id,
        total: farmLines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0),
        address: profile.address,
      })
      .select('id')
      .single();
    if (error || !order) throw new Error(`Could not create order: ${error?.message}`);

    const { error: itemsError } = await admin.from('order_items').insert(
      farmLines.map((l) => ({
        order_id: order.id,
        product_id: l.productId,
        pool_id: l.poolId,
        kind: l.kind,
        title: l.title,
        detail: l.detail,
        image: l.image,
        unit_price: l.unitPrice,
        qty: l.qty,
      })),
    );
    if (itemsError) throw new Error(`Could not save order items: ${itemsError.message}`);
  }

  // ---- Ask Paystack for a payment page (amounts are in kobo) ----
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${paystackSecret()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email ?? profile.email,
      amount: total * 100,
      currency: 'NGN',
      reference,
      callback_url: `${SITE_URL}/payment/callback`,
    }),
  });
  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.status || !result.data?.authorization_url) {
    console.error('Paystack initialize failed', response.status, result?.message);
    await admin.from('payments').update({ status: 'failed' }).eq('id', payment.id);
    await admin.from('orders').update({ status: 'Cancelled' }).eq('payment_id', payment.id);
    throw new HttpError(502, 'We could not reach the payment provider. Please try again.');
  }

  return json(req, 200, { authorizationUrl: result.data.authorization_url, reference });
});
