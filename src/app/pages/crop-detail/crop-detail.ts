import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/cart.service';
import { BuyOption, STORAGE_TIPS, buyOptions, unitsFromOption } from '../../core/data';
import { StoreService } from '../../core/store.service';
import { Icon } from '../../shared/icon';
import { NairaPipe, PhotoPipe } from '../../shared/pipes';
import { Reviews } from '../../shared/reviews';

type Tab = 'Details' | 'Storage Tips' | 'Delivery Info';

@Component({
  selector: 'app-crop-detail',
  imports: [RouterLink, Icon, NairaPipe, PhotoPipe, Reviews],
  templateUrl: './crop-detail.html',
  styleUrl: './crop-detail.css',
})
export class CropDetail {
  private readonly cart = inject(CartService);
  protected readonly store = inject(StoreService);

  /** Filled in from the ":id" part of the URL. */
  readonly id = input.required<string>();

  protected readonly crop = computed(() => this.store.liveCrops().find((c) => c.id === this.id()));
  protected readonly farmName = computed(() => this.store.farmerName(this.crop()?.farmerId ?? ''));
  protected readonly options = computed(() => {
    const crop = this.crop();
    return crop ? buyOptions(crop) : [];
  });
  /** Options arranged under their headings ("By Weight", "By Basket"...). */
  protected readonly groups = computed(() => {
    const groups = new Map<string, BuyOption[]>();
    for (const option of this.options()) {
      groups.set(option.group, [...(groups.get(option.group) ?? []), option]);
    }
    return [...groups].map(([name, options]) => ({ name, options }));
  });

  protected readonly tabs: Tab[] = ['Details', 'Storage Tips', 'Delivery Info'];
  protected readonly tab = signal<Tab>('Details');
  protected readonly photoIndex = signal(0);
  protected readonly chosenLabel = signal<string | null>(null);
  protected readonly units = signal(1);

  protected readonly chosen = computed(
    () => this.options().find((o) => o.label === this.chosenLabel()) ?? this.options()[0],
  );

  protected readonly remainingQuantity = computed(() => this.crop()?.quantity ?? 0);
  protected readonly isOutOfStock = computed(() => this.remainingQuantity() <= 0);
  protected readonly isLowStock = computed(
    () => this.remainingQuantity() > 0 && this.remainingQuantity() < 5,
  );

  protected readonly maxUnits = computed(() => {
    const crop = this.crop();
    const option = this.chosen();
    if (!crop || !option) return 1;
    if (crop.quantity <= 0) return 0;
    const perUnit = unitsFromOption(option.label, 1, crop.unit);
    const max = Math.floor(crop.quantity / perUnit);
    return Math.max(1, Math.min(99, max));
  });

  protected readonly total = computed(() => (this.chosen()?.price ?? 0) * this.units());
  protected readonly storageTip = computed(() => {
    const crop = this.crop();
    return crop ? STORAGE_TIPS[crop.category] : '';
  });

  protected changeUnits(by: number): void {
    if (this.isOutOfStock()) return;
    this.units.update((n) => Math.min(this.maxUnits(), Math.max(1, n + by)));
  }

  protected addToBasket(): void {
    const crop = this.crop();
    const option = this.chosen();
    if (!crop || !option || this.isOutOfStock()) return;
    this.cart.add({
      key: `crop:${crop.id}:${option.label}`,
      productId: crop.id,
      kind: 'crop',
      option: option.label,
      title: crop.name,
      detail: option.label,
      image: crop.image,
      unitPrice: option.price,
      qty: this.units(),
      link: `/crops/${crop.id}`,
    });
    this.units.set(1);
  }
}
