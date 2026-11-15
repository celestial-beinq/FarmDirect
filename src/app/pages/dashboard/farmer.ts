import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { tone } from '../../core/accounts';
import { AuthService } from '../../core/auth.service';
import { CROP_CATEGORIES, Crop, UNIT_PLURALS } from '../../core/data';
import { ProductForm, StoreService } from '../../core/store.service';
import { NairaPipe, PhotoPipe } from '../../shared/pipes';
import { DashShell, DashTab } from './dash-shell';

const EMPTY_FORM: ProductForm = {
  name: '',
  category: 'Vegetables',
  price: 0,
  unit: 'kg',
  description: '',
};

@Component({
  selector: 'app-farmer-dashboard',
  imports: [RouterLink, DatePipe, NairaPipe, PhotoPipe, DashShell],
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

  protected readonly me = computed(() =>
    this.store.farmers().find((f) => f.id === this.auth.session()?.id),
  );

  protected readonly products = computed(() =>
    this.store.products().filter((p) => p.farmerId === this.me()?.id),
  );
  /** Orders for my farm, newest first. */
  protected readonly orders = computed(() =>
    this.store
      .orders()
      .filter((o) => o.farmerId === this.me()?.id)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
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

  protected readonly tabs = computed<DashTab[]>(() => [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: 'My Produce' },
    { id: 'orders', label: 'Orders', count: this.toFulfil().length },
    { id: 'profile', label: 'Farm Profile' },
  ]);

  /* ---- Add / edit listing form ---- */
  /** null = form closed, "new" = adding, otherwise the id being edited. */
  protected readonly editing = signal<string | null>(null);
  protected readonly form = signal<ProductForm>(EMPTY_FORM);
  protected readonly formError = signal('');
  protected readonly saved = signal(false);

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
    this.form.update((f) => ({ ...f, [field]: field === 'price' ? Number(value) || 0 : value }));
  }

  protected saveProduct(): void {
    const me = this.me();
    const form = { ...this.form(), name: this.form().name.trim() };
    if (!me) return;
    if (!form.name) return this.formError.set('Give the listing a name.');
    if (form.price <= 0) return this.formError.set('Enter a price above ₦0.');

    if (this.editing() === 'new') this.store.addProduct(me, form);
    else this.store.updateProduct(this.editing()!, form);
    this.editing.set(null);
  }

  protected togglePause(product: Crop): void {
    this.store.setProductStatus(product.id, product.status === 'live' ? 'paused' : 'live');
  }

  protected remove(product: Crop): void {
    if (confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      this.store.deleteProduct(product.id);
    }
  }

  protected saveProfile(name: string, owner: string, location: string, phone: string): void {
    const me = this.me();
    if (!me || !name.trim()) return;
    this.store.updateFarmer(me.id, {
      name: name.trim(),
      owner: owner.trim(),
      location: location.trim(),
      phone: phone.trim(),
    });
    this.saved.set(true);
  }
}
