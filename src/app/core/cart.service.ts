import { Injectable, afterNextRender, computed, effect, signal } from '@angular/core';

export interface CartItem {
  /** Unique per product + pack size, so the same choice merges into one line. */
  key: string;
  title: string;
  detail: string;
  image: string;
  unitPrice: number;
  qty: number;
  /** Whole animals and pool shares are one-off — no quantity stepper. */
  fixedQty?: boolean;
  link: string;
}

const STORAGE_KEY = 'farmdirect.cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly items = signal<CartItem[]>([]);
  readonly count = computed(() => this.items().reduce((n, i) => n + i.qty, 0));
  readonly total = computed(() => this.items().reduce((n, i) => n + i.qty * i.unitPrice, 0));

  /** Short confirmation shown by the app shell after something is added. */
  readonly notice = signal<string | null>(null);

  private loaded = false;
  private noticeTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    // localStorage only exists in the browser, so load after the first render
    // (this also keeps server-rendered HTML and the first client render in sync).
    afterNextRender(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) this.items.set(JSON.parse(saved));
      } catch {
        // Unreadable or blocked storage: start with an empty basket.
      }
      this.loaded = true;
    });

    effect(() => {
      const items = this.items();
      if (!this.loaded) return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch {
        // Storage full or blocked: the basket still works for this visit.
      }
    });
  }

  add(item: CartItem): void {
    this.items.update((items) => {
      const existing = items.find((i) => i.key === item.key);
      if (!existing) return [...items, item];
      return items.map((i) =>
        i.key !== item.key ? i : item.fixedQty ? item : { ...i, qty: i.qty + item.qty },
      );
    });
    this.notice.set(`${item.title} added to your basket`);
    clearTimeout(this.noticeTimer);
    this.noticeTimer = setTimeout(() => this.notice.set(null), 3500);
  }

  setQty(key: string, qty: number): void {
    if (qty < 1) return this.remove(key);
    this.items.update((items) => items.map((i) => (i.key === key ? { ...i, qty } : i)));
  }

  remove(key: string): void {
    this.items.update((items) => items.filter((i) => i.key !== key));
  }

  clear(): void {
    this.items.set([]);
  }
}
