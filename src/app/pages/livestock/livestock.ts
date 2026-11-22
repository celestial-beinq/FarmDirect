import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ANIMAL_TYPES, AnimalType } from '../../core/data';
import { StoreService } from '../../core/store.service';
import { BREEDS } from '../../core/content';
import { Icon, IconName } from '../../shared/icon';
import { NairaPipe, PhotoPipe } from '../../shared/pipes';

@Component({
  selector: 'app-livestock',
  imports: [RouterLink, Icon, NairaPipe, PhotoPipe],
  templateUrl: './livestock.html',
  styleUrl: './livestock.css',
})
export class Livestock {
  protected readonly store = inject(StoreService);

  protected readonly breeds = BREEDS;
  protected readonly standards: { icon: IconName; title: string; text: string }[] = [
    {
      icon: 'shield',
      title: 'Vet-checked before sale',
      text: 'Every animal is inspected for disease and condition before it is listed.',
    },
    {
      icon: 'leaf',
      title: 'Pasture-raised',
      text: 'Grazed on open pasture by pastoralists, not fattened with steroids in a pen.',
    },
    {
      icon: 'pin',
      title: 'Breed & origin listed',
      text: 'You see the breed, live weight and the state it comes from on every listing.',
    },
    {
      icon: 'box',
      title: 'Hygienic processing',
      text: 'Slaughtered in clean facilities, portioned, sealed and kept cold to your door.',
    },
  ];

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
    const openPools = this.store.pools().filter((p) => p.status === 'open');
    return this.store
      .animals()
      .map((animal) => ({
        animal,
        pools: openPools.filter((p) => p.animalId === animal.id).length,
      }))
      .filter((row) => type === 'All' || row.animal.type === type)
      .filter((row) => !this.poolsOnly() || row.pools > 0)
      .sort((a, b) => (a.animal.price - b.animal.price) * direction);
  });

  /** The first cow on sale, for the "view cow pools" shortcut. */
  protected readonly firstCow = computed(() => this.store.animals().find((a) => a.type === 'Cow'));

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
