import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/cart.service';
import { ANIMALS, LIVESTOCK_FARMER_ID, Pool } from '../../core/data';
import { PoolService } from '../../core/pool.service';
import { Icon } from '../../shared/icon';
import { NairaPipe, PhotoPipe, formatNaira } from '../../shared/pipes';

@Component({
  selector: 'app-livestock-detail',
  imports: [RouterLink, Icon, NairaPipe, PhotoPipe],
  templateUrl: './livestock-detail.html',
  styleUrl: './livestock-detail.css',
  host: { '(document:keydown.escape)': 'closeDialog()' },
})
export class LivestockDetail {
  private readonly cart = inject(CartService);
  private readonly poolService = inject(PoolService);
  private readonly document = inject(DOCUMENT);

  /** Filled in from the ":id" part of the URL. */
  readonly id = input.required<string>();

  protected readonly animal = computed(() => ANIMALS.find((a) => a.id === this.id()));
  protected readonly photoIndex = signal(0);

  /** Pools for this animal, with the numbers each card needs. */
  protected readonly pools = computed(() => {
    const animal = this.animal();
    if (!animal) return [];
    return this.poolService
      .pools()
      .filter((pool) => pool.animalId === animal.id)
      .map((pool) => {
        const percent = Math.min(100, Math.round((pool.raised / animal.price) * 100));
        return { pool, percent, remaining: Math.max(0, animal.price - pool.raised) };
      });
  });

  /* ---- Dialog state: at most one of these is open at a time ---- */
  protected readonly startOpen = signal(false);
  protected readonly joining = signal<Pool | null>(null);
  protected readonly amount = signal(0);
  protected readonly copied = signal(false);

  protected readonly amountText = computed(() => this.amount().toLocaleString('en-NG'));

  /* ---- "Start New Pool" numbers ---- */
  protected readonly percent = computed(() => {
    const price = this.animal()?.price ?? 1;
    return Math.min(100, Math.round((this.amount() / price) * 100));
  });
  protected readonly portionName = computed(() => {
    const percent = this.percent();
    if (percent >= 100) return 'Whole Animal';
    if (percent === 50) return 'Half Share';
    if (percent === 25) return 'Quarter Share';
    return `${percent}% Share`;
  });
  protected readonly startError = computed(() => {
    const animal = this.animal();
    if (!animal) return '';
    if (this.amount() < animal.minShare) {
      return `The minimum contribution is ${formatNaira(animal.minShare)}.`;
    }
    if (this.amount() >= animal.price) {
      return `That covers the whole animal (${formatNaira(animal.price)}). Use "Secure Entire Animal" instead.`;
    }
    return '';
  });
  protected readonly shareLink = computed(() => {
    const host = this.document.location?.host ?? '';
    return `${host}/livestock/${this.id()}#pools`;
  });

  /* ---- "Join Pool" numbers ---- */
  protected readonly joinRemaining = computed(() => {
    const animal = this.animal();
    const pool = this.joining();
    return animal && pool ? Math.max(0, animal.price - pool.raised) : 0;
  });
  protected readonly joinPercent = computed(() => {
    const animal = this.animal();
    const pool = this.joining();
    return animal && pool ? Math.min(100, Math.round((pool.raised / animal.price) * 100)) : 0;
  });
  /** The last contributor only has to pay what is left, even if below the usual minimum. */
  protected readonly joinMinimum = computed(() =>
    Math.min(this.animal()?.minShare ?? 0, this.joinRemaining()),
  );
  protected readonly joinError = computed(() => {
    if (this.amount() < this.joinMinimum()) {
      return `The minimum contribution is ${formatNaira(this.joinMinimum())}.`;
    }
    if (this.amount() > this.joinRemaining()) {
      return `Only ${formatNaira(this.joinRemaining())} is left to fund in this pool.`;
    }
    return '';
  });
  protected readonly meatYield = computed(() => {
    const animal = this.animal();
    if (!animal) return '0';
    return ((this.amount() / animal.price) * animal.yieldKg).toFixed(1);
  });

  protected openStart(): void {
    const animal = this.animal();
    if (!animal) return;
    this.amount.set(Math.max(animal.minShare, Math.round(animal.price / 4)));
    this.copied.set(false);
    this.joining.set(null);
    this.startOpen.set(true);
  }

  protected openJoin(pool: Pool): void {
    this.startOpen.set(false);
    this.joining.set(pool);
    this.amount.set(this.joinMinimum());
  }

  protected closeDialog(): void {
    this.startOpen.set(false);
    this.joining.set(null);
  }

  /** Keeps only digits, and shows the number back with thousands separators. */
  protected onAmountInput(field: HTMLInputElement): void {
    const value = Number(field.value.replace(/\D/g, '').slice(0, 9)) || 0;
    this.amount.set(value);
    field.value = value.toLocaleString('en-NG');
  }

  protected async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(`https://${this.shareLink()}`);
      this.copied.set(true);
    } catch {
      this.copied.set(false);
    }
  }

  protected buyWhole(): void {
    const animal = this.animal();
    if (!animal) return;
    this.cart.add({
      key: `animal:${animal.id}`,
      title: animal.name,
      detail: 'Entire animal',
      kind: 'animal',
      farmerId: LIVESTOCK_FARMER_ID,
      image: animal.image,
      unitPrice: animal.price,
      qty: 1,
      fixedQty: true,
      link: `/livestock/${animal.id}`,
    });
  }

  protected createPool(): void {
    const animal = this.animal();
    if (!animal || this.startError()) return;
    const pool = this.poolService.create(animal);
    this.cart.add({
      key: `pool:${pool.id}`,
      title: `${animal.name} share`,
      detail: `${this.portionName()} · ${pool.name}`,
      kind: 'pool',
      farmerId: LIVESTOCK_FARMER_ID,
      poolId: pool.id,
      image: animal.image,
      unitPrice: this.amount(),
      qty: 1,
      fixedQty: true,
      link: `/livestock/${animal.id}`,
    });
    this.closeDialog();
  }

  protected joinPool(): void {
    const animal = this.animal();
    const pool = this.joining();
    if (!animal || !pool || this.joinError()) return;
    this.cart.add({
      key: `pool:${pool.id}`,
      title: `${animal.name} share`,
      detail: `≈${this.meatYield()}kg · ${pool.name}`,
      kind: 'pool',
      farmerId: LIVESTOCK_FARMER_ID,
      poolId: pool.id,
      image: animal.image,
      unitPrice: this.amount(),
      qty: 1,
      fixedQty: true,
      link: `/livestock/${animal.id}`,
    });
    this.closeDialog();
  }
}
