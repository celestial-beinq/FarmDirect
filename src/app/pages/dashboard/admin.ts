import { DatePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ORDER_STATUSES, OrderStatus, tone } from '../../core/accounts';
import { ANIMALS } from '../../core/data';
import { PoolService } from '../../core/pool.service';
import { StoreService } from '../../core/store.service';
import { NairaPipe } from '../../shared/pipes';
import { DashShell, DashTab } from './dash-shell';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, DatePipe, NairaPipe, DashShell],
  templateUrl: './admin.html',
})
export class AdminDashboard {
  protected readonly store = inject(StoreService);
  protected readonly poolService = inject(PoolService);

  /** The open tab, from "?tab=..." in the URL. */
  readonly tab = input<string>();
  protected readonly active = computed(() => this.tab() ?? 'overview');

  protected readonly statuses = ORDER_STATUSES;
  protected readonly tone = tone;

  /** Farms with how many listings each has. */
  protected readonly farmers = computed(() =>
    this.store.farmers().map((farmer) => ({
      farmer,
      listings: this.store.products().filter((p) => p.farmerId === farmer.id).length,
    })),
  );
  protected readonly pendingFarmers = computed(() =>
    this.store.farmers().filter((f) => f.status === 'pending'),
  );
  protected readonly pendingProducts = computed(() =>
    this.store.products().filter((p) => p.status === 'pending'),
  );

  /** All orders, newest first. */
  protected readonly orders = computed(() =>
    [...this.store.orders()].sort(
      (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
    ),
  );
  protected readonly openOrders = computed(() =>
    this.orders().filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled'),
  );
  protected readonly sales = computed(() =>
    this.orders()
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0),
  );
  /** How many orders sit at each status, for the overview breakdown. */
  protected readonly byStatus = computed(() =>
    ORDER_STATUSES.map((status) => ({
      status,
      count: this.orders().filter((o) => o.status === status).length,
    })),
  );

  /** Customers with how many orders each has placed. */
  protected readonly customers = computed(() =>
    this.store.customers().map((customer) => ({
      customer,
      orders: this.store.orders().filter((o) => o.customerId === customer.id).length,
    })),
  );

  /** Pools with the animal they are for and how funded they are. */
  protected readonly pools = computed(() =>
    this.poolService.pools().map((pool) => {
      const animal = ANIMALS.find((a) => a.id === pool.animalId);
      const target = animal?.price ?? 0;
      const percent = target ? Math.min(100, Math.round((pool.raised / target) * 100)) : 0;
      return { pool, animal, target, percent };
    }),
  );

  protected readonly tabs = computed<DashTab[]>(() => [
    { id: 'overview', label: 'Overview' },
    { id: 'farmers', label: 'Farmers', count: this.pendingFarmers().length },
    { id: 'products', label: 'Listings', count: this.pendingProducts().length },
    { id: 'orders', label: 'Orders', count: this.openOrders().length },
    { id: 'pools', label: 'Livestock Pools' },
    { id: 'customers', label: 'Customers' },
  ]);

  protected setOrderStatus(id: string, status: string): void {
    this.store.setOrderStatus(id, status as OrderStatus);
  }

  protected removePool(id: string, name: string): void {
    if (confirm(`Remove the pool "${name}"? This cannot be undone.`)) this.poolService.remove(id);
  }

  protected resetDemo(): void {
    if (confirm('Reset all farmers, listings, orders, pools and customers to the sample data?')) {
      this.store.resetDemo();
    }
  }
}
