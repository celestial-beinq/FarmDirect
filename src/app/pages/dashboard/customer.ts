import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ORDER_STEPS, Order, OrderItem, tone } from '../../core/accounts';
import { AuthService } from '../../core/auth.service';
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
  protected readonly store = inject(StoreService);

  /** The open tab, from "?tab=..." in the URL. */
  readonly tab = input<string>();
  protected readonly active = computed(() => this.tab() ?? 'overview');

  protected readonly steps = ORDER_STEPS;
  protected readonly tone = tone;

  protected readonly me = this.auth.profile;

  /** My orders, newest first. (The database only sends me my own.) */
  protected readonly orders = computed(() =>
    this.store.orders().filter((o) => o.customerId === this.me()?.id),
  );
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
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'My Orders', count: this.openOrders().length },
    { id: 'shares', label: 'Livestock Shares', count: this.shares().length },
    { id: 'profile', label: 'Profile & Address' },
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
    if (!name.trim()) return this.formError.set('Enter your name.');
    if (!address.trim()) return this.formError.set('Enter a delivery address.');
    const error = await this.store.updateMyProfile(name.trim(), phone.trim(), address.trim());
    this.formError.set(error ?? '');
    this.saved.set(!error);
  }
}
