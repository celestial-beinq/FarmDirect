import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AddressParts,
  EMPTY_ADDRESS,
  NIGERIAN_STATES,
  formatAddress,
  Review,
  getFarmerVerificationErrors,
  isFarmerVerified,
  tone,
} from '../../core/accounts';
import { AuthService } from '../../core/auth.service';
import { CROP_CATEGORIES, Crop, UNIT_PLURALS } from '../../core/data';
import { sanitizeNumber, sanitizeText, sanitizeUrl } from '../../core/sanitizer';
import { ProductForm, StoreService } from '../../core/store.service';
import { Icon } from '../../shared/icon';
import { NairaPipe, PhotoPipe } from '../../shared/pipes';
import { DashShell, DashTab } from './dash-shell';
import { Insights } from './insights';
import { LGAS_BY_STATE } from '../../core/nigeria-lgas';
import { AddressFields } from '../../shared/address-fields';
import { SuccessToast } from '../../shared/success-toast';
import { DashSettings } from './settings';
import { SettingsService } from '../../core/settings.service';

const EMPTY_FORM: ProductForm = {
  name: '',
  category: 'Vegetables',
  price: 0,
  unit: 'kg',
  quantity: 10,
  description: '',
};

@Component({
  selector: 'app-farmer-dashboard',
  imports: [RouterLink, DatePipe, NairaPipe, PhotoPipe, Icon, DashShell, Insights, DashSettings, AddressFields, SuccessToast],
  templateUrl: './farmer.html',
})
export class FarmerDashboard {
  private readonly auth = inject(AuthService);
  protected readonly store = inject(StoreService);

  /** The open tab, from "?tab=..." in the URL. */
  readonly tab = input<string>();
  protected readonly active = computed(() => {
    const t = this.tab();
    if (t === 'reports') return 'analytics';
    return t ?? 'overview';
  });

  protected readonly categories = CROP_CATEGORIES;
  protected readonly units = Object.keys(UNIT_PLURALS);
  protected readonly nigerianStates = NIGERIAN_STATES;
  protected readonly tone = tone;

  /** My farm. */
  protected readonly me = computed(() =>
    this.store.farmers().find((f) => f.ownerId === this.auth.userId()),
  );
  protected readonly suspended = computed(() => this.auth.profile()?.status === 'suspended');

  protected readonly products = computed(() => {
    const farmId = this.me()?.id;
    if (!farmId) return [];
    return this.store.crops().filter((p) => p.farmerId === farmId);
  });
  /** Paid orders for my farm, newest first. */
  protected readonly orders = computed(() => {
    const farmId = this.me()?.id;
    if (!farmId) return [];
    return this.store
      .orders()
      .filter((o) => o.farmerId === farmId && o.status !== 'Awaiting payment');
  });
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
  /** Below this many units a listing counts as low stock (set in Settings). */
  protected readonly lowStockThreshold = inject(SettingsService).lowStockThreshold;
  /** Produce items under the farmer's low-stock level. */
  protected readonly lowStockItems = computed(() =>
    this.products().filter((p) => p.quantity < this.lowStockThreshold()),
  );
  /** Produce items that have run out of stock (quantity === 0) */
  protected readonly outOfStockItems = computed(() =>
    this.products().filter((p) => p.quantity <= 0),
  );

