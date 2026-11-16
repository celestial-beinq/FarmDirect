import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Farmer, FarmerStatus, ORDER_STATUSES, OrderStatus, Review, tone } from '../../core/accounts';
import { StoreService } from '../../core/store.service';
import { Icon } from '../../shared/icon';
import { NairaPipe, PhotoPipe } from '../../shared/pipes';
import { DashShell, DashTab } from './dash-shell';
import { Insights } from './insights';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, DatePipe, NairaPipe, PhotoPipe, Icon, DashShell, Insights],
  templateUrl: './admin.html',
})
export class AdminDashboard {
  protected readonly store = inject(StoreService);

  /** The open tab, from "?tab=..." in the URL. */
  readonly tab = input<string>();
  protected readonly active = computed(() => {
    const t = this.tab();
    if (t === 'reports') return 'analytics';
    return t ?? 'overview';
  });

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

  /* ---- Farmers Vetting & Management ---- */
  protected readonly farmerFilter = signal<FarmerStatus | 'all'>('all');
  protected readonly farmerSearch = signal('');
  protected readonly inspectingFarmer = signal<Farmer | null>(null);
  protected readonly rejectionReason = signal('');
  protected readonly copiedNin = signal<string | null>(null);

  protected readonly filteredFarmers = computed(() => {
    let list = this.farmers();
    const filter = this.farmerFilter();
    if (filter !== 'all') {
      list = list.filter((f) => f.farmer.status === filter);
    }
    const q = this.farmerSearch().trim().toLowerCase();
    if (q) {
      list = list.filter(
        (f) =>
          f.farmer.name.toLowerCase().includes(q) ||
          f.owner.toLowerCase().includes(q) ||
          f.farmer.location.toLowerCase().includes(q) ||
          (f.farmer.nin && f.farmer.nin.includes(q)) ||
          (f.farmer.stateOfOrigin && f.farmer.stateOfOrigin.toLowerCase().includes(q)),
      );
    }
    return list;
  });

  protected readonly farmerCounts = computed(() => ({
    all: this.farmers().length,
    pending: this.farmers().filter((f) => f.farmer.status === 'pending').length,
    verified: this.farmers().filter((f) => f.farmer.status === 'verified').length,
    rejected: this.farmers().filter((f) => f.farmer.status === 'rejected').length,
    suspended: this.farmers().filter((f) => f.farmer.status === 'suspended').length,
  }));

  protected openDossier(farmer: Farmer): void {
    this.inspectingFarmer.set(farmer);
    this.rejectionReason.set(farmer.verificationNotes || '');
  }

  protected closeDossier(): void {
    this.inspectingFarmer.set(null);
    this.rejectionReason.set('');
  }

  protected copyNin(nin?: string): void {
    if (!nin) return;
    if (navigator?.clipboard?.writeText) {
      void navigator.clipboard.writeText(nin);
    }
    this.copiedNin.set(nin);
    setTimeout(() => {
      if (this.copiedNin() === nin) {
        this.copiedNin.set(null);
      }
    }, 2000);
  }

  protected verifyFarmer(farmer: Farmer): void {
    void this.store.setFarmerStatus(farmer.id, 'verified', 'Vetted & Verified by Administrator');
    this.closeDossier();
  }

  protected rejectFarmer(farmer: Farmer, reason: string): void {
    const note = reason.trim() || 'Verification documents require correction or re-submission.';
    void this.store.setFarmerStatus(farmer.id, 'rejected', note);
    this.closeDossier();
  }

  protected suspendFarmer(farmer: Farmer): void {
    if (confirm(`Suspend ${farmer.name}? All active listings will be hidden from shoppers.`)) {
      void this.store.setFarmerStatus(farmer.id, 'suspended', 'Suspended by Administrator');
      this.closeDossier();
    }
  }

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
  protected readonly averageRating = computed(() => {
    const list = this.reviews();
    return list.length
      ? Math.round((list.reduce((sum, r) => sum + r.rating, 0) / list.length) * 10) / 10
      : 0;
  });

  /** Selected rating filter: 0 = all ratings, 1-5 = specific star rating. */
  protected readonly filterRating = signal<number>(0);
  /** Search query for review comment, author, or product name. */
  protected readonly searchQuery = signal<string>('');

