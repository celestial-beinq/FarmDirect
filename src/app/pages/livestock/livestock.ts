import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ANIMALS, ANIMAL_TYPES, AnimalType } from '../../core/data';
import { PoolService } from '../../core/pool.service';
import { Icon } from '../../shared/icon';
import { NairaPipe, PhotoPipe } from '../../shared/pipes';

@Component({
  selector: 'app-livestock',
  imports: [RouterLink, Icon, NairaPipe, PhotoPipe],
  templateUrl: './livestock.html',
  styleUrl: './livestock.css',
})
export class Livestock {
  private readonly poolService = inject(PoolService);

  protected readonly types = ANIMAL_TYPES;
  protected readonly type = signal<AnimalType | 'All'>('All');
  protected readonly poolsOnly = signal(false);
  protected readonly sort = signal<'high' | 'low'>('high');

  protected readonly steps = [
    {
      title: 'Choose Your Animal',
      text: 'Browse cattle, rams and goats from vetted farms.',
    },
    {
      title: 'Join or Create a Pool',
      text: 'Take a share of the animal, or buy it whole. Sharing lowers each family’s cost.',
    },
    {
      title: 'Pool Fulfilment',
      text: 'Once every share is paid for, the pool is locked and processing begins.',
    },
    {
      title: 'Expert Processing',
      text: 'Animals are slaughtered in hygienic facilities, portioned and vacuum sealed.',
    },
    {
      title: 'Cold-Chain Delivery',
      text: 'Your share is delivered fresh, kept cold all the way to your doorstep.',
    },
  ];

  protected readonly animals = computed(() => {
    const type = this.type();
    const direction = this.sort() === 'high' ? -1 : 1;
    return ANIMALS.map((animal) => ({
      animal,
      pools: this.poolService.forAnimal(animal.id).length,
    }))
      .filter((row) => type === 'All' || row.animal.type === type)
      .filter((row) => !this.poolsOnly() || row.pools > 0)
      .sort((a, b) => (a.animal.price - b.animal.price) * direction);
  });

  protected setType(value: string): void {
    this.type.set(value as AnimalType | 'All');
  }

  protected setSort(value: string): void {
    this.sort.set(value as 'high' | 'low');
  }

  protected reset(): void {
    this.type.set('All');
    this.poolsOnly.set(false);
  }
}
