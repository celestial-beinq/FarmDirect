import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/cart.service';
import { Crop, IMAGES, POSTS, buyOptions } from '../../core/data';
import { StoreService } from '../../core/store.service';
import { Icon, IconName } from '../../shared/icon';
import { NairaPipe, PhotoPipe } from '../../shared/pipes';

@Component({
  selector: 'app-home',
  imports: [RouterLink, Icon, NairaPipe, PhotoPipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly cart = inject(CartService);
  private readonly store = inject(StoreService);

  protected readonly img = IMAGES;
  protected readonly posts = POSTS;
  protected readonly ticker = [
    'Order Thursday',
    'Receive Sunday',
    'No middlemen',
    'Traceable to the farm',
  ];

  protected readonly steps: { icon: IconName; title: string; text: string }[] = [
    {
      icon: 'search',
      title: 'Browse',
      text: 'Browse fresh crops and livestock on the marketplace and see which farm each one comes from.',
    },
    {
      icon: 'users',
      title: 'Order by Thursday',
      text: 'Order your produce, join a livestock pool or buy a whole animal before Thursday ends.',
    },
    {
      icon: 'truck',
      title: 'Delivery on Sunday',
      text: 'Farmers harvest for your order and it travels straight to your doorstep on Sunday.',
    },
  ];

  protected readonly reasons: { icon: IconName; title: string; text: string }[] = [
    {
      icon: 'leaf',
      title: 'Direct from farms',
      text: 'No middlemen and no repackaging. One straight line from the farmer to your home.',
    },
    {
      icon: 'pin',
      title: 'Traceable source',
      text: 'Every item shows the farm region it came from, so you know what you are eating.',
    },
    {
      icon: 'shield',
      title: 'Nothing fake',
      text: 'No carbide ripening, no dyes, no mixed grain. Livestock is checked by a vet before sale.',
    },
    {
      icon: 'tag',
      title: 'Transparent pricing',
      text: 'The price you see is the price you pay. Buying together in pools brings the cost down.',
    },
  ];

  /** Three featured crops — skipped if a listing is no longer on sale. */
  protected readonly trending = computed(() => {
    const featured = ['vegetable-box', 'ofada-rice', 'fruit-basket'];
    return this.store
      .liveCrops()
      .filter((crop) => featured.includes(crop.id))
      .map((crop) => ({ crop, option: buyOptions(crop)[0] }));
  });

  protected add(crop: Crop): void {
    const option = buyOptions(crop)[0];
    this.cart.add({
      key: `crop:${crop.id}:${option.label}`,
      title: crop.name,
      detail: option.label,
      image: crop.image,
      unitPrice: option.price,
      qty: 1,
      kind: 'crop',
      farmerId: crop.farmerId,
      link: `/crops/${crop.id}`,
    });
  }
}
