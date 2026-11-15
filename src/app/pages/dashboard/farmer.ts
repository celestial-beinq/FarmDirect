import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Review, tone } from '../../core/accounts';
import { AuthService } from '../../core/auth.service';
import { CROP_CATEGORIES, Crop, UNIT_PLURALS } from '../../core/data';
import { ProductForm, StoreService } from '../../core/store.service';
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
  imports: [RouterLink, DatePipe, NairaPipe, PhotoPipe, DashShell, Insights],
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
