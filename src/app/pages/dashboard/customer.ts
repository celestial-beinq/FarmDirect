import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ORDER_STEPS, Order, OrderItem, OrderStatus, tone } from '../../core/accounts';
import { AuthService } from '../../core/auth.service';
import { CartService } from '../../core/cart.service';
import { sanitizePhone, sanitizeText } from '../../core/sanitizer';
import { StoreService } from '../../core/store.service';
import { Icon } from '../../shared/icon';
import { NairaPipe, PhotoPipe } from '../../shared/pipes';
import { DashShell, DashTab } from './dash-shell';
import { Insights } from './insights';

@Component({
  selector: 'app-customer-dashboard',
  imports: [RouterLink, DatePipe, NairaPipe, PhotoPipe, DashShell, Insights, Icon],
  templateUrl: './customer.html',
})
export class CustomerDashboard {
  private readonly auth = inject(AuthService);
  protected readonly store = inject(StoreService);
  private readonly cart = inject(CartService);
  private readonly router = inject(Router);

  /** The open tab, from "?tab=..." in the URL. */
  readonly tab = input<string>();
  protected readonly active = computed(() => this.tab() ?? 'overview');

  protected readonly steps = ORDER_STEPS;
  protected readonly tone = tone;
  protected readonly Math = Math;

  /* ---- Orders in progress view, search, date filter & pagination ---- */
  protected readonly viewMode = signal<'table' | 'cards'>('table');
  protected readonly orderSearch = signal('');
  protected readonly statusFilter = signal<'all' | OrderStatus>('all');
  protected readonly datePreset = signal<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');
  protected readonly expandedOrderId = signal<string | null>(null);

  protected readonly pageSizes = [5, 10, 15, 25];
  protected readonly pageSize = signal(5);
  private readonly pageWanted = signal(1);

  protected readonly hasActiveFilters = computed(() => {
    return (
      Boolean(this.orderSearch().trim()) ||
      this.statusFilter() !== 'all' ||
      this.datePreset() !== 'all' ||
      Boolean(this.dateFrom()) ||
      Boolean(this.dateTo())
    );
  });

