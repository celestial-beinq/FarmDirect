import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { AddressParts, formatAddress,
  Farmer,
  FarmerStatus,
  Order,
  OrderStatus,
  Profile,
  Review,
  getFarmerVerificationErrors,
  isFarmerVerified,
} from './accounts';
import { AuthService } from './auth.service';
import { CartItem } from './cart.service';
import { Animal, Crop, CropCategory, DEFAULT_IMAGE, Pool, ProductStatus, unitsFromOption } from './data';
import {
  MOCK_ANIMALS,
  MOCK_CROPS,
  MOCK_FARMERS,
  MOCK_ORDERS,
  MOCK_POOLS,
  MOCK_PROFILES,
  MOCK_REVIEWS,
} from './mock-data';
import { sanitizeNumber, sanitizePhone, sanitizeText, sanitizeUrl } from './sanitizer';
import { Supabase, friendlyError } from './supabase';

const isUuid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export interface ProductForm {
  name: string;
  category: CropCategory;
  price: number;
  unit: string;
  quantity?: number;
  description: string;
}

const CROP_CATEGORY_SET = new Set<string>(['Vegetables', 'Fruits', 'Tubers', 'Grains']);

/**
 * Cleans a product form right before it is saved, whatever page it came from.
 * The limits match the database's own rules (which are the real protection,
 * since anyone can call the database directly).
 */
