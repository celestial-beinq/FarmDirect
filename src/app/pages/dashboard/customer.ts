import { DatePipe, isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  AddressParts,
  EMPTY_ADDRESS,
  NIGERIAN_STATES,
  ORDER_STEPS,
  ORDER_STATUSES,
  Order,
  OrderItem,
  OrderStatus,
  formatAddress,
  tone,
} from '../../core/accounts';
import { LGAS_BY_STATE } from '../../core/nigeria-lgas';
import { AuthService } from '../../core/auth.service';
import { CartService } from '../../core/cart.service';
import { NG_PHONE_ERROR, cleanNgPhone, isNgPhone, sanitizeText } from '../../core/sanitizer';
import { StoreService } from '../../core/store.service';
import { Icon } from '../../shared/icon';
import { NairaPipe, PhotoPipe } from '../../shared/pipes';
import { DashShell, DashTab } from './dash-shell';
import { Insights } from './insights';
import { DashSettings } from './settings';
import { SuccessToast } from '../../shared/success-toast';

@Component({
  selector: 'app-customer-dashboard',
  imports: [RouterLink, DatePipe, NairaPipe, PhotoPipe, DashShell, Insights, Icon, DashSettings, SuccessToast],
  templateUrl: './customer.html',
})
export class CustomerDashboard {
  private readonly auth = inject(AuthService);
  protected readonly store = inject(StoreService);
  private readonly cart = inject(CartService);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    if (this.isBrowser) {
      void this.auth.ready.then(() => {
        if (!this.me()) {
          void this.router.navigate(['/login']);
        }
      });
      effect(() => {
        if (this.store.loaded() && !this.me()) {
          void this.router.navigate(['/login']);
        }
      });
    }
  }

  /** The open tab, from "?tab=..." in the URL. */
  readonly tab = input<string>();
  protected readonly active = computed(() => this.tab() ?? 'overview');

  protected readonly steps = ORDER_STEPS;
  protected readonly tone = tone;
  protected readonly Math = Math;

  /* ---- Orders in progress view, search, date filter & pagination ---- */
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

  protected readonly orderStatuses = ORDER_STATUSES;

  /* ---- My Orders tab: search, date filter & pagination ---- */
  protected readonly myOrdersSearch = signal('');
  protected readonly myOrdersStatusFilter = signal<'all' | OrderStatus>('all');
  protected readonly myOrdersDatePreset = signal<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  protected readonly myOrdersDateFrom = signal('');
  protected readonly myOrdersDateTo = signal('');
  protected readonly myOrdersExpandedId = signal<string | null>(null);

  protected readonly myOrdersPageSizes = [5, 10, 15, 25];
  protected readonly myOrdersPageSize = signal(5);
  private readonly myOrdersPageWanted = signal(1);

  protected readonly hasActiveMyOrdersFilters = computed(() => {
    return (
      Boolean(this.myOrdersSearch().trim()) ||
      this.myOrdersStatusFilter() !== 'all' ||
      this.myOrdersDatePreset() !== 'all' ||
      Boolean(this.myOrdersDateFrom()) ||
      Boolean(this.myOrdersDateTo())
    );
  });

  protected readonly matchingMyOrders = computed(() => {
    const list = this.orders();
    const search = this.myOrdersSearch().trim().toLowerCase();
    const status = this.myOrdersStatusFilter();
    const preset = this.myOrdersDatePreset();
    const from = this.myOrdersDateFrom();
    const to = this.myOrdersDateTo();

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

  protected readonly myOrdersPageCount = computed(() =>
    Math.max(1, Math.ceil(this.matchingMyOrders().length / this.myOrdersPageSize())),
  );
  protected readonly myOrdersPage = computed(() =>
    Math.min(this.myOrdersPageWanted(), this.myOrdersPageCount()),
  );
  protected readonly myOrdersPageStart = computed(() => (this.myOrdersPage() - 1) * this.myOrdersPageSize());
  protected readonly pagedMyOrders = computed(() =>
    this.matchingMyOrders().slice(
      this.myOrdersPageStart(),
      this.myOrdersPageStart() + this.myOrdersPageSize(),
    ),
  );
  protected readonly myOrdersPageNumbers = computed(() => {
    const total = this.myOrdersPageCount();
    const current = this.myOrdersPage();
    const first = Math.max(1, Math.min(current - 2, total - 4));
    const length = Math.min(5, total);
    return Array.from({ length }, (_, i) => first + i);
  });

  protected setMyOrdersSearch(val: string): void {
    this.myOrdersSearch.set(val);
    this.myOrdersPageWanted.set(1);
  }

  protected setMyOrdersStatusFilter(val: 'all' | OrderStatus): void {
    this.myOrdersStatusFilter.set(val);
    this.myOrdersPageWanted.set(1);
  }

  protected setMyOrdersDatePreset(val: 'all' | 'today' | '7days' | '30days' | 'custom'): void {
    this.myOrdersDatePreset.set(val);
    if (val !== 'custom') {
      this.myOrdersDateFrom.set('');
      this.myOrdersDateTo.set('');
    }
    this.myOrdersPageWanted.set(1);
  }

  protected setMyOrdersDateFrom(val: string): void {
    this.myOrdersDateFrom.set(val);
    this.myOrdersDatePreset.set('custom');
    this.myOrdersPageWanted.set(1);
  }

  protected setMyOrdersDateTo(val: string): void {
    this.myOrdersDateTo.set(val);
    this.myOrdersDatePreset.set('custom');
    this.myOrdersPageWanted.set(1);
  }

  protected setMyOrdersPageSize(val: string | number): void {
    this.myOrdersPageSize.set(Number(val));
    this.myOrdersPageWanted.set(1);
  }

  protected goToMyOrdersPage(p: number): void {
    this.myOrdersPageWanted.set(p);
  }

  protected toggleMyOrdersExpand(orderId: string): void {
    this.myOrdersExpandedId.set(this.myOrdersExpandedId() === orderId ? null : orderId);
  }

  protected resetMyOrdersFilters(): void {
    this.myOrdersSearch.set('');
    this.myOrdersStatusFilter.set('all');
    this.myOrdersDatePreset.set('all');
    this.myOrdersDateFrom.set('');
    this.myOrdersDateTo.set('');
    this.myOrdersPageWanted.set(1);
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

  protected readonly me = computed(() => this.auth.profile());

  /* ---- Delivery address, field by field ---- */
  protected readonly states = NIGERIAN_STATES;
  protected readonly addr = signal<AddressParts>({ ...EMPTY_ADDRESS });
  /** The LGAs of the chosen state. */
  protected readonly lgas = computed(() => LGAS_BY_STATE[this.addr().state] ?? []);
  /** The address on one line, exactly as it will be saved on orders. */
  protected readonly addressPreview = computed(() => formatAddress(this.addr()));
  private addrLoadedFor = '';

  private readonly loadAddress = effect(() => {
    const me = this.me();
    if (!me || me.id === this.addrLoadedFor) return;
    this.addrLoadedFor = me.id;
    const parts = me.addressParts;
    if (parts && (parts.state || parts.street)) {
      this.addr.set({ ...parts });
    } else {
      // Saved before addresses had separate fields: start from the old text so
      // only the state, LGA and city need picking.
      this.addr.set({ ...EMPTY_ADDRESS, street: (me.address ?? '').slice(0, 115) });
    }
  });

  /** Shows a saved number as plain digits (older ones may have spaces). */
  protected readonly cleanPhone = cleanNgPhone;

  /** Keeps the phone box to digits only, at most 11, as the person types or pastes. */
  protected onPhoneInput(input: HTMLInputElement): void {
    const digits = cleanNgPhone(input.value);
    if (input.value !== digits) input.value = digits;
  }

  protected setAddr(field: keyof AddressParts, value: string): void {
    this.saved.set(false);
    this.addr.update((a) => ({
      ...a,
      [field]: value,
      // A new state means the old LGA no longer applies.
      ...(field === 'state' && value !== a.state ? { lga: '' } : {}),
    }));
  }

  /** My orders, newest first. */
  protected readonly orders = computed(() => {
    const uid = this.me()?.id;
    if (!uid) return [];
    return this.store.orders().filter((o) => o.customerId === uid);
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
    { id: 'settings', label: 'Settings', icon: 'settings', group: 'Account' },
  ]);

  protected readonly saved = signal(false);
  /** Bumped after each successful save to play the "Profile saved" animation. */
  protected readonly savedPulse = signal(0);
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

  protected async saveProfile(name: string, phone: string): Promise<void> {
    this.saved.set(false);
    const cleanName = sanitizeText(name, 120);
    const cleanPhone = cleanNgPhone(phone);
    const a = this.addr();

    if (!cleanName) return this.formError.set('Enter your name.');
    if (cleanPhone && !isNgPhone(cleanPhone)) return this.formError.set(NG_PHONE_ERROR);
    if (!a.state) return this.formError.set('Choose your state.');
    if (!a.lga || !this.lgas().includes(a.lga)) {
      return this.formError.set('Choose your local government area.');
    }
    if (!sanitizeText(a.city, 50)) return this.formError.set('Enter your city or town.');
    if (sanitizeText(a.street, 115).length < 5) {
      return this.formError.set('Enter your house number and street.');
    }
    const error = await this.store.updateMyProfile(cleanName, cleanPhone, '', a);
    this.formError.set(error ?? '');
    this.saved.set(!error);
    if (!error) this.savedPulse.update((n) => n + 1);
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