  protected readonly matchingOpenOrders = computed(() => {
    const list = this.openOrders();
    const search = this.orderSearch().trim().toLowerCase();
    const status = this.statusFilter();
    const preset = this.datePreset();
    const from = this.dateFrom();
    const to = this.dateTo();

    const now = Date.now();
    const dayMs = 86400000;

    return list.filter((order) => {
      if (status !== 'all' && order.status !== status) {
        return false;
      }

      if (search) {
        const farm = this.store.farmerName(order.farmerId)?.toLowerCase() ?? '';
        const code = order.code.toLowerCase();
        const items = order.items.map((i) => i.title.toLowerCase()).join(' ');
        if (!code.includes(search) && !farm.includes(search) && !items.includes(search)) {
          return false;
        }
      }

      if (preset !== 'all') {
        const orderTime = new Date(order.date).getTime();
        const orderDateStr = order.date.slice(0, 10);

        if (preset === 'today') {
          const todayStr = new Date().toISOString().slice(0, 10);
          if (orderDateStr !== todayStr) return false;
        } else if (preset === '7days') {
          if (orderTime < now - 7 * dayMs) return false;
        } else if (preset === '30days') {
          if (orderTime < now - 30 * dayMs) return false;
        } else if (preset === 'custom') {
          if (from && orderDateStr < from) return false;
          if (to && orderDateStr > to) return false;
        }
      }

      return true;
    });
  });

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.matchingOpenOrders().length / this.pageSize())),
  );
  protected readonly page = computed(() => Math.min(this.pageWanted(), this.pageCount()));
  protected readonly pageStart = computed(() => (this.page() - 1) * this.pageSize());
  protected readonly pageOrders = computed(() =>
    this.matchingOpenOrders().slice(this.pageStart(), this.pageStart() + this.pageSize()),
  );
  protected readonly pageNumbers = computed(() => {
    const total = this.pageCount();
    const current = this.page();
    const first = Math.max(1, Math.min(current - 2, total - 4));
    const length = Math.min(5, total);
    return Array.from({ length }, (_, i) => first + i);
  });

  protected setOrderSearch(val: string): void {
    this.orderSearch.set(val);
    this.pageWanted.set(1);
  }

  protected setStatusFilter(val: 'all' | OrderStatus): void {
    this.statusFilter.set(val);
    this.pageWanted.set(1);
  }

  protected setDatePreset(val: 'all' | 'today' | '7days' | '30days' | 'custom'): void {
    this.datePreset.set(val);
    if (val !== 'custom') {
      this.dateFrom.set('');
      this.dateTo.set('');
    }
    this.pageWanted.set(1);
  }

  protected setDateFrom(val: string): void {
    this.dateFrom.set(val);
    this.datePreset.set('custom');
    this.pageWanted.set(1);
  }

  protected setDateTo(val: string): void {
    this.dateTo.set(val);
    this.datePreset.set('custom');
    this.pageWanted.set(1);
  }

  protected setPageSize(val: string | number): void {
    this.pageSize.set(Number(val));
    this.pageWanted.set(1);
  }

  protected goToPage(p: number): void {
    this.pageWanted.set(p);
  }

  protected toggleExpand(orderId: string): void {
    this.expandedOrderId.set(this.expandedOrderId() === orderId ? null : orderId);
  }

  protected resetFilters(): void {
    this.orderSearch.set('');
    this.statusFilter.set('all');
    this.datePreset.set('all');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.pageWanted.set(1);
  }

  protected itemsSummary(order: Order): string {
    if (!order.items.length) return 'No items';
    const first = order.items[0].title;
    if (order.items.length === 1) return first;
    return `${first} + ${order.items.length - 1} more`;
  }

  protected itemsTooltip(order: Order): string {
    return order.items.map((i) => `${i.title} (${i.qty}×)`).join(', ');
  }

  protected readonly me = computed(() => {
    return (
      this.auth.profile() ?? {
        id: 'u-cust-1',
        role: 'customer' as const,
        name: 'Ngozi Adebayo',
        email: 'ngozi.adebayo@gmail.com',
        phone: '0805 333 4455',
        address: 'Plot 18 Admiralty Way, Lekki Phase 1, Lagos',
        status: 'active' as const,
        joined: '2026-06-12T14:20:00Z',
      }
    );
  });

  /** My orders, newest first. (The database only sends me my own; falls back to mock demo orders) */
  protected readonly orders = computed(() => {
    const uid = this.me().id;
    const all = this.store.orders();
    const own = all.filter((o) => o.customerId === uid);
    return own.length ? own : all.slice(0, 5);
  });
  protected readonly openOrders = computed(() =>
    this.orders().filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled'),
  );
  /** Money actually paid: orders that got past "Awaiting payment". */
  protected readonly spent = computed(() =>
    this.orders()
      .filter((o) => o.status !== 'Cancelled' && o.status !== 'Awaiting payment')
      .reduce((sum, o) => sum + o.total, 0),
  );

  /** Every livestock share I have paid for, with how its pool is doing. */
  protected readonly shares = computed(() => {
    const pools = this.store.pools();
    return this.orders()
      .filter((o) => o.status !== 'Cancelled' && o.status !== 'Awaiting payment')
      .flatMap((o) =>
        o.items
          .filter((i) => i.kind === 'pool')
          .map((item) => {
            const pool = pools.find((p) => p.id === item.poolId);
            const percent = pool
              ? Math.min(100, Math.round((pool.raised / pool.target) * 100))
              : null;
            return { order: o, item, pool, percent };
          }),
      );
  });

  protected readonly tabs = computed<DashTab[]>(() => [
    { id: 'overview', label: 'Overview', icon: 'grid', group: 'Workspace' },
    {
      id: 'orders',
      label: 'My Orders',
      icon: 'box',
      group: 'Shopping',
      count: this.openOrders().length,
    },
    {
      id: 'shares',
      label: 'Livestock Shares',
      icon: 'users',
      group: 'Shopping',
      count: this.shares().length,
    },
    { id: 'profile', label: 'Profile & Address', icon: 'user', group: 'Account' },
  ]);

  protected readonly saved = signal(false);
  protected readonly formError = signal('');

  /** How far along the Placed → Delivered track an order is. */
  protected stepIndex(order: Order): number {
    return this.steps.indexOf(order.status as (typeof ORDER_STEPS)[number]);
  }

  /** Where to go to review an item from a delivered order. */
  protected reviewLink(item: OrderItem): string[] | null {
    if (!item.productId) return null;
    return [item.kind === 'crop' ? '/crops' : '/livestock', item.productId];
  }

  protected async saveProfile(name: string, phone: string, address: string): Promise<void> {
    this.saved.set(false);
    const cleanName = sanitizeText(name, 120);
    const cleanPhone = sanitizePhone(phone);
    const cleanAddress = sanitizeText(address, 250);

    if (!cleanName) return this.formError.set('Enter your name.');
    if (!cleanAddress) return this.formError.set('Enter a delivery address.');
    const error = await this.store.updateMyProfile(cleanName, cleanPhone, cleanAddress);
    this.formError.set(error ?? '');
    this.saved.set(!error);
  }

  protected async reorder(order: Order): Promise<void> {
    for (const item of order.items) {
      if (item.productId) {
        this.cart.add({
          key: `${item.kind}:${item.productId}:${item.detail}`,
          productId: item.productId,
          poolId: item.poolId ?? undefined,
          kind: item.kind,
          title: item.title,
          detail: item.detail,
          image: item.image,
          unitPrice: item.unitPrice,
          qty: item.qty,
          link: item.kind === 'crop' ? `/crops/${item.productId}` : `/livestock/${item.productId}`,
        });
      }
    }
    await this.router.navigate(['/basket']);
  }
}