function cleanProductForm(form: ProductForm): ProductForm {
  return {
    name: sanitizeText(form.name, 120),
    category: (CROP_CATEGORY_SET.has(form.category) ? form.category : 'Vegetables') as CropCategory,
    price: Math.round(sanitizeNumber(form.price, 1, 100_000_000)),
    unit: sanitizeText(form.unit, 20) || 'kg',
    quantity: Math.floor(sanitizeNumber(form.quantity ?? 0, 0, 1_000_000)),
    description: sanitizeText(form.description, 2000),
  };
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

  readonly farmers = signal<Farmer[]>(this.supabase.configured ? [] : MOCK_FARMERS);
  /** Every crop listing this user is allowed to see. */
  readonly crops = signal<Crop[]>(this.supabase.configured ? [] : MOCK_CROPS);
  readonly animals = signal<Animal[]>(this.supabase.configured ? [] : MOCK_ANIMALS);
  readonly pools = signal<Pool[]>(this.supabase.configured ? [] : MOCK_POOLS);
  readonly orders = signal<Order[]>([]);
  /** Profiles this user may see: just their own, or everyone for admins. */
  readonly profiles = signal<Profile[]>([]);

  /** False until the first load has finished. */
  readonly loaded = signal(false);
  /** The last problem talking to the server, for pages to show. */
  readonly error = signal('');
  /** When the data was last fetched, for the dashboards' "updated" note. */
  readonly updatedAt = signal<Date | null>(null);
  /** True while the realtime connection opened by `watch()` is up. */
  readonly live = signal(false);

  /** What shoppers can buy: approved listings from verified farms with complete NIN & dossier. */
  readonly liveCrops = computed(() => {
    const verified = new Set(
      this.farmers()
        .filter((f) => isFarmerVerified(f))
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
      farmRows.length
        ? farmRows.map((f) => ({
            id: f.id,
            ownerId: f.owner_id,
            name: f.name,
            location: f.location,
            status: f.status,
            joined: f.created_at,
            nin: f.nin,
            residentialAddress: f.residential_address,
            farmSize: f.farm_size,
            cropProduces: f.crop_produces,
            stateOfOrigin: f.state_of_origin,
            documentUrl: f.document_url,
            verificationNotes: f.verification_notes,
          }))
        : (this.supabase.configured ? [] : MOCK_FARMERS),
    );

    const productRows: any[] = products.data ?? [];
    const cropRows = productRows.filter((p) => p.kind === 'crop');
    this.crops.set(
      cropRows.length
        ? cropRows.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            unit: p.unit,
            quantity: Number(p.quantity ?? 0),
            tags: p.tags,
            image: p.image,
            gallery: p.gallery.length ? p.gallery : [p.image],
            origin: location.get(p.farm_id) ?? '',
            description: p.description,
            highlights: p.highlights,
            farmerId: p.farm_id,
            status: p.status,
          }))
        : (this.supabase.configured ? [] : MOCK_CROPS),
    );

    const animalRows = productRows.filter((p) => p.kind === 'livestock' && p.status === 'live');
    this.animals.set(
      animalRows.length
        ? animalRows.map((p) => ({
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
          }))
        : (this.supabase.configured ? [] : MOCK_ANIMALS),
    );

    const poolRows: any[] = pools.data ?? [];
    this.pools.set(
      poolRows.length
        ? poolRows.map((p) => ({
            id: p.id,
            animalId: p.product_id,
            name: p.name,
            target: p.target,
            raised: p.raised,
            members: p.members,
            closesIn: timeLeft(p.closes_at),
            status: p.status,
          }))
        : (this.supabase.configured ? [] : MOCK_POOLS),
    );

    const orderRows: any[] = orders.data ?? [];
    this.orders.set(
      orderRows.length
        ? orderRows.map((o) => ({
            id: o.id,
            code: o.code,
            customerId: o.customer_id,
            customerName: o.customer_name,
            farmerId: o.farm_id,
            paymentId: o.payment_id,
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
          }))
        : (this.supabase.configured || signedIn ? [] : MOCK_ORDERS),
    );

    const profileRows: any[] = profiles.data ?? [];
    this.profiles.set(
      profileRows.length
        ? profileRows.map((p) => ({
            id: p.id,
            role: p.role,
            name: p.full_name,
            email: p.email,
            phone: p.phone,
            address: p.address,
            status: p.status,
            joined: p.created_at,
          }))
        : (this.supabase.configured ? [] : MOCK_PROFILES),
    );

    this.updatedAt.set(new Date());
    this.loaded.set(true);
  }

  /**
   * Keeps the data fresh while a dashboard is open, so its charts update
   * on their own. Supabase Realtime tells us the moment a row changes; a
   * slow timer covers the case where Realtime is not switched on for the
   * tables (see supabase/migrations/20261115000100_realtime.sql).
   * Returns a function that stops watching.
   */
  watch(): () => void {
    const client = this.supabase.client;
    if (!client) return () => {};

    // Several rows often change together (an order and its items), so wait
    // a moment and reload once.
    let pending: ReturnType<typeof setTimeout> | undefined;
    const reloadSoon = () => {
      clearTimeout(pending);
      pending = setTimeout(() => void this.refresh(), 400);
    };

    const channel = client
      .channel('dashboard')
      .on('postgres_changes', { event: '*', schema: 'public' }, reloadSoon)
      .subscribe((status) => this.live.set(status === 'SUBSCRIBED'));
    const timer = setInterval(() => {
      if (!document.hidden) void this.refresh();
    }, 30_000);

    return () => {
      clearTimeout(pending);
      clearInterval(timer);
      this.live.set(false);
      void client.removeChannel(channel);
    };
  }

  /* ----------------------------- Lookups ----------------------------- */

  farmerName(id: string): string {
    return this.farmers().find((f) => f.id === id)?.name ?? 'Unknown farm';
  }

  profileName(id: string | null): string {
    return this.profiles().find((p) => p.id === id)?.name || 'N/A';
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
  addProduct(farmId: string, rawForm: ProductForm): Promise<string | null> {
    const form = cleanProductForm(rawForm);
    if (form.name.length < 2) return Promise.resolve('Enter a product name.');
    const farm = this.farmers().find((f) => f.id === farmId);
    if (!farm) {
      return Promise.resolve('Farm record not found.');
    }
    if (!isFarmerVerified(farm)) {
      const errors = getFarmerVerificationErrors(farm);
      return Promise.resolve(
        `Cannot list produce: NIN and farm verification are compulsory before listing. ${errors.join(' ')}`,
      );
    }

    const quantity = Math.max(0, Math.floor(form.quantity ?? 0));
    const newCrop: Crop = {
      id: `crop-${Date.now()}`,
      name: form.name,
      category: form.category,
      price: form.price,
      unit: form.unit,
      quantity,
      description: form.description,
      image: DEFAULT_IMAGE[form.category],
      gallery: [DEFAULT_IMAGE[form.category]],
      origin: farm.location || 'Verified Nigerian Farm',
      highlights: ['Fresh harvest', 'Harvested to order'],
      tags: ['New Harvest'],
      farmerId: farmId,
      status: 'pending',
    };
    this.crops.update((list) => [newCrop, ...list]);
    const client = this.supabase.client;
    if (!client) return Promise.resolve(null);
    return this.change((c) =>
      c.from('products').insert({
        farm_id: farmId,
        kind: 'crop',
        name: form.name,
        category: form.category,
        price: form.price,
        unit: form.unit,
        quantity,
        description: form.description,
        image: DEFAULT_IMAGE[form.category],
      }),
    );
  }

  updateProduct(id: string, rawForm: ProductForm, wasRejected: boolean) {
    const form = cleanProductForm(rawForm);
    if (form.name.length < 2) return Promise.resolve('Enter a product name.');
    const quantity = Math.max(0, Math.floor(form.quantity ?? 0));
    this.crops.update((list) =>
      list.map((c) =>
        c.id === id
          ? {
              ...c,
              name: form.name,
              category: form.category,
              price: form.price,
              unit: form.unit,
              quantity,
              description: form.description,
              status: wasRejected ? 'pending' : c.status,
            }
          : c,
      ),
    );
    const client = this.supabase.client;
    if (!client || !isUuid(id)) return Promise.resolve(null);
    return this.change((c) =>
      c
        .from('products')
        .update({
          name: form.name,
          category: form.category,
          price: form.price,
          unit: form.unit,
          quantity,
          description: form.description,
          // An edited listing that was rejected goes back for another review.
          ...(wasRejected ? { status: 'pending' } : {}),
        })
        .eq('id', id),
    );
  }

  /** Quick inline update for product stock quantity. */
  async updateStock(id: string, quantity: number): Promise<string | null> {
    const qty = Math.floor(sanitizeNumber(quantity, 0, 1_000_000));
    // Optimistically update local crop list
    this.crops.update((crops) =>
      crops.map((c) => (c.id === id ? { ...c, quantity: qty } : c)),
    );
    const client = this.supabase.client;
    if (!client || !isUuid(id)) return null;
    return this.change((c) => c.from('products').update({ quantity: qty }).eq('id', id));
  }

  setProductStatus(id: string, status: ProductStatus) {
    this.crops.update((list) =>
      list.map((c) => (c.id === id ? { ...c, status } : c)),
    );
    const client = this.supabase.client;
    if (!client || !isUuid(id)) return Promise.resolve(null);
    return this.change((c) => c.from('products').update({ status }).eq('id', id));
  }

  deleteProduct(id: string) {
    this.crops.update((list) => list.filter((c) => c.id !== id));
    const client = this.supabase.client;
    if (!client || !isUuid(id)) return Promise.resolve(null);
    return this.change((c) => c.from('products').delete().eq('id', id));
  }

  setFarmerStatus(id: string, status: FarmerStatus, rawNotes?: string): Promise<string | null> {
    const notes = rawNotes === undefined ? undefined : sanitizeText(rawNotes, 1000);
    const targetFarmer = this.farmers().find((f) => f.id === id);
    if (status === 'verified') {
      const errors = getFarmerVerificationErrors(targetFarmer);
      if (errors.length > 0) {
        return Promise.resolve(
          `Cannot verify farm: NIN and full verification dossier are compulsory. ${errors.join(' ')}`,
        );
      }
    }

    this.farmers.update((list) =>
      list.map((f) =>
        f.id === id ? { ...f, status, verificationNotes: notes ?? f.verificationNotes } : f,
      ),
    );
    return this.change((c) =>
      c
        .from('farms')
        .update({ status, verification_notes: notes ?? '' })
        .eq('id', id),
    );
  }

  submitFarmerVerification(
    id: string,
    rawData: {
      nin: string;
      residentialAddress: string;
      location: string;
      farmSize: string;
      cropProduces: string;
      stateOfOrigin: string;
      documentUrl?: string;
    },
  ) {
    const data = {
      nin: rawData.nin.replace(/\D/g, '').slice(0, 20),
      residentialAddress: sanitizeText(rawData.residentialAddress, 300),
      location: sanitizeText(rawData.location, 160),
      farmSize: sanitizeText(rawData.farmSize, 100),
      cropProduces: sanitizeText(rawData.cropProduces, 300),
      stateOfOrigin: sanitizeText(rawData.stateOfOrigin, 60),
      documentUrl: sanitizeUrl(rawData.documentUrl).slice(0, 500),
    };
    this.farmers.update((list) =>
      list.map((f) =>
        f.id === id
          ? {
              ...f,
              ...data,
              status: 'pending' as FarmerStatus,
            }
          : f,
      ),
    );
    return this.change((c) =>
      c
        .from('farms')
        .update({
          nin: data.nin,
          residential_address: data.residentialAddress,
          location: data.location,
          farm_size: data.farmSize,
          crop_produces: data.cropProduces,
          state_of_origin: data.stateOfOrigin,
          document_url: data.documentUrl ?? '',
          status: 'pending',
        })
        .eq('id', id),
    );
  }

  updateFarm(id: string, rawName: string, rawLocation: string) {
    const name = sanitizeText(rawName, 120);
    const location = sanitizeText(rawLocation, 160);
    if (name.length < 2) return Promise.resolve('Enter your farm name.');
    return this.change((c) => c.from('farms').update({ name, location }).eq('id', id));
  }

  setCustomerStatus(id: string, status: Profile['status']) {
    return this.change((c) => c.from('profiles').update({ status }).eq('id', id));
  }

  /**
   * Saves my name, phone and address. Pass `rawParts` to save the address field
   * by field; the one-line `address` is then built from them.
   */
  async updateMyProfile(
    rawName: string,
    rawPhone: string,
    rawAddress: string,
    rawParts?: AddressParts,
  ): Promise<string | null> {
    const name = sanitizeText(rawName, 120);
    const phone = sanitizePhone(rawPhone);
    const parts: AddressParts | undefined = rawParts && {
      street: sanitizeText(rawParts.street, 115),
      landmark: sanitizeText(rawParts.landmark, 60),
      city: sanitizeText(rawParts.city, 50),
      lga: sanitizeText(rawParts.lga, 40),
      state: sanitizeText(rawParts.state, 20),
    };
    const address = sanitizeText(parts ? formatAddress(parts) : rawAddress, 300);
    const id = this.auth.userId();
    if (!id) return 'Please sign in first.';
    this.profiles.update((list) =>
      list.map((p) => (p.id === id ? { ...p, name, phone, address, addressParts: parts ?? p.addressParts } : p)),
    );
    const current = this.auth.profile();
    if (current && current.id === id) {
      this.auth.profile.set({ ...current, name, phone, address, addressParts: parts ?? current.addressParts });
    }
    const client = this.supabase.client;
    if (!client || !isUuid(id)) return null;
    const row: Record<string, string> = { full_name: name, phone, address };
    if (parts) {
      Object.assign(row, {
        address_street: parts.street,
        address_landmark: parts.landmark,
        address_city: parts.city,
        address_lga: parts.lga,
        address_state: parts.state,
      });
    }
    let error = await this.change((c) => c.from('profiles').update(row).eq('id', id));
    // Before the structured-address migration has run, those columns don't
    // exist yet: still save the one-line address rather than failing.
    if (error && parts && /address_(street|landmark|city|lga|state)|schema cache|column/i.test(error)) {
      error = await this.change((c) =>
        c.from('profiles').update({ full_name: name, phone, address }).eq('id', id),
      );
    }
    if (!error) await this.auth.reloadProfile();
    return error;
  }

  /** Moves an order along. The database only allows the steps your role may take. */
  advanceOrder(id: string, status: OrderStatus) {
    if (!isUuid(id)) {
      this.orders.update((list) =>
        list.map((o) => (o.id === id ? { ...o, status } : o)),
      );
      this.error.set('');
      return Promise.resolve(null);
    }
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
  checkout(
    items: CartItem[],
  ): Promise<{ data?: { authorizationUrl: string; reference: string }; error?: string }> {
    // Decrement stock optimistically so the remaining counter updates immediately
    for (const item of items) {
      if (item.kind === 'crop') {
        const crop = this.crops().find((c) => c.id === item.productId);
        const unit = crop?.unit ?? 'kg';
        const needed = unitsFromOption(item.option, item.qty, unit);
        this.crops.update((crops) =>
          crops.map((c) =>
            c.id === item.productId
              ? { ...c, quantity: Math.max(0, c.quantity - needed) }
              : c,
          ),
        );
      }
    }

    if (!this.supabase.client) {
      const orderId = `ord-${Math.floor(1000 + Math.random() * 9000)}`;
      const orderCode = `FD-${Math.floor(1000 + Math.random() * 9000)}`;
      const user = this.auth.profile() ?? this.profiles()[3];
      const newOrder: Order = {
        id: orderId,
        code: orderCode,
        customerId: user.id,
        customerName: user.name,
        farmerId: items[0]?.kind === 'pool' ? 'f-sahel' : (this.crops().find((c) => c.id === items[0]?.productId)?.farmerId ?? 'f-plateau'),
        date: new Date().toISOString(),
        status: 'Placed',
        total: items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0),
        address: user.address,
        items: items.map((i) => ({
          productId: i.productId,
          poolId: i.poolId ?? null,
          kind: i.kind,
          title: i.title,
          detail: i.detail,
          image: i.image,
          unitPrice: i.unitPrice,
          qty: i.qty,
        })),
      };
      this.orders.update((list) => [newOrder, ...list]);
      const ref = `DEMO-${Date.now()}`;
      return Promise.resolve({
        data: {
          authorizationUrl: `/payment/callback?reference=${ref}&status=success`,
          reference: ref,
        },
      });
    }

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
  verifyPayment(
    reference: string,
  ): Promise<{ data?: { status: 'success' | 'pending' | 'failed' }; error?: string }> {
    if (!this.supabase.client || reference.startsWith('DEMO-')) {
      return Promise.resolve({ data: { status: 'success' as const } });
    }
    return this.callFunction<{ status: 'success' | 'pending' | 'failed' }>('verify-payment', {
      reference,
    });
  }

  /* ----------------------------- Reviews ----------------------------- */

  /** Reviews for the given products, newest first. With no ids, all reviews. */
  async loadReviews(productIds?: string[]): Promise<Review[]> {
    const client = this.supabase.client;
    let list: Review[] = [];
    if (client && productIds && productIds.length > 0) {
      let query = client.from('reviews').select('*').order('created_at', { ascending: false });
      query = query.in('product_id', productIds);
      const { data } = await query.limit(200);
      list = (data ?? []).map(toReview);
    } else if (client && !productIds) {
      const { data } = await client
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      list = (data ?? []).map(toReview);
    }
    if (list.length === 0 && !this.supabase.configured) {
      list = productIds
        ? MOCK_REVIEWS.filter((r) => productIds.includes(r.productId))
        : MOCK_REVIEWS;
    }
    return list;
  }

  /**
   * Adds or updates my review. The database refuses it unless I have a
   * delivered order containing this product.
   */
  async saveReview(productId: string, rawRating: number, rawComment: string): Promise<string | null> {
    const rating = Math.round(sanitizeNumber(rawRating, 1, 5));
    const comment = sanitizeText(rawComment, 1000);
    if (!isUuid(productId)) return 'This product cannot be reviewed.';
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
