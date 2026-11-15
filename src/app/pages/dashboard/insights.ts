import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, booleanAttribute, computed, inject, input, signal } from '@angular/core';
import { Order, OrderStatus } from '../../core/accounts';
import {
  change,
  compactNaira,
  dailySeries,
  downloadCsv,
  groupSum,
  isPaid,
  lastDays,
} from '../../core/analytics';
import { StoreService } from '../../core/store.service';
import { BarList, ChartSlice, DonutChart, TimeChart } from '../../shared/charts';
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
/** The order slices are drawn in, which keeps look-alike colours apart. */
const STATUS_ORDER = Object.keys(STATUS_COLORS) as OrderStatus[];

/**
 * Charts and reports built from a list of orders. The admin dashboard gives
 * it every order, a farmer's dashboard only that farm's, a customer's only
 * their own — so the same component serves all three.
 *
 *  - "overview":  two charts for the dashboard's front page
 *  - "analytics": the full set of charts
 *  - "reports":   the same numbers as tables, with CSV downloads
 */
@Component({
  selector: 'app-insights',
  imports: [DatePipe, NgTemplateOutlet, NairaPipe, TimeChart, DonutChart, BarList],
  templateUrl: './insights.html',
})
export class Insights {
  protected readonly store = inject(StoreService);

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

  private readonly paid = computed(() => this.orders().filter(isPaid));
  /** This period and the one before it, so the two can be compared. */
  private readonly bothPeriods = computed(() => dailySeries(this.paid(), this.days() * 2));
  protected readonly daily = computed(() => this.bothPeriods().slice(this.days()));
  private readonly before = computed(() => this.bothPeriods().slice(0, this.days()));

  protected readonly revenuePoints = computed(() =>
    this.daily().map((d) => ({ label: d.label, value: d.revenue })),
  );
  protected readonly orderPoints = computed(() =>
    this.daily().map((d) => ({ label: d.label, value: d.orders })),
  );

  /** Paid orders in the period. */
  private readonly current = computed(() => lastDays(this.paid(), this.days()));
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

  /** Every order in the period by status, including unpaid and cancelled ones. */
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

  /** Everything sold in the period, one entry per order line. */
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
  protected readonly topProducts = computed(() => this.products().slice(0, 6));
  protected readonly topFarms = computed(() => this.farms().slice(0, 6));

  /** Days that had at least one sale, newest first. */
  protected readonly busyDays = computed(() =>
    this.daily()
      .filter((d) => d.orders > 0)
      .reverse(),
  );

  /** "▲ 12% vs previous 30 days" */
  protected trend(percent: number | null): string {
    if (percent === null) return 'No earlier sales to compare with';
    const arrow = percent > 0 ? '▲ ' : percent < 0 ? '▼ ' : '';
    return `${arrow}${Math.abs(percent)}% vs previous ${this.days()} days`;
  }

  protected print(): void {
    window.print();
  }

  protected exportDays(): void {
    this.save('by-day', [
      ['Date', 'Orders', `${this.noun()} (NGN)`],
      ...this.busyDays().map((d) => [d.key, d.orders, d.revenue]),
    ]);
  }

  protected exportProducts(): void {
    this.save('by-product', [
      ['Product', 'Units', `${this.noun()} (NGN)`],
      ...this.products().map((p) => [p.label, p.count, p.value]),
    ]);
  }

  protected exportFarms(): void {
    this.save('by-farm', [
      ['Farm', 'Orders', `${this.noun()} (NGN)`],
      ...this.farms().map((f) => [f.label, f.count, f.value]),
    ]);
  }

  protected exportStatuses(): void {
    this.save('by-status', [
      ['Status', 'Orders', 'Value (NGN)'],
      ...this.statusRows().map((s) => [s.status, s.count, s.value]),
    ]);
  }

  protected exportOrders(): void {
    this.save('orders', [
      ['Order', 'Date', 'Customer', 'Farm', 'Status', 'Total (NGN)'],
      ...lastDays(this.orders(), this.days()).map((o) => [
        o.code,
        o.date.slice(0, 10),
        o.customerName,
        this.store.farmerName(o.farmerId),
        o.status,
        o.total,
      ]),
    ]);
  }

  private save(name: string, rows: (string | number)[][]): void {
    downloadCsv(`farmdirect-${name}-last-${this.days()}-days.csv`, rows);
  }
}
