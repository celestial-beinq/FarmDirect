import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Review, tone } from '../../core/accounts';
import { AuthService } from '../../core/auth.service';
import { CROP_CATEGORIES, Crop, UNIT_PLURALS } from '../../core/data';
import { ProductForm, StoreService } from '../../core/store.service';
import { Icon } from '../../shared/icon';
import { NairaPipe, PhotoPipe } from '../../shared/pipes';
import { DashShell, DashTab } from './dash-shell';
import { Insights } from './insights';

const EMPTY_FORM: ProductForm = {
  name: '',
  category: 'Vegetables',
  price: 0,
  unit: 'kg',
  description: '',
};

@Component({
  selector: 'app-farmer-dashboard',
  imports: [RouterLink, DatePipe, NairaPipe, PhotoPipe, Icon, DashShell, Insights],
  templateUrl: './farmer.html',
})
export class FarmerDashboard {
  private readonly auth = inject(AuthService);
  protected readonly store = inject(StoreService);

  /** The open tab, from "?tab=..." in the URL. */
  readonly tab = input<string>();
  protected readonly active = computed(() => this.tab() ?? 'overview');

  protected readonly categories = CROP_CATEGORIES;
  protected readonly units = Object.keys(UNIT_PLURALS);
  protected readonly tone = tone;

  /** My farm. */
  protected readonly me = computed(() =>
    this.store.farmers().find((f) => f.ownerId === this.auth.userId()) ?? this.store.farmers()[0],
  );
  protected readonly suspended = computed(() => this.auth.profile()?.status === 'suspended');

  protected readonly products = computed(() =>
    this.store.crops().filter((p) => p.farmerId === this.me()?.id),
  );
  /** Paid orders for my farm, newest first. */
  protected readonly orders = computed(() =>
    this.store
      .orders()
      .filter((o) => o.farmerId === this.me()?.id && o.status !== 'Awaiting payment'),
  );
  /** Orders that still need something from me. */
  protected readonly toFulfil = computed(() =>
    this.orders().filter((o) => o.status === 'Placed' || o.status === 'Confirmed'),
  );

  protected readonly liveCount = computed(
    () => this.products().filter((p) => p.status === 'live').length,
  );
  protected readonly pendingCount = computed(
    () => this.products().filter((p) => p.status === 'pending').length,
  );
  protected readonly sales = computed(() =>
    this.orders()
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0),
  );
  protected readonly delivered = computed(() =>
    this.orders()
      .filter((o) => o.status === 'Delivered')
      .reduce((sum, o) => sum + o.total, 0),
  );

  /** What customers have said about my produce. */
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
  /** Active review id being replied to by the farmer. */
  protected readonly replyingTo = signal<string | null>(null);
  /** Farmer replies stored locally / by review id. */
  protected readonly replies = signal<Record<string, string>>({
    'rev-1': 'Thank you so much Ngozi! We harvested these tomatoes at daybreak right before dispatch. So thrilled your jollof turned out wonderful!',
    'rev-2': 'Thank you Emeka! Our Ofada is processed with modern destoning machinery to guarantee that pristine, stone-free authentic quality.',
  });
  /** Review ID recently copied to clipboard for visual feedback. */
  protected readonly copiedId = signal<string | null>(null);

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
      this.products().find((p) => p.id === id) ??
      this.store.crops().find((p) => p.id === id) ??
      this.store.animals().find((a) => a.id === id)
    );
  }

  protected productCategory(prod: Crop | { name: string }): string {
    return 'category' in prod ? (prod as Crop).category : 'Livestock';
  }

  protected productOrigin(prod: Crop | { name: string }): string {
    return 'origin' in prod ? (prod as Crop).origin : '';
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

  protected copyTestimonial(review: Review): void {
    const text = `"${review.comment}" — ${review.author} on ${this.productName(review.productId)} (FarmDirect ★★★★★)`;
    if (navigator?.clipboard?.writeText) {
      void navigator.clipboard.writeText(text);
    }
    this.copiedId.set(review.id);
    setTimeout(() => {
      if (this.copiedId() === review.id) {
        this.copiedId.set(null);
      }
    }, 2500);
  }

  protected toggleReply(reviewId: string): void {
    this.replyingTo.update((current) => (current === reviewId ? null : reviewId));
  }

  protected saveReply(reviewId: string, replyText: string): void {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    this.replies.update((prev) => ({
      ...prev,
      [reviewId]: trimmed,
    }));
    this.replyingTo.set(null);
  }

  protected readonly tabs = computed<DashTab[]>(() => [
    { id: 'overview', label: 'Overview', icon: 'grid', group: 'Workspace' },
    { id: 'analytics', label: 'Analytics', icon: 'chart', group: 'Workspace' },
    { id: 'reports', label: 'Reports', icon: 'file', group: 'Workspace' },
    { id: 'orders', label: 'Orders', icon: 'box', group: 'Farm', count: this.toFulfil().length },
    { id: 'products', label: 'My Produce', icon: 'tag', group: 'Farm' },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: 'star',
      group: 'Farm',
      count: this.reviews().length,
    },
    { id: 'profile', label: 'Farm Profile', icon: 'leaf', group: 'Account' },
  ]);

  /* ---- Add / edit listing form ---- */
  /** null = form closed, "new" = adding, otherwise the id being edited. */
  protected readonly editing = signal<string | null>(null);
  protected readonly form = signal<ProductForm>(EMPTY_FORM);
  protected readonly formError = signal('');
  protected readonly saved = signal(false);

  constructor() {
    // Load reviews for my products whenever the product list changes.
    effect(() => {
      const ids = this.products().map((p) => p.id);
      untracked(async () => this.reviews.set(await this.store.loadReviews(ids)));
    });
  }

  protected productName(id: string): string {
    return this.products().find((p) => p.id === id)?.name ?? 'Removed listing';
  }

  protected stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  protected startAdd(): void {
    this.form.set(EMPTY_FORM);
    this.formError.set('');
    this.editing.set('new');
  }

  protected startEdit(product: Crop): void {
    this.form.set({
      name: product.name,
      category: product.category,
      price: product.price,
      unit: product.unit,
      description: product.description,
    });
    this.formError.set('');
    this.editing.set(product.id);
  }

  protected setField(field: keyof ProductForm, value: string): void {
    this.form.update((f) => ({
      ...f,
      [field]: field === 'price' ? Math.floor(Number(value)) || 0 : value,
    }));
  }

  protected async saveProduct(): Promise<void> {
    const me = this.me();
    const editing = this.editing();
    const form = { ...this.form(), name: this.form().name.trim() };
    if (!me || !editing) return;
    if (form.name.length < 2) return this.formError.set('Give the listing a name.');
    if (form.price <= 0) return this.formError.set('Enter a price above ₦0.');

    const error =
      editing === 'new'
        ? await this.store.addProduct(me.id, form)
        : await this.store.updateProduct(
            editing,
            form,
            this.products().find((p) => p.id === editing)?.status === 'rejected',
          );
    if (error) return this.formError.set(error);
    this.editing.set(null);
  }

  protected togglePause(product: Crop): void {
    void this.store.setProductStatus(product.id, product.status === 'live' ? 'paused' : 'live');
  }

  protected remove(product: Crop): void {
    if (confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      void this.store.deleteProduct(product.id);
    }
  }

  protected async saveProfile(name: string, location: string): Promise<void> {
    const me = this.me();
    this.saved.set(false);
    if (!me || name.trim().length < 2) return;
    const error = await this.store.updateFarm(me.id, name.trim(), location.trim());
    this.saved.set(!error);
  }
}
