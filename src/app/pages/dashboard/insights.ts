import { DatePipe } from '@angular/common';
import { Component, booleanAttribute, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Order, OrderStatus, tone } from '../../core/accounts';
import {
  change,
  compactNaira,
  dailySeries,
  groupSum,
  isPaid,
  lastDays,
} from '../../core/analytics';
import { StoreService } from '../../core/store.service';
import { ChartSlice, DonutChart, TimeChart } from '../../shared/charts';
import { Icon } from '../../shared/icon';
import { NairaPipe, formatNaira } from '../../shared/pipes';

/** Each category and status keeps one colour everywhere it appears. */
const CATEGORY_COLORS: Record<string, string> = {
  Vegetables: 'var(--chart-1)',
  Fruits: 'var(--chart-2)',
  Tubers: 'var(--chart-3)',
  Grains: 'var(--chart-4)',
  Livestock: 'var(--chart-5)',
  'Livestock pools': 'var(--chart-6)',
};
const STATUS_COLORS: Record<OrderStatus, string> = {
  Placed: 'var(--chart-1)',
  Confirmed: 'var(--chart-2)',
  Dispatched: 'var(--chart-3)',
  'Awaiting payment': 'var(--chart-4)',
  Cancelled: 'var(--chart-5)',
  Delivered: 'var(--chart-6)',
};
const STATUS_ORDER = Object.keys(STATUS_COLORS) as OrderStatus[];

/**
 * Analytics and performance charts built from orders data.
 *  - "overview": compact two charts for dashboard home
 *  - "analytics": analytics charts paired with an interactive breakdown table
 */
@Component({
  selector: 'app-insights',
  imports: [DatePipe, NairaPipe, TimeChart, DonutChart, Icon],
  templateUrl: './insights.html',
})
export class Insights {
  protected readonly store = inject(StoreService);
  protected readonly Math = Math;
  protected readonly tone = tone;

  readonly orders = input.required<Order[]>();
  readonly view = input<'overview' | 'analytics' | 'reports'>('overview');
  /** What the money is called here: "Revenue", "Sales" or "Spending". */
  readonly noun = input('Revenue');
  /** Also break sales down by farm (for the admin). */
  readonly byFarm = input(false, { transform: booleanAttribute });

  protected readonly ranges = [7, 30, 90];
  protected readonly range = signal(30);
  /** How many days everything on screen covers. */
  protected readonly days = computed(() => (this.view() === 'overview' ? 30 : this.range()));

  protected readonly money = formatNaira;
  protected readonly shortMoney = compactNaira;

  /* ---- Table tab & search filter state ---- */
  protected readonly tableTab = signal<'products' | 'orders' | 'farms'>('products');
  protected readonly tableSearch = signal('');

  /* ---- Table Pagination (15 items per page) ---- */
  readonly PAGE_SIZE = 15;
  private readonly pageWanted = signal(1);

  constructor() {
    effect(() => {
      this.tableTab();
      this.tableSearch();
      this.range();
      untracked(() => this.pageWanted.set(1));
    });
  }