  /* ---- My Produce Pagination (15 items per page) ---- */
  protected readonly PRODUCT_PAGE_SIZE = 15;
  private readonly productPageWanted = signal(1);
  protected readonly productPageCount = computed(() =>
    Math.max(1, Math.ceil(this.products().length / this.PRODUCT_PAGE_SIZE)),
  );
  protected readonly productPage = computed(() =>
    Math.min(this.productPageWanted(), this.productPageCount()),
  );
  protected readonly productPageStart = computed(() => (this.productPage() - 1) * this.PRODUCT_PAGE_SIZE);
  protected readonly pagedProducts = computed(() =>
    this.products().slice(this.productPageStart(), this.productPageStart() + this.PRODUCT_PAGE_SIZE),
  );
  protected readonly productPageNumbers = computed(() => {
    const first = Math.max(1, Math.min(this.productPage() - 2, this.productPageCount() - 4));
    const length = Math.min(5, this.productPageCount());
    return Array.from({ length }, (_, i) => first + i);
  });
  protected goToProductPage(p: number): void {
    this.productPageWanted.set(p);
  }
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
  protected readonly replies = signal<Record<string, string>>({});
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
    const text = `"${review.comment}" by ${review.author} on ${this.productName(review.productId)} (FarmDirect ★★★★★)`;
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
    const cleanReply = sanitizeText(replyText, 1000);
    if (!cleanReply) return;
    this.replies.update((prev) => ({
      ...prev,
      [reviewId]: cleanReply,
    }));
    this.replyingTo.set(null);
  }

  protected readonly tabs = computed<DashTab[]>(() => [
    { id: 'overview', label: 'Overview', icon: 'grid', group: 'Workspace' },
    { id: 'analytics', label: 'Analytics', icon: 'chart', group: 'Workspace' },
    { id: 'orders', label: 'Orders', icon: 'box', group: 'Farm', count: this.toFulfil().length },
    {
      id: 'products',
      label: 'My Produce',
      icon: 'tag',
      group: 'Farm',
      count: this.lowStockItems().length > 0 ? this.lowStockItems().length : undefined,
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: 'star',
      group: 'Farm',
      count: this.reviews().length,
    },
    {
      id: 'verification',
      label: 'KYC & Verification',
      icon: 'shield',
      group: 'Farm',
      count: !this.isVerifiedForListing() ? 1 : undefined,
    },
    { id: 'profile', label: 'Farm Profile', icon: 'leaf', group: 'Account' },
    { id: 'settings', label: 'Settings', icon: 'settings', group: 'Account' },
  ]);

  protected readonly isVerifiedForListing = computed(() => isFarmerVerified(this.me()));
  protected readonly listingGateErrors = computed(() => getFarmerVerificationErrors(this.me()));
  protected readonly listingGateNotice = signal<string | null>(null);

  /* ---- KYC & Verification Form State ---- */
  protected readonly kycNin = signal('');
  /** Home and farmland addresses, field by field. */
  protected readonly kycHome = signal<AddressParts>({ ...EMPTY_ADDRESS });
  protected readonly kycFarm = signal<AddressParts>({ ...EMPTY_ADDRESS });
  /** "My farm is at my home address". */
  protected readonly kycFarmSame = signal(false);
  protected readonly sizeUnits = ['Hectares', 'Acres', 'Plots', 'Square metres'];
  protected readonly kycSizeValue = signal('');
  protected readonly kycSizeUnit = signal('Hectares');
  /** Bumped after a successful submission to play the green tick popup. */
  protected readonly kycPulse = signal(0);
  protected readonly kycCropProduces = signal('');
  protected readonly kycStateOfOrigin = signal('Ogun');
  protected readonly kycDocumentUrl = signal('');
  protected readonly kycSaving = signal(false);
  protected readonly kycSuccess = signal(false);
  protected readonly kycError = signal('');

  /* ---- Quick Restock State ---- */
  protected readonly restockingId = signal<string | null>(null);
  protected readonly restockQty = signal<number>(10);
  protected readonly restockSaved = signal<string | null>(null);

  protected startRestock(product: Crop): void {
    this.restockingId.set(product.id);
    this.restockQty.set(product.quantity <= 0 ? 10 : product.quantity + 10);
  }

  protected async saveRestock(product: Crop): Promise<void> {
    const qty = this.restockQty();
    if (qty < 0) return;
    await this.store.updateStock(product.id, qty);
    this.restockingId.set(null);
    this.restockSaved.set(product.id);
    setTimeout(() => {
      if (this.restockSaved() === product.id) this.restockSaved.set(null);
    }, 2500);
  }

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
      if (ids.length === 0) {
        untracked(() => this.reviews.set([]));
        return;
      }
      untracked(async () => this.reviews.set(await this.store.loadReviews(ids)));
    });

    // Populate KYC form fields from farm record
    effect(() => {
      const farm = this.me();
      if (farm) {
        untracked(() => {
          if (!this.kycNin() && farm.nin) this.kycNin.set(farm.nin.replace(/\D/g, '').slice(0, 11));
          if (!this.kycHome().state && !this.kycHome().street) {
            const home = farm.addressParts?.home;
            this.kycHome.set(
              home?.state || home?.street
                ? { ...EMPTY_ADDRESS, ...home }
                : { ...EMPTY_ADDRESS, street: (farm.residentialAddress ?? '').slice(0, 115) },
            );
          }
          if (!this.kycFarm().state && !this.kycFarm().street) {
            const land = farm.addressParts?.farm;
            this.kycFarm.set(
              land?.state || land?.street
                ? { ...EMPTY_ADDRESS, ...land }
                : { ...EMPTY_ADDRESS, street: (farm.farmAddress || farm.location || '').slice(0, 115) },
            );
          }
          if (!this.kycSizeValue() && farm.farmSize) {
            // "20 Hectares" -> 20 + Hectares
            const m = farm.farmSize.match(/^\s*([\d.,]+)\s*(.*)$/);
            if (m) {
              this.kycSizeValue.set(m[1].replace(/,/g, ''));
              const unit = this.sizeUnits.find((u) => u.toLowerCase().startsWith(m[2].trim().toLowerCase().slice(0, 4)));
              if (unit && m[2].trim()) this.kycSizeUnit.set(unit);
            }
          }
          if (!this.kycCropProduces() && farm.cropProduces) {
            this.kycCropProduces.set(farm.cropProduces);
          }
          if (farm.stateOfOrigin) {
            this.kycStateOfOrigin.set(farm.stateOfOrigin);
          }
          if (!this.kycDocumentUrl() && farm.documentUrl) {
            this.kycDocumentUrl.set(farm.documentUrl);
          }
        });
      }
    });
  }

  protected async submitKyc(): Promise<void> {
    const me = this.me();
    if (!me) return;

    const nin = this.kycNin().replace(/\D/g, '').slice(0, 11);
    const home = this.kycHome();
    const land = this.kycFarmSame() ? home : this.kycFarm();
    const sizeNumber = Number(this.kycSizeValue());
    const cropProduces = sanitizeText(this.kycCropProduces(), 200);
    const stateOfOrigin = sanitizeText(this.kycStateOfOrigin(), 60);
    const documentUrl = sanitizeUrl(this.kycDocumentUrl());

    this.kycError.set('');
    this.kycSuccess.set(false);

    if (!/^\d{11}$/.test(nin)) {
      return this.kycError.set('National Identity Number (NIN) must be exactly 11 digits.');
    }
    const homeProblem = this.addressProblem(home, 'home');
    if (homeProblem) return this.kycError.set(homeProblem);
    const farmProblem = this.kycFarmSame() ? '' : this.addressProblem(land, 'farm');
    if (farmProblem) return this.kycError.set(farmProblem);
    if (!Number.isFinite(sizeNumber) || sizeNumber <= 0 || sizeNumber > 1_000_000) {
      return this.kycError.set('Enter your farm size as a number, e.g. 15.');
    }
    if (!this.sizeUnits.includes(this.kycSizeUnit())) {
      return this.kycError.set('Choose a unit for your farm size.');
    }

    const residentialAddress = formatAddress(home);
    const farmAddress = formatAddress(land);
    // Short form, shown as the origin on produce cards: "Abeokuta, Ogun State".
    const stateName = land.state === 'FCT - Abuja' ? 'FCT, Abuja' : `${land.state} State`;
    const location = sanitizeText(`${land.city}, ${stateName}`, 160);
    const unit = sizeNumber === 1 ? this.kycSizeUnit().replace(/s$/, '') : this.kycSizeUnit();
    const farmSize = `${+sizeNumber.toFixed(2)} ${unit}`;
    if (cropProduces.length < 2) {
      return this.kycError.set('Please list your primary crop produces (e.g. Tomatoes, Cassava, Yam).');
    }

    this.kycSaving.set(true);
    const error = await this.store.submitFarmerVerification(me.id, {
      nin,
      residentialAddress,
      location,
      farmSize,
      cropProduces,
      stateOfOrigin,
      documentUrl,
      farmAddress,
      addressParts: { home, farm: land },
    });
    this.kycSaving.set(false);

    if (error) {
      this.kycError.set(error);
    } else {
      this.kycSuccess.set(true);
      this.kycPulse.update((n) => n + 1);
    }
  }

  /** NIN box: digits only, at most 11. */
  protected onNinInput(input: HTMLInputElement): void {
    const digits = input.value.replace(/\D/g, '').slice(0, 11);
    if (input.value !== digits) input.value = digits;
    this.kycNin.set(digits);
  }

  /** What is missing from an address, or '' when it's complete. */
  private addressProblem(a: AddressParts, which: 'home' | 'farm'): string {
    const place = which === 'home' ? 'home address' : 'farmland address';
    if (!a.state) return `Choose the state of your ${place}.`;
    if (!a.lga || !(LGAS_BY_STATE[a.state] ?? []).includes(a.lga)) {
      return `Choose the local government area of your ${place}.`;
    }
    if (!sanitizeText(a.city, 50)) return `Enter the city or town of your ${place}.`;
    if (sanitizeText(a.street, 115).length < 5) {
      return which === 'home'
        ? 'Enter your house number and street.'
        : 'Enter the road or street where your farm is.';
    }
    return '';
  }

  protected productName(id: string): string {
    return this.products().find((p) => p.id === id)?.name ?? 'Removed listing';
  }

  protected stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  protected startAdd(): void {
    const me = this.me();
    if (!me || !isFarmerVerified(me)) {
      const reasons = getFarmerVerificationErrors(me);
      this.listingGateNotice.set(
        `NIN and KYC verification are compulsory to list produce on the marketplace. ${reasons.join(' ')}`,
      );
      return;
    }
    this.listingGateNotice.set(null);
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
      quantity: product.quantity,
      description: product.description,
    });
    this.formError.set('');
    this.editing.set(product.id);
  }

  protected setField(field: keyof ProductForm, value: string): void {
    this.form.update((f) => ({
      ...f,
      [field]:
        field === 'price' || field === 'quantity'
          ? Math.max(0, Math.floor(Number(value)) || 0)
          : value,
    }));
  }

  protected async saveProduct(): Promise<void> {
    const me = this.me();
    const editing = this.editing();
    if (!me || !editing) return;

    if (!isFarmerVerified(me)) {
      const reasons = getFarmerVerificationErrors(me);
      return this.formError.set(
        `National Identity Number (NIN) and KYC verification are compulsory before you can list produce. ${reasons.join(' ')}`,
      );
    }

    const raw = this.form();
    const form: ProductForm = {
      name: sanitizeText(raw.name, 120),
      category: raw.category,
      price: sanitizeNumber(raw.price, 0),
      unit: sanitizeText(raw.unit, 30),
      quantity: sanitizeNumber(raw.quantity ?? 0, 0),
      description: sanitizeText(raw.description, 2000),
    };

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
    const cleanName = sanitizeText(name, 120);
    const cleanLocation = sanitizeText(location, 160);
    if (!me || cleanName.length < 2) return;
    const error = await this.store.updateFarm(me.id, cleanName, cleanLocation);
    this.saved.set(!error);
  }
}