  protected readonly filteredReviews = computed(() => {
    let list = this.reviews();
    const star = this.filterRating();
    if (star > 0) {
      list = list.filter((r) => r.rating === star);
    }
    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.author.toLowerCase().includes(q) ||
          r.comment.toLowerCase().includes(q) ||
          this.productName(r.productId).toLowerCase().includes(q),
      );
    }
    return list;
  });

  protected readonly satisfactionRate = computed(() => {
    const list = this.reviews();
    if (!list.length) return 100;
    const positive = list.filter((r) => r.rating >= 4).length;
    return Math.round((positive / list.length) * 100);
  });

  protected readonly Math = Math;

  protected ratingCount(star: number): number {
    return this.reviews().filter((r) => r.rating === star).length;
  }

  protected ratingPercent(star: number): number {
    const total = this.reviews().length;
    return total ? Math.round((this.ratingCount(star) / total) * 100) : 0;
  }

  protected product(id: string) {
    return (
      this.store.crops().find((p) => p.id === id) ??
      this.store.animals().find((a) => a.id === id)
    );
  }

  protected productLink(id: string): string[] {
    if (id.startsWith('animal-')) return ['/livestock', id];
    return ['/crops', id];
  }

  protected initials(name: string): string {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('');
  }

  protected readonly tabs = computed<DashTab[]>(() => [
    { id: 'overview', label: 'Overview', icon: 'grid', group: 'Workspace' },
    { id: 'analytics', label: 'Reports & Analytics', icon: 'chart', group: 'Workspace' },
    {
      id: 'orders',
      label: 'Orders',
      icon: 'box',
      group: 'Marketplace',
      count: this.openOrders().length,
    },
    {
      id: 'products',
      label: 'Listings',
      icon: 'tag',
      group: 'Marketplace',
      count: this.pendingProducts().length,
    },
    { id: 'pools', label: 'Livestock Pools', icon: 'users', group: 'Marketplace' },
    {
      id: 'farmers',
      label: 'Farmers',
      icon: 'leaf',
      group: 'People',
      count: this.pendingFarmers().length,
    },
    { id: 'customers', label: 'Customers', icon: 'user', group: 'People' },
    { id: 'reviews', label: 'Reviews', icon: 'star', group: 'People' },
  ]);

  /* ---- Orders table: filter by status, search, and page through ---- */
  protected readonly orderStatus = signal<OrderStatus | 'All'>('All');
  protected readonly orderSearch = signal('');
  protected readonly pageSizes = [12, 25, 50];
  protected readonly pageSize = signal(12);
  private readonly pageWanted = signal(1);

  /** "All" and each status, with how many orders it holds. */
  protected readonly orderFilters = computed(() => [
    { status: 'All' as const, count: this.orders().length },
    ...ORDER_STATUSES.map((status) => ({
      status,
      count: this.orders().filter((o) => o.status === status).length,
    })),
  ]);

  protected readonly matchingOrders = computed(() => {
    const status = this.orderStatus();
    const words = this.orderSearch().trim().toLowerCase();
    return this.orders().filter(
      (o) =>
        (status === 'All' || o.status === status) &&
        (!words ||
          [o.code, o.customerName, this.store.farmerName(o.farmerId)].some((text) =>
            text?.toLowerCase().includes(words),
          )),
    );
  });

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.matchingOrders().length / this.pageSize())),
  );
  /** The page on show; never past the last page, even when the list shrinks. */
  protected readonly page = computed(() => Math.min(this.pageWanted(), this.pageCount()));
  protected readonly pageStart = computed(() => (this.page() - 1) * this.pageSize());
  protected readonly pageOrders = computed(() =>
    this.matchingOrders().slice(this.pageStart(), this.pageStart() + this.pageSize()),
  );
  /** Up to five page numbers around the current one. */
  protected readonly pageNumbers = computed(() => {
    const first = Math.max(1, Math.min(this.page() - 2, this.pageCount() - 4));
    const length = Math.min(5, this.pageCount());
    return Array.from({ length }, (_, i) => first + i);
  });

  protected filterOrders(status: OrderStatus | 'All'): void {
    this.orderStatus.set(status);
    this.pageWanted.set(1);
  }

  protected searchOrders(words: string): void {
    this.orderSearch.set(words);
    this.pageWanted.set(1);
  }

  protected setPageSize(size: string): void {
    this.pageSize.set(Number(size));
    this.pageWanted.set(1);
  }

  protected goToPage(page: number): void {
    this.pageWanted.set(page);
  }

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
