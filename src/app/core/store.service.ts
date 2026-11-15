import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Farmer, FarmerStatus, Order, OrderStatus, Profile, Review } from './accounts';
import { AuthService } from './auth.service';
import { CartItem } from './cart.service';
import { Animal, Crop, CropCategory, DEFAULT_IMAGE, Pool, ProductStatus } from './data';
import { Supabase, friendlyError } from './supabase';

export interface ProductForm {
  name: string;
  category: CropCategory;
  price: number;
  unit: string;
  description: string;
}

/** How long until a pool closes, in words. */
function timeLeft(closesAt: string): string {
  const hours = Math.round((new Date(closesAt).getTime() - Date.now()) / 3_600_000);
  if (hours <= 0) return 'closed';
  if (hours < 48) return hours === 1 ? '1 hour' : `${hours} hours`;
  return `${Math.round(hours / 24)} days`;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- rows come straight from the database */
const toReview = (row: any): Review => ({
  id: row.id,
  productId: row.product_id,
  customerId: row.customer_id,
  author: row.author_name,
  rating: row.rating,
  comment: row.comment,
  date: row.created_at,
});

/**
 * All marketplace data, read from and written to Supabase.
 *
 * `refresh()` simply asks for every table. The database's Row Level
 * Security decides what comes back: a shopper gets live products, a
 * customer also gets their own orders, a farmer their own listings and
 * orders, an admin everything. The app never has to filter for safety.
 */
@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly supabase = inject(Supabase);
  private readonly auth = inject(AuthService);

  readonly farmers = signal<Farmer[]>([]);
  /** Every crop listing this user is allowed to see. */
  readonly crops = signal<Crop[]>([]);
  readonly animals = signal<Animal[]>([]);
  readonly pools = signal<Pool[]>([]);
  readonly orders = signal<Order[]>([]);
  /** Profiles this user may see: just their own, or everyone for admins. */
  readonly profiles = signal<Profile[]>([]);

  /** False until the first load has finished. */
  readonly loaded = signal(false);
  /** The last problem talking to the server, for pages to show. */
  readonly error = signal('');

  /** What shoppers can buy: approved listings from verified farms. */
  readonly liveCrops = computed(() => {
    const verified = new Set(
      this.farmers()
        .filter((f) => f.status === 'verified')
        .map((f) => f.id),
    );
    return this.crops().filter((c) => c.status === 'live' && verified.has(c.farmerId));
  });

  constructor() {
    // Load on start, and again whenever someone signs in or out,
    // because that changes what the database lets us see.
    effect(() => {
      this.auth.userId();
      untracked(() => void this.refresh());
    });
  }

  async refresh(): Promise<void> {
    const client = this.supabase.client;
    if (!client) {
      // On the server, or before Supabase is configured: nothing to load.
      if (!this.supabase.configured) this.loaded.set(true);
      return;
    }
    await this.auth.ready;
    const signedIn = !!this.auth.userId();

    const [farms, products, pools, orders, profiles] = await Promise.all([
      client.from('farms').select('*').order('created_at'),
      client.from('products').select('*').order('created_at'),
      client.from('pools').select('*').order('created_at'),
      signedIn
        ? client
            .from('orders')
            .select('*, order_items(*)')
            .order('created_at', { ascending: false })
        : { data: [], error: null },
      signedIn
        ? client.from('profiles').select('*').order('created_at')
        : { data: [], error: null },
    ]);

    const failed = [farms, products, pools, orders, profiles].find((r) => r.error);
    this.error.set(failed ? friendlyError(failed.error) : '');

    const farmRows: any[] = farms.data ?? [];
    const location = new Map(farmRows.map((f) => [f.id, f.location]));

    this.farmers.set(
      farmRows.map((f) => ({
        id: f.id,
        ownerId: f.owner_id,
        name: f.name,
        location: f.location,
        status: f.status,
        joined: f.created_at,
      })),
    );

    const productRows: any[] = products.data ?? [];
    this.crops.set(
      productRows
        .filter((p) => p.kind === 'crop')
        .map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          price: p.price,
          unit: p.unit,
          tags: p.tags,
          image: p.image,
          gallery: p.gallery.length ? p.gallery : [p.image],
          origin: location.get(p.farm_id) ?? '',
          description: p.description,
          highlights: p.highlights,
          farmerId: p.farm_id,
          status: p.status,
        })),
    );
    this.animals.set(
      productRows
        .filter((p) => p.kind === 'livestock' && p.status === 'live')
        .map((p) => ({
          id: p.id,
          name: p.name,
          type: p.category,
          price: p.price,
          weight: p.weight,
          yieldKg: Number(p.yield_kg),
          origin: location.get(p.farm_id) ?? '',
          image: p.image,
          gallery: p.gallery.length ? p.gallery : [p.image],
          minShare: p.min_share,
          farmerId: p.farm_id,
        })),
    );

    this.pools.set(
      ((pools.data ?? []) as any[]).map((p) => ({
        id: p.id,
        animalId: p.product_id,
        name: p.name,
        target: p.target,
        raised: p.raised,
        members: p.members,
        closesIn: timeLeft(p.closes_at),
        status: p.status,
      })),
    );

    this.orders.set(
      ((orders.data ?? []) as any[]).map((o) => ({
        id: o.id,
        code: o.code,
        customerId: o.customer_id,
        customerName: o.customer_name,
        farmerId: o.farm_id,
        date: o.created_at,
        total: o.total,
        status: o.status,
        address: o.address,
        items: (o.order_items ?? []).map((i: any) => ({
          productId: i.product_id,
          poolId: i.pool_id,
          kind: i.kind,
          title: i.title,
          detail: i.detail,
          image: i.image,
          unitPrice: i.unit_price,
          qty: i.qty,
        })),
      })),
    );

    this.profiles.set(
      ((profiles.data ?? []) as any[]).map((p) => ({
        id: p.id,
        role: p.role,
        name: p.full_name,
        email: p.email,
        phone: p.phone,
        address: p.address,
        status: p.status,
        joined: p.created_at,
      })),
    );

    this.loaded.set(true);
  }

  /* ----------------------------- Lookups ----------------------------- */

  farmerName(id: string): string {
    return this.farmers().find((f) => f.id === id)?.name ?? 'Unknown farm';
  }

  profileName(id: string | null): string {
    return this.profiles().find((p) => p.id === id)?.name || '—';
  }

  /* ------------------------- Changing things ------------------------- */

  /**
   * Runs one change against the database, then reloads. Returns an error
   * message, or null if it worked. The database checks every change
   * against its security rules, so a refusal here is expected behaviour
   * when someone tries something they are not allowed to do.
   */
  private async change(
    action: (client: NonNullable<Supabase['client']>) => PromiseLike<{ error: unknown }>,
  ): Promise<string | null> {
    const client = this.supabase.client;
    if (!client) return 'The server is not set up yet.';
    const { error } = await action(client);
    const message = error ? friendlyError(error) : null;
    this.error.set(message ?? '');
    if (!message) await this.refresh();
    return message;
  }

  /** A farmer's new listing waits for admin approval (the database enforces this). */
  addProduct(farmId: string, form: ProductForm) {
    return this.change((c) =>
      c.from('products').insert({
        farm_id: farmId,
        kind: 'crop',
        name: form.name,
        category: form.category,
        price: form.price,
        unit: form.unit,
        description: form.description,
        image: DEFAULT_IMAGE[form.category],
      }),
    );
  }

  updateProduct(id: string, form: ProductForm, wasRejected: boolean) {
    return this.change((c) =>
      c
        .from('products')
        .update({
          name: form.name,
          category: form.category,
          price: form.price,
          unit: form.unit,
          description: form.description,
          // An edited listing that was rejected goes back for another review.
          ...(wasRejected ? { status: 'pending' } : {}),
        })
        .eq('id', id),
    );
  }

  setProductStatus(id: string, status: ProductStatus) {
    return this.change((c) => c.from('products').update({ status }).eq('id', id));
  }

  deleteProduct(id: string) {
    return this.change((c) => c.from('products').delete().eq('id', id));
  }

  setFarmerStatus(id: string, status: FarmerStatus) {
    return this.change((c) => c.from('farms').update({ status }).eq('id', id));
  }

  updateFarm(id: string, name: string, location: string) {
    return this.change((c) => c.from('farms').update({ name, location }).eq('id', id));
  }

  setCustomerStatus(id: string, status: Profile['status']) {
    return this.change((c) => c.from('profiles').update({ status }).eq('id', id));
  }

  async updateMyProfile(name: string, phone: string, address: string): Promise<string | null> {
    const id = this.auth.userId();
    if (!id) return 'Please sign in first.';
    const error = await this.change((c) =>
      c.from('profiles').update({ full_name: name, phone, address }).eq('id', id),
    );
    if (!error) await this.auth.reloadProfile();
    return error;
  }

  /** Moves an order along. The database only allows the steps your role may take. */
  advanceOrder(id: string, status: OrderStatus) {
    return this.change((c) => c.rpc('advance_order', { p_order_id: id, p_status: status }));
  }

  removePool(id: string) {
    return this.change((c) => c.from('pools').delete().eq('id', id));
  }

  /* ----------------------------- Payments ---------------------------- */

  /** Calls one of our edge functions and unwraps its `{ error }` message. */
  private async callFunction<T>(
    name: string,
    body: unknown,
  ): Promise<{ data?: T; error?: string }> {
    const client = this.supabase.client;
    if (!client) return { error: 'The server is not set up yet.' };
    const { data, error } = await client.functions.invoke(name, { body: body as object });
    if (!error) return { data: data as T };
    try {
      const details = await (error as { context?: Response }).context?.json();
      if (details?.error) return { error: details.error };
    } catch {
      // The response was not JSON; fall through to the generic message.
    }
    return { error: friendlyError(error) };
  }

  /**
   * Sends the basket to the server, which prices it from the database,
   * creates the orders and returns a Paystack payment page to go to.
   * Only ids and quantities are sent — never prices.
   */
  checkout(items: CartItem[]) {
    return this.callFunction<{ authorizationUrl: string; reference: string }>('checkout', {
      items: items.map((item) => ({
        kind: item.kind,
        productId: item.productId,
        option: item.option,
        qty: item.qty,
        poolId: item.poolId,
        amount: item.kind === 'pool' ? item.unitPrice : undefined,
      })),
    });
  }

  /** Asks the server to confirm with Paystack that a payment went through. */
  verifyPayment(reference: string) {
    return this.callFunction<{ status: 'success' | 'pending' | 'failed' }>('verify-payment', {
      reference,
    });
  }

  /* ----------------------------- Reviews ----------------------------- */

  /** Reviews for the given products, newest first. With no ids, all reviews. */
  async loadReviews(productIds?: string[]): Promise<Review[]> {
    const client = this.supabase.client;
    if (!client || productIds?.length === 0) return [];
    let query = client.from('reviews').select('*').order('created_at', { ascending: false });
    if (productIds) query = query.in('product_id', productIds);
    const { data } = await query.limit(200);
    return (data ?? []).map(toReview);
  }

  /**
   * Adds or updates my review. The database refuses it unless I have a
   * delivered order containing this product.
   */
  async saveReview(productId: string, rating: number, comment: string): Promise<string | null> {
    const client = this.supabase.client;
    const customerId = this.auth.userId();
    if (!client || !customerId) return 'Please sign in first.';
    const { error } = await client
      .from('reviews')
      .upsert(
        { product_id: productId, customer_id: customerId, rating, comment },
        { onConflict: 'product_id,customer_id' },
      );
    if (!error) return null;
    return /row-level security/i.test(error.message)
      ? 'You can only review a product after an order containing it has been delivered.'
      : friendlyError(error);
  }

  async deleteReview(id: string): Promise<string | null> {
    const client = this.supabase.client;
    if (!client) return 'The server is not set up yet.';
    const { error } = await client.from('reviews').delete().eq('id', id);
    return error ? friendlyError(error) : null;
  }
}
