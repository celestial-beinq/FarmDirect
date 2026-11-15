import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ORDER_STEPS, Order, tone } from '../../core/accounts';
import { AuthService } from '../../core/auth.service';
import { ANIMALS } from '../../core/data';
import { PoolService } from '../../core/pool.service';
import { StoreService } from '../../core/store.service';
import { NairaPipe, PhotoPipe } from '../../shared/pipes';
import { DashShell, DashTab } from './dash-shell';

@Component({
  selector: 'app-customer-dashboard',
  imports: [RouterLink, DatePipe, NairaPipe, PhotoPipe, DashShell],
  templateUrl: './customer.html',
})
export class CustomerDashboard {
  private readonly auth = inject(AuthService);
  private readonly poolService = inject(PoolService);
  protected readonly store = inject(StoreService);

  /** The open tab, from "?tab=..." in the URL. */
  readonly tab = input<string>();
  protected readonly active = computed(() => this.tab() ?? 'overview');

  protected readonly steps = ORDER_STEPS;
  protected readonly tone = tone;

  protected readonly me = computed(() =>
    this.store.customers().find((c) => c.id === this.auth.session()?.id),
  );

  /** My orders, newest first. */
  protected readonly orders = computed(() =>
    this.store
      .orders()
      .filter((o) => o.customerId === this.me()?.id)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
  );
  protected readonly openOrders = computed(() =>
    this.orders().filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled'),
  );
  protected readonly spent = computed(() =>
    this.orders()
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0),
  );

  /** Every livestock share I have bought, with how its pool is doing. */
  protected readonly shares = computed(() => {
    const pools = this.poolService.pools();
    return this.orders()
      .filter((o) => o.status !== 'Cancelled')
      .flatMap((o) =>
        o.items
          .filter((i) => i.kind === 'pool')
          .map((item) => {
            const pool = pools.find((p) => p.id === item.poolId);
            const animal = ANIMALS.find((a) => a.id === pool?.animalId);
            const percent =
              pool && animal ? Math.min(100, Math.round((pool.raised / animal.price) * 100)) : null;
            return { order: o, item, pool, animal, percent };
          }),
      );
  });

  protected readonly tabs = computed<DashTab[]>(() => [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'My Orders', count: this.openOrders().length },
    { id: 'shares', label: 'Livestock Shares', count: this.shares().length },
    { id: 'profile', label: 'Profile & Address' },
  ]);

  protected readonly saved = signal(false);

  /** How far along the Placed → Delivered track an order is. */
  protected stepIndex(order: Order): number {
    return this.steps.indexOf(order.status as (typeof ORDER_STEPS)[number]);
  }

  protected saveProfile(name: string, phone: string, address: string): void {
    const me = this.me();
    if (!me || !name.trim() || !address.trim()) return;
    this.store.updateCustomer(me.id, {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
    });
    this.saved.set(true);
  }
}
