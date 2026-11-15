import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, afterNextRender, effect, inject, signal } from '@angular/core';
import { Animal, INITIAL_POOLS, Pool } from './data';

const STORAGE_KEY = 'farmdirect.pools.v1';

/**
 * Holds the livestock buying pools. They are saved in this browser only —
 * a real backend is needed before pools can be shared between devices.
 */
@Injectable({ providedIn: 'root' })
export class PoolService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private loaded = false;

  readonly pools = signal<Pool[]>(INITIAL_POOLS);

  constructor() {
    afterNextRender(() => this.restore());
    effect(() => {
      const pools = this.pools();
      if (!this.loaded) return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pools));
      } catch {
        // Storage blocked: pools still work for this visit.
      }
    });
  }

  /** Loads saved pools. Safe to call more than once. */
  restore(): void {
    if (this.loaded || !this.isBrowser) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) this.pools.set(JSON.parse(saved));
    } catch {
      // Unreadable storage: keep the starting pools.
    }
    this.loaded = true;
  }

  forAnimal(animalId: string): Pool[] {
    return this.pools().filter((p) => p.animalId === animalId);
  }

  /** Opens an empty pool. Money is only counted once an order is placed. */
  create(animal: Animal): Pool {
    const number = this.forAnimal(animal.id).length + 1;
    const pool: Pool = {
      id: `${animal.id}-${Date.now().toString(36)}`,
      animalId: animal.id,
      name: `${animal.type} Pool #${number}`,
      raised: 0,
      members: 0,
      closesIn: '7 days',
    };
    this.pools.update((pools) => [...pools, pool]);
    return pool;
  }

  /** Records a paid-for share against a pool. */
  contribute(poolId: string, amount: number): void {
    this.pools.update((pools) =>
      pools.map((p) =>
        p.id === poolId ? { ...p, raised: p.raised + amount, members: p.members + 1 } : p,
      ),
    );
  }

  remove(poolId: string): void {
    this.pools.update((pools) => pools.filter((p) => p.id !== poolId));
  }

  reset(): void {
    this.pools.set(INITIAL_POOLS);
  }
}
