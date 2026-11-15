import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CROPS, CROP_CATEGORIES, CropCategory } from '../../core/data';
import { Icon } from '../../shared/icon';
import { NairaPipe, PhotoPipe } from '../../shared/pipes';

type Sort = 'popular' | 'low' | 'high' | 'name';

const PAGE_SIZE = 6;
const MAX_PRICE = Math.max(...CROPS.map((c) => c.price));

@Component({
  selector: 'app-crops',
  imports: [RouterLink, Icon, NairaPipe, PhotoPipe],
  templateUrl: './crops.html',
  styleUrl: './crops.css',
})
export class Crops {
  protected readonly categories = CROP_CATEGORIES;
  protected readonly priceCeiling = MAX_PRICE;

  protected readonly search = signal('');
  protected readonly sort = signal<Sort>('popular');
  protected readonly selected = signal<CropCategory[]>([]);
  protected readonly maxPrice = signal(MAX_PRICE);
  protected readonly page = signal(1);

  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const cats = this.selected();
    const max = this.maxPrice();

    const list = CROPS.filter(
      (c) =>
        (!term || c.name.toLowerCase().includes(term) || c.category.toLowerCase().includes(term)) &&
        (cats.length === 0 || cats.includes(c.category)) &&
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
    () => !!this.search() || this.selected().length > 0 || this.maxPrice() < MAX_PRICE,
  );

  protected setSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  protected setSort(value: string): void {
    this.sort.set(value as Sort);
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

  protected clear(): void {
    this.search.set('');
    this.selected.set([]);
    this.maxPrice.set(MAX_PRICE);
    this.page.set(1);
  }
}
