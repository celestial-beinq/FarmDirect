import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ORDER_STATUSES, OrderStatus, Review, tone } from '../../core/accounts';
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

  /** The open tab, from "?tab=..." in the URL. */
  readonly tab = input<string>();
  protected readonly active = computed(() => this.tab() ?? 'overview');

  protected readonly statuses = ORDER_STATUSES;
  protected readonly tone = tone;

  /** Farms with how many listings each has. */
  protected readonly farmers = computed(() =>
    this.store.farmers().map((farmer) => ({
      farmer,
      owner: farmer.ownerId ? this.store.profileName(farmer.ownerId) : 'Sample farm (no login)',
      listings: this.store.crops().filter((p) => p.farmerId === farmer.id).length,
    })),
  );
  protected readonly pendingFarmers = computed(() =>
    this.store.farmers().filter((f) => f.status === 'pending'),
  );
  protected readonly pendingProducts = computed(() =>
    this.store.crops().filter((p) => p.status === 'pending'),
  );

  protected readonly orders = this.store.orders;
  protected readonly openOrders = computed(() =>
    this.orders().filter((o) => ['Placed', 'Confirmed', 'Dispatched'].includes(o.status)),
  );
  /** Money actually received: orders that got past "Awaiting payment". */
  protected readonly sales = computed(() =>
    this.orders()
      .filter((o) => o.status !== 'Cancelled' && o.status !== 'Awaiting payment')
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
    this.store
      .profiles()
      .filter((p) => p.role === 'customer')
      .map((customer) => ({
        customer,
        orders: this.orders().filter((o) => o.customerId === customer.id).length,
      })),
  );

  /** Pools with the animal they are for and how funded they are. */
  protected readonly pools = computed(() =>
    this.store.pools().map((pool) => ({
      pool,
      animal: this.store.animals().find((a) => a.id === pool.animalId),
      percent: Math.min(100, Math.round((pool.raised / pool.target) * 100)),
    })),
  );

  protected readonly reviews = signal<Review[]>([]);

  protected readonly tabs = computed<DashTab[]>(() => [
    { id: 'overview', label: 'Overview' },
    { id: 'farmers', label: 'Farmers', count: this.pendingFarmers().length },
    { id: 'products', label: 'Listings', count: this.pendingProducts().length },
    { id: 'orders', label: 'Orders', count: this.openOrders().length },
    { id: 'pools', label: 'Livestock Pools' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'customers', label: 'Customers' },
  ]);

  constructor() {
    // Load reviews the first time the Reviews tab is opened.
    effect(() => {
      if (this.active() === 'reviews') untracked(() => void this.loadReviews());
    });
  }

  private async loadReviews(): Promise<void> {
    this.reviews.set(await this.store.loadReviews());
  }

  protected productName(id: string): string {
    return (
      this.store.crops().find((p) => p.id === id)?.name ??
      this.store.animals().find((a) => a.id === id)?.name ??
      'Removed listing'
    );
  }

  protected stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  protected setOrderStatus(id: string, status: string): void {
    void this.store.advanceOrder(id, status as OrderStatus);
  }

  protected removePool(id: string, name: string): void {
    if (confirm(`Remove the pool "${name}"? This cannot be undone.`)) {
      void this.store.removePool(id);
    }
  }

  protected async removeReview(review: Review): Promise<void> {
    if (!confirm(`Delete this review by ${review.author}? This cannot be undone.`)) return;
    const error = await this.store.deleteReview(review.id);
    this.store.error.set(error ?? '');
    await this.loadReviews();
  }
}
