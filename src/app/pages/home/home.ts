import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/cart.service';
import { FOOD_CONCERNS, GROWN_WITHOUT, REGIONS, seasonFor } from '../../core/content';
import { Crop, IMAGES, POSTS, buyOptions } from '../../core/data';
import { StoreService } from '../../core/store.service';
import { Icon, IconName } from '../../shared/icon';
import { NairaPipe, PhotoPipe } from '../../shared/pipes';

interface Feature {
  key: string;
  tab: string;
  tags: string[];
  title: string;
  text: string;
  cta: string;
  link: string;
  image: string;
  alt: string;
  float: { label: string; icon: IconName; title: string; meta: string; progress?: number };
  side: { image: string; tag: string; value: string; label: string; detail: string };
}

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
  /** The first three food concerns, with a link to the full guide. */
  protected readonly concerns = FOOD_CONCERNS.slice(0, 3);
  protected readonly without = GROWN_WITHOUT;
  protected readonly regions = REGIONS;
  protected readonly season = seasonFor();
  protected readonly ticker = [
    'Order Thursday',
    'Receive Sunday',
    'No carbide ripening',
    'Verified farms only',
    'No middlemen',
    'Vet-checked livestock',
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

  protected readonly features: Feature[] = [
    {
      key: 'harvest',
      tab: 'Fresh Harvest',
      tags: ['Picked to order', 'Peak ripeness', 'Named farms'],
      title: 'Produce harvested for your order',
      text: 'Tomatoes, ugu, yam, plantain and grains picked after you order, not left sitting in a warehouse. Every listing names the farm and region it came from.',
      cta: 'Shop Harvest',
      link: '/crops',
      image: IMAGES.harvestbasket,
      alt: 'A basket of freshly harvested Nigerian produce',
      float: { label: 'Your basket', icon: 'basket', title: 'Ugu, tomatoes, plantain', meta: 'Harvested Saturday' },
      side: { image: IMAGES.tomatoes, tag: 'Origin', value: 'Kano', label: 'Plum tomatoes', detail: 'Northern farm' },
    },
    {
      key: 'livestock',
      tab: 'Livestock Pools',
      tags: ['Buy whole', 'Or share', 'Vet-checked'],
      title: 'Share a cow with other families',
      text: 'Can’t use a whole animal? Join a pool and pay only for your share. Every ram, goat and cow is checked by a vet before it is sold.',
      cta: 'Buy Livestock',
      link: '/livestock',
      image: IMAGES.whitefulani,
      alt: 'A White Fulani cow',
      float: { label: 'Pool progress', icon: 'users', title: 'White Fulani cow', meta: '6 of 8 shares taken', progress: 75 },
      side: { image: IMAGES.balami, tag: 'Your share', value: '1/4', label: 'Balami ram', detail: 'Vet-checked' },
    },
    {
      key: 'delivery',
      tab: 'Sunday Delivery',
      tags: ['Order Thursday', 'Harvest Saturday', 'Enjoy Sunday'],
      title: 'One weekly run, straight to your door',
      text: 'Place your order by Thursday. Farmers harvest for it on Saturday and it reaches your home on Sunday, fresh and in one trip.',
      cta: 'How it works',
      link: '/how-it-works',
      image: IMAGES.farmer,
      alt: 'A Nigerian farmer carrying freshly harvested plantain',
      float: { label: 'Next delivery', icon: 'truck', title: 'Sunday, 10am – 2pm', meta: 'Straight from the farm' },
      side: { image: IMAGES.market, tag: 'Order cutoff', value: 'Thu', label: 'Weekly cycle', detail: 'Every week' },
    },
    {
      key: 'verified',
      tab: 'Verified Farms',
      tags: ['Farm visits', 'No carbide', 'Traceable'],
      title: 'Farms checked before they can sell',
      text: 'We visit and vet every farm. Carbide ripening, chemical storage or dyed oil gets a farm removed, so what reaches you is real food.',
      cta: 'Read the Real Food Guide',
      link: '/real-food',
      image: IMAGES.farmfield,
      alt: 'Rows of crops on a Nigerian farm',
      float: { label: 'Farm status', icon: 'shield', title: 'Verified farm', meta: 'Inspected and approved' },
      side: { image: IMAGES.yamfarm, tag: 'Promise', value: '0%', label: 'Carbide used', detail: 'Natural only' },
    },
  ];

  protected readonly activeKey = signal(this.features[0].key);
  protected readonly activeFeature = computed(
    () => this.features.find((f) => f.key === this.activeKey()) ?? this.features[0],
  );

  /** Unsplash photo ids, rendered through the photo pipe. */
  protected readonly uses: { title: string; text: string; image: string; alt: string; bg: string; ink: string }[] = [
    {
      title: "Family Meals",
      text: "Soup ingredients, tubers and grains for the whole household, delivered every Sunday.",
      image: '1597362925123-77861d3fbac7',
      alt: "Fresh tomatoes, peppers, corn, onions and other vegetables",
      bg: '#1b3a26',
      ink: '#ffffff',
    },
    {
      title: "Festive Seasons",
      text: "Rams for Sallah, goats and cows for Christmas and weddings, bought whole or shared.",
      image: '1500595046743-cd271d694d30',
      alt: "Cattle grazing in a field at sunset",
      bg: '#cfe3f5',
      ink: '#111a14',
    },
    {
      title: "Restaurants & Caterers",
      text: "Bulk produce from named farms, delivered in time to plan the week’s menu.",
      image: '1550989460-0adf9ea622e2',
      alt: "A market stall piled with fresh fruit and vegetables",
      bg: '#cfe86e',
      ink: '#111a14',
    },
    {
      title: "Healthy Eating",
      text: "Fresh vegetables and clean grains for families who want to know what they eat.",
      image: '1540420773420-3366772f4999',
      alt: "A colourful bowl of fresh vegetables",
      bg: '#f6e3a1',
      ink: '#111a14',
    },
    {
      title: "Fruit Lovers",
      text: "Mango, pawpaw, oranges and pineapple ripened naturally, never with carbide.",
      image: '1610832958506-aa56368176cf',
      alt: "Pawpaw, oranges, kiwi, avocado and other fresh fruit",
      bg: '#f5d3c3',
      ink: '#111a14',
    },
    {
      title: "Soup Greens",
      text: "Ugu, waterleaf and leafy greens cut fresh for soups and stews.",
      image: '1576045057995-568f588f82fb',
      alt: "A bunch of fresh leafy greens",
      bg: '#e8f4b8',
      ink: '#111a14',
    },
    {
      title: "Community Pools",
      text: "Split a cow or bulk produce with neighbours and pay only for your share.",
      image: '1464226184884-fa280b87c399',
      alt: "Fresh carrots, peppers and cucumbers",
      bg: '#12281a',
      ink: '#ffffff',
    },
  ];

  /** The first three crops on sale. */
  protected readonly trending = computed(() => {
    return this.store
      .liveCrops()
      .slice(0, 3)
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
      productId: crop.id,
      option: option.label,
      link: `/crops/${crop.id}`,
    });
  }
}