  protected readonly currentListLength = computed(() => {
    switch (this.tableTab()) {
      case 'products':
        return this.filteredProducts().length;
      case 'orders':
        return this.filteredOrders().length;
      case 'farms':
        return this.filteredFarms().length;
    }
  });

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.currentListLength() / this.PAGE_SIZE)),
  );

  protected readonly page = computed(() =>
    Math.min(this.pageWanted(), this.pageCount()),
  );

  protected readonly pageStart = computed(() => (this.page() - 1) * this.PAGE_SIZE);

  protected readonly pagedProducts = computed(() =>
    this.filteredProducts().slice(this.pageStart(), this.pageStart() + this.PAGE_SIZE),
  );

  protected readonly pagedOrders = computed(() =>
    this.filteredOrders().slice(this.pageStart(), this.pageStart() + this.PAGE_SIZE),
  );

  protected readonly pagedFarms = computed(() =>
    this.filteredFarms().slice(this.pageStart(), this.pageStart() + this.PAGE_SIZE),
  );

  protected readonly pageNumbers = computed(() => {
    const first = Math.max(1, Math.min(this.page() - 2, this.pageCount() - 4));
    const length = Math.min(5, this.pageCount());
    return Array.from({ length }, (_, i) => first + i);
  });

  protected goToPage(p: number): void {
    this.pageWanted.set(p);
  }

  private readonly paid = computed(() => this.orders().filter(isPaid));
  /** This period and the one before it, so the two can be compared. */
  private readonly bothPeriods = computed(() => dailySeries(this.paid(), this.days() * 2));
  protected readonly daily = computed(() => this.bothPeriods().slice(this.days()));
  private readonly before = computed(() => this.bothPeriods().slice(0, this.days()));

  protected readonly revenuePoints = computed(() =>
    this.daily().map((d) => ({ label: d.label, value: d.revenue })),
  );

  /** Paid orders in the period. */
  private readonly current = computed(() => lastDays(this.paid(), this.days()));
  /** All orders in the period (including pending, dispatched, delivered). */
  protected readonly periodOrders = computed(() => lastDays(this.orders(), this.days()));

  protected readonly revenue = computed(() => this.current().reduce((sum, o) => sum + o.total, 0));
  protected readonly orderCount = computed(() => this.current().length);
  protected readonly average = computed(() =>
    this.orderCount() ? Math.round(this.revenue() / this.orderCount()) : 0,
  );
  protected readonly buyers = computed(() => new Set(this.current().map((o) => o.customerId)).size);

  protected readonly revenueChange = computed(() =>
    change(
      this.revenue(),
      this.before().reduce((sum, d) => sum + d.revenue, 0),
    ),
  );
  protected readonly ordersChange = computed(() =>
    change(
      this.orderCount(),
      this.before().reduce((sum, d) => sum + d.orders, 0),
    ),
  );

  /** Slices for category donut chart. */
  private readonly items = computed(() => this.current().flatMap((o) => o.items));

  protected readonly categorySlices = computed<ChartSlice[]>(() => {
    const crops = new Map(this.store.crops().map((c) => [c.id, c.category as string]));
    const totals = new Map(
      groupSum(
        this.items(),
        (i) =>
          i.kind === 'pool'
            ? 'Livestock pools'
            : i.kind === 'animal'
              ? 'Livestock'
              : ((i.productId && crops.get(i.productId)) ?? 'Other produce'),
        (i) => i.unitPrice * i.qty,
      ).map((g) => [g.label, g.value]),
    );
    return [...Object.keys(CATEGORY_COLORS), 'Other produce']
      .filter((label) => totals.has(label))
      .map((label) => ({
        label,
        value: totals.get(label)!,
        color: CATEGORY_COLORS[label] ?? 'var(--chart-other)',
      }));
  });

  /** Slices for status donut chart (overview view). */
  protected readonly statusRows = computed(() => {
    const orders = lastDays(this.orders(), this.days());
    return STATUS_ORDER.map((status) => {
      const matching = orders.filter((o) => o.status === status);
      return {
        status,
        count: matching.length,
        value: matching.reduce((sum, o) => sum + o.total, 0),
      };
    }).filter((row) => row.count > 0);
  });

  protected readonly statusSlices = computed<ChartSlice[]>(() =>
    this.statusRows().map((row) => ({
      label: row.status,
      value: row.count,
      color: STATUS_COLORS[row.status],
    })),
  );

  /* ---- Table data & filtered views ---- */
  protected readonly products = computed(() =>
    groupSum(
      this.items(),
      (i) => i.title,
      (i) => i.unitPrice * i.qty,
      (i) => i.qty,
    ),
  );

  protected readonly farms = computed(() =>
    groupSum(
      this.current(),
      (o) => this.store.farmerName(o.farmerId),
      (o) => o.total,
    ),
  );

  protected readonly filteredProducts = computed(() => {
    const q = this.tableSearch().trim().toLowerCase();
    const list = this.products();
    if (!q) return list;
    return list.filter((p) => p.label.toLowerCase().includes(q));
  });

  protected readonly filteredOrders = computed(() => {
    const q = this.tableSearch().trim().toLowerCase();
    const list = this.periodOrders();
    if (!q) return list;
    return list.filter(
      (o) =>
        o.code.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q) ||
        this.store.farmerName(o.farmerId).toLowerCase().includes(q),
    );
  });

  protected readonly filteredFarms = computed(() => {
    const q = this.tableSearch().trim().toLowerCase();
    const list = this.farms();
    if (!q) return list;
    return list.filter((f) => f.label.toLowerCase().includes(q));
  });

  protected readonly filteredProductsTotal = computed(() => {
    const rows = this.filteredProducts();
    return {
      units: rows.reduce((sum, r) => sum + r.count, 0),
      value: rows.reduce((sum, r) => sum + r.value, 0),
    };
  });

  protected readonly filteredOrdersTotal = computed(() => {
    const rows = this.filteredOrders();
    return {
      count: rows.length,
      value: rows.reduce((sum, r) => sum + r.total, 0),
    };
  });

  protected readonly filteredFarmsTotal = computed(() => {
    const rows = this.filteredFarms();
    return {
      orders: rows.reduce((sum, r) => sum + r.count, 0),
      value: rows.reduce((sum, r) => sum + r.value, 0),
    };
  });

  protected readonly searchPlaceholder = computed(() => {
    switch (this.tableTab()) {
      case 'products':
        return 'Search products...';
      case 'orders':
        return 'Search orders, customers...';
      case 'farms':
        return 'Search farms...';
    }
  });

  /** "▲ 12% vs previous 30 days" */
  protected trend(percent: number | null): string {
    if (percent === null) return 'No earlier sales to compare with';
    const arrow = percent > 0 ? '▲ ' : percent < 0 ? '▼ ' : '';
    return `${arrow}${Math.abs(percent)}% vs previous ${this.days()} days`;
  }
}
