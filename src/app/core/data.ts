/**
 * Types for the catalogue, plus the small amount of content that is part
 * of the site itself (stock photos, blog teasers, storage tips).
 * Products, farms, pools and orders live in Supabase — see store.service.ts.
 */
import { buyOptions as priceOptions, unitsFromOption } from '../../../supabase/functions/_shared/pricing';

export { UNIT_PLURALS, unitsFromOption } from '../../../supabase/functions/_shared/pricing';
export type { BuyOption } from '../../../supabase/functions/_shared/pricing';

/** Builds an image URL. Accepts a full URL, or a stock-photo id. */
export function photo(image: string, width = 800): string {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  return `https://images.unsplash.com/photo-${image}?w=${width}&q=70&auto=format&fit=crop`;
}

export const IMAGES = {
  vegMix: '1464226184884-fa280b87c399',
  fruitMix: '1610832958506-aa56368176cf',
  potatoes: '1518977676601-b53f82aba655',
  rice: '1586201375761-83865001e31c',
  cow: '1570042225831-d98fa7577f1e',
  harvest: '1605000797499-95a51c5269ae',
  farmer: '1574943320219-553eb213f72d',
  wheat: '1500937386664-56d1dfef3854',
  sunset: '1500382017468-9049fed747ef',
  seedlings: '1523348837708-15d4a09cfac2',
} as const;

/* ------------------------------ Crops ------------------------------ */

export type CropCategory = 'Vegetables' | 'Fruits' | 'Tubers' | 'Grains';
export const CROP_CATEGORIES: CropCategory[] = ['Vegetables', 'Fruits', 'Tubers', 'Grains'];

export type ProductStatus = 'live' | 'pending' | 'paused' | 'rejected';

export interface Crop {
  id: string;
  name: string;
  category: CropCategory;
  /** Price in naira for one `unit`. */
  price: number;
  unit: string;
  tags: string[];
  image: string;
  gallery: string[];
  /** Where the farm is. */
  origin: string;
  description: string;
  highlights: string[];
  /** The farm that sells this crop. */
  farmerId: string;
  /** Available harvest quantity in `unit` (e.g. baskets or kg). */
  quantity: number;
  /** Only "live" crops from verified farms appear in the marketplace. */
  status: ProductStatus;
}

/**
 * The pack sizes a crop can be bought in. The prices come from the same
 * code the checkout function uses, so what is shown is what is charged.
 */
export function buyOptions(crop: Pick<Crop, 'price' | 'unit'>) {
  return priceOptions(crop.price, crop.unit);
}

/** Photo used for a new listing until the farmer has real photos. */
export const DEFAULT_IMAGE: Record<CropCategory, string> = {
  Vegetables: IMAGES.vegMix,
  Fruits: IMAGES.fruitMix,
  Tubers: IMAGES.potatoes,
  Grains: IMAGES.rice,
};

export const STORAGE_TIPS: Record<CropCategory, string> = {
  Vegetables:
    'Store leafy greens (Ugu, Ewedu, Shoko) wrapped loosely in dry paper or airy bags in your crisper drawer. Keep plum tomatoes, tatashe and rodo in a ventilated basket at room temperature until fully ripe.',
  Fruits:
    'Allow Benue mangoes, sweet plantains and papayas to ripen naturally at room temperature. Never refrigerate green cooking plantains. Wash fruits only right before eating.',
  Tubers:
    'Store Benue yams, sweet potatoes and Irish potatoes in a dry, dark, well-ventilated space elevated on slats or baskets — never on damp concrete floors. Keep away from onions.',
  Grains:
    'Store honey beans, Ofada rice, egusi and ogbono in airtight dry containers. Adding dry dried chilies or bay leaves naturally protects beans against weevils without chemicals.',
};

/* ---------------------------- Livestock ---------------------------- */

export type AnimalType = 'Cow' | 'Goat' | 'Ram';
export const ANIMAL_TYPES: AnimalType[] = ['Cow', 'Goat', 'Ram'];

export interface Animal {
  id: string;
  name: string;
  type: AnimalType;
  /** Price in naira for the whole animal. */
  price: number;
  weight: string;
  /** Approximate dressed meat yield in kg. */
  yieldKg: number;
  origin: string;
  image: string;
  gallery: string[];
  /** Smallest contribution allowed in a shared pool. */
  minShare: number;
  farmerId: string;
}

export interface Pool {
  id: string;
  animalId: string;
  name: string;
  /** Naira needed to buy the animal. */
  target: number;
  /** Naira paid in so far. */
  raised: number;
  members: number;
  /** e.g. "2 days" or "4 hours". */
  closesIn: string;
  status: 'open' | 'funded' | 'cancelled';
}

/* ------------------------------ Blog ------------------------------- */

export interface Post {
  title: string;
  topic: string;
  minutes: number;
  excerpt: string;
  image: string;
}

export const POSTS: Post[] = [
  {
    title: 'How to Tell Carbide-Ripened Fruit from the Real Thing',
    topic: 'Food Safety',
    minutes: 5,
    excerpt:
      'Uniform colour, a hard core and no smell are warning signs. Here is what naturally ripened fruit looks like.',
    image: IMAGES.fruitMix,
  },
  {
    title: 'From Farm Gate to Your Gate in Three Days',
    topic: 'How We Work',
    minutes: 6,
    excerpt: 'Why we only harvest after you order, and what happens between Thursday and Sunday.',
    image: IMAGES.harvest,
  },
  {
    title: 'Sharing a Cow: A Simple Guide for Families',
    topic: 'Livestock',
    minutes: 8,
    excerpt:
      'How buying pools work, what a share gets you, and how the meat is portioned and packed.',
    image: IMAGES.sunset,
  },
];
