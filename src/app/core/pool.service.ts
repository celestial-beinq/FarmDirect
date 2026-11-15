import { Injectable, signal } from '@angular/core';
import { Animal, INITIAL_POOLS, Pool } from './data';

/**
 * Holds the buying pools. They live in memory for now — a real backend is
 * needed before pools can be shared between different people's devices.
 */
@Injectable({ providedIn: 'root' })
export class PoolService {
  readonly pools = signal<Pool[]>(INITIAL_POOLS);

  forAnimal(animalId: string): Pool[] {
    return this.pools().filter((p) => p.animalId === animalId);
  }

  create(animal: Animal, contribution: number): Pool {
    const number = this.forAnimal(animal.id).length + 1;
    const pool: Pool = {
      id: `${animal.id}-${Date.now().toString(36)}`,
      animalId: animal.id,
      name: `Your ${animal.type} Pool #${number}`,
      raised: contribution,
      members: 1,
      closesIn: '7 days',
    };
    this.pools.update((pools) => [...pools, pool]);
    return pool;
  }
}
