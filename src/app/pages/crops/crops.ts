import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/cart.service';
import { CROP_CATEGORIES, Crop, CropCategory, buyOptions } from '../../core/data';
import { StoreService } from '../../core/store.service';
import { SPOT_TIPS } from '../../core/content';
import { Icon, IconName } from '../../shared/icon';
import { NairaPipe, PhotoPipe } from '../../shared/pipes';

type Sort = 'popular' | 'low' | 'high' | 'name';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-crops',
  imports: [RouterLink, Icon, NairaPipe, PhotoPipe],
  templateUrl: './crops.html',
  styleUrl: './crops.css',
})
export class Crops {
  protected readonly categories = CROP_CATEGORIES;
  protected readonly store = inject(StoreService);

  /** Short promises shown above the list. */
  protected readonly trust: { icon: IconName; text: string }[] = [
    { icon: 'shield', text: 'Verified farms only' },
    { icon: 'leaf', text: 'No carbide, no dyes, no Sniper' },
    { icon: 'pin', text: 'Farm & region on every item' },
    { icon: 'clock', text: 'Harvested after you order' },
  ];
  /** Market checks for the foods people buy most (the rest are on /real-food). */
  protected readonly tips = SPOT_TIPS.slice(0, 4);
  private readonly cart = inject(CartService);

  /** All agricultural states represented in the marketplace */
  protected readonly availableOrigins = computed(() => {
    const set = new Set<string>();
    for (const c of this.store.liveCrops()) {
      const parts = c.origin.split(',');
      const state = (parts[parts.length - 1] ?? c.origin).trim();
      if (state) set.add(state);
    }
    return Array.from(set).sort();
  });

  /** The dearest crop on sale — the top of the price slider. */
  protected readonly priceCeiling = computed(() =>
    Math.max(0, ...this.store.liveCrops().map((c) => c.price)),
  );

  protected readonly search = signal('');
  protected readonly sort = signal<Sort>('popular');
  protected readonly selected = signal<CropCategory[]>([]);
  protected readonly selectedOrigin = signal<string>('all');
  protected readonly inStockOnly = signal(false);
  /** null means no price limit has been chosen. */
  protected readonly maxPrice = signal<number | null>(null);
  protected readonly page = signal(1);
  protected readonly addedId = signal<string | null>(null);

  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const cats = this.selected();
    const origin = this.selectedOrigin();
    const stockOnly = this.inStockOnly();
    const max = this.maxPrice() ?? Infinity;

    const list = this.store
      .liveCrops()
      .filter(
        (c) =>
          (!term ||
            c.name.toLowerCase().includes(term) ||
            c.category.toLowerCase().includes(term) ||
            c.origin.toLowerCase().includes(term) ||
            c.tags.some((t) => t.toLowerCase().includes(term))) &&
          (cats.length === 0 || cats.includes(c.category)) &&
          (origin === 'all' || c.origin.toLowerCase().includes(origin.toLowerCase())) &&
          (!stockOnly || c.quantity > 0) &&
          c.price <= max,
      );

    switch (this.sort()) {
      case 'low':
        return list.sort((a, b) => a.price - b.price);
      case 'high':
        return list.sort((a, b) => b.price - a.price);
      case 'name':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return list; // catalogue order
    }
  });

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)),
  );
  protected readonly pages = computed(() =>
    Array.from({ length: this.pageCount() }, (_, i) => i + 1),
  );
  protected readonly visible = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });
  protected readonly hasFilters = computed(
    () =>
      !!this.search() ||
      this.selected().length > 0 ||
      this.selectedOrigin() !== 'all' ||
      this.inStockOnly() ||
      this.maxPrice() !== null,
  );

  protected setSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  protected setSort(value: string): void {
    this.sort.set(value as Sort);
    this.page.set(1);
  }

  protected setOrigin(value: string): void {
    this.selectedOrigin.set(value);
    this.page.set(1);
  }

  protected toggleInStock(checked: boolean): void {
    this.inStockOnly.set(checked);
    this.page.set(1);
  }

  protected setMaxPrice(value: string): void {
    this.maxPrice.set(Number(value));
    this.page.set(1);
  }

  protected toggle(category: CropCategory): void {
    this.selected.update((list) =>
      list.includes(category) ? list.filter((c) => c !== category) : [...list, category],
    );
    this.page.set(1);
  }

  protected selectSingleCategory(cat: CropCategory | 'All'): void {
    if (cat === 'All') {
      this.selected.set([]);
    } else {
      this.selected.set([cat]);
    }
    this.page.set(1);
  }

  protected clear(): void {
    this.search.set('');
    this.selected.set([]);
    this.selectedOrigin.set('all');
    this.inStockOnly.set(false);
    this.maxPrice.set(null);
    this.page.set(1);
  }

  protected defaultOption(crop: Crop) {
    return buyOptions(crop)[0];
  }

  protected quickAdd(crop: Crop, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (crop.quantity <= 0) return;
    const option = this.defaultOption(crop);
    this.cart.add({
      key: `crop:${crop.id}:${option.label}`,
      title: crop.name,
      detail: option.label,
      image: crop.image,
      unitPrice: option.price,
      qty: 1,
      kind: 'crop',
      productId: crop.id,
      option: option.label,
      link: `/crops/${crop.id}`,
    });
    this.addedId.set(crop.id);
    setTimeout(() => {
      if (this.addedId() === crop.id) {
        this.addedId.set(null);
      }
    }, 1800);
  }
}
