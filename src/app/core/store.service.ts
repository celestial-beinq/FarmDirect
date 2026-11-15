import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  CUSTOMERS,
  Customer,
  FARMERS,
  Farmer,
  FarmerStatus,
  ORDERS,
  Order,
  OrderStatus,
} from './accounts';
import { CartItem } from './cart.service';
import { CROPS, Crop, CropCategory, DEFAULT_IMAGE, ProductStatus, UNIT_PLURALS } from './data';
import { PoolService } from './pool.service';

const STORAGE_KEY = 'farmdirect.db.v1';

export interface ProductForm {
  name: string;
  category: CropCategory;
  price: number;
  unit: string;
  description: string;
}

/**
 * The app's stand-in database: farmers, customers, product listings and
 * orders. Everything is saved in this browser's localStorage, so the three
 * dashboards and the marketplace stay in step — but only on this device.
 * Replace the methods here with HTTP calls when a backend exists.
 */
@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly poolService = inject(PoolService);
  private loaded = false;

  readonly farmers = signal<Farmer[]>(FARMERS);
  readonly customers = signal<Customer[]>(CUSTOMERS);
  readonly products = signal<Crop[]>(CROPS);
  readonly orders = signal<Order[]>(ORDERS);

  /** What shoppers can see: approved listings from verified farms. */
  readonly liveCrops = computed(() => {
    const verified = new Set(
      this.farmers()
        .filter((f) => f.status === 'verified')
        .map((f) => f.id),
    );
    return this.products().filter((p) => p.status === 'live' && verified.has(p.farmerId));
  });

  constructor() {
    afterNextRender(() => this.restore());
    effect(() => {
      const snapshot = {
        farmers: this.farmers(),
        customers: this.customers(),
        products: this.products(),
        orders: this.orders(),
      };
      if (!this.loaded) return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        // Storage full or blocked: changes still apply for this visit.
      }
    });
  }

  /** Loads saved data. Safe to call more than once. */
  restore(): void {
    if (this.loaded || !this.isBrowser) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const db = JSON.parse(saved);
        this.farmers.set(db.farmers);
        this.customers.set(db.customers);
        this.products.set(db.products);
        this.orders.set(db.orders);
      }
    } catch {
      // Unreadable storage: keep the starting data.
    }
    this.loaded = true;
  }

  /** Puts everything back to the starting sample data. */
  resetDemo(): void {
    this.farmers.set(FARMERS);
    this.customers.set(CUSTOMERS);
    this.products.set(CROPS);
    this.orders.set(ORDERS);
    this.poolService.reset();
  }

  /* ----------------------------- Lookups ----------------------------- */

  farmerName(id: string): string {
    return this.farmers().find((f) => f.id === id)?.name ?? 'Unknown farm';
  }

  customerName(id: string): string {
    return this.customers().find((c) => c.id === id)?.name ?? 'Unknown customer';
  }

  /* ---------------------------- Products ----------------------------- */

  /** A farmer's new listing waits for admin approval before shoppers see it. */
  addProduct(farmer: Farmer, form: ProductForm): void {
    const slug = form.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const image = DEFAULT_IMAGE[form.category];
    const product: Crop = {
      id: `${slug || 'listing'}-${Date.now().toString(36)}`,
      name: form.name,
      category: form.category,
      price: form.price,
      unit: form.unit,
      unitPlural: UNIT_PLURALS[form.unit] ?? form.unit,
      tags: [],
      image,
      gallery: [image],
      origin: farmer.location,
      blurb: form.description,
      description: form.description,
      highlights: [],
      farmerId: farmer.id,
      status: 'pending',
    };
    this.products.update((list) => [...list, product]);
  }

  updateProduct(id: string, form: ProductForm): void {
    this.products.update((list) =>
      list.map((p) =>
        p.id !== id
          ? p
          : {
              ...p,
              ...form,
              unitPlural: UNIT_PLURALS[form.unit] ?? form.unit,
              blurb: form.description,
              // An edited listing that was rejected goes back to the admin for another look.
              status: p.status === 'rejected' ? 'pending' : p.status,
            },
      ),
    );
  }

  setProductStatus(id: string, status: ProductStatus): void {
    this.products.update((list) => list.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  deleteProduct(id: string): void {
    this.products.update((list) => list.filter((p) => p.id !== id));
  }

  /* ----------------------------- People ------------------------------ */

  setFarmerStatus(id: string, status: FarmerStatus): void {
    this.farmers.update((list) => list.map((f) => (f.id === id ? { ...f, status } : f)));
  }

  updateFarmer(id: string, patch: Partial<Farmer>): void {
    this.farmers.update((list) => list.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  setCustomerStatus(id: string, status: Customer['status']): void {
    this.customers.update((list) => list.map((c) => (c.id === id ? { ...c, status } : c)));
  }

  updateCustomer(id: string, patch: Partial<Customer>): void {
    this.customers.update((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  /* ----------------------------- Orders ------------------------------ */

  /**
   * Turns a basket into orders — one per farm, because each farm fulfils
   * its own. Pool shares are counted towards their pool here.
   */
  placeOrders(customer: Customer, items: CartItem[]): Order[] {
    const byFarm = new Map<string, CartItem[]>();
    for (const item of items) {
      const farmerId = item.farmerId ?? 'f-ogun'; // baskets saved before farms were tracked
      byFarm.set(farmerId, [...(byFarm.get(farmerId) ?? []), item]);
    }

    let next = this.orders().length + 1001;
    const placed: Order[] = [...byFarm].map(([farmerId, lines]) => ({
      id: `FD-${next++}`,
      customerId: customer.id,
      farmerId,
      date: new Date().toISOString().slice(0, 10),
      status: 'Placed',
      address: customer.address,
      total: lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0),
      items: lines.map((l) => ({
        title: l.title,
        detail: l.detail,
        image: l.image,
        unitPrice: l.unitPrice,
        qty: l.qty,
        kind: l.kind ?? 'crop',
        poolId: l.poolId,
      })),
    }));

    for (const item of items) {
      if (item.poolId) this.poolService.contribute(item.poolId, item.unitPrice);
    }
    this.orders.update((orders) => [...orders, ...placed]);
    return placed;
  }

  setOrderStatus(id: string, status: OrderStatus): void {
    this.orders.update((list) => list.map((o) => (o.id === id ? { ...o, status } : o)));
  }
}
