/**
 * Types for the catalogue, plus the small amount of content that is part
 * of the site itself (stock photos, blog teasers, storage tips).
 * Products, farms, pools and orders live in Supabase — see store.service.ts.
 */
import { buyOptions as priceOptions, unitsFromOption } from '../../../supabase/functions/_shared/pricing';

export { UNIT_PLURALS, unitsFromOption } from '../../../supabase/functions/_shared/pricing';
export type { BuyOption } from '../../../supabase/functions/_shared/pricing';

/**
 * Builds an image URL. Accepts a full URL, a site path such as
 * "/images/yam.jpg" (photos kept in public/images), or an Unsplash photo id.
 */
export function photo(image: string, width = 800): string {
  if (!image) return '';
  if (image.startsWith('http') || image.startsWith('/')) return image;
  return `https://images.unsplash.com/photo-${image}?w=${width}&q=70&auto=format&fit=crop`;
}

/** A photo kept in public/images (credited on /photo-credits). */
const local = (key: string) => `/images/${key}.jpg`;

/** Photos of real Nigerian produce, markets, farms and livestock. */
export const IMAGES = {
  // Scenes
  market: local('pepper-market'),
  fruitStall: local('fruit-stall'),
  vegSpread: local('veg-spread'),
  plantation: local('plantation'),
  cattle: local('cattle'),
  beef: local('beef'),
  pineapple: local('pineapple'),
  vegmarket: local('vegmarket'),
  /** Unsplash: harvest workers in a field. */
  farmer: '1605000797499-95a51c5269ae',
  farmfield: local('farmfield'),
  harvestbasket: local('harvestbasket'),
  herder: local('herder'),
  /** Portrait, 1280px wide: for tall frames that would blur a landscape photo. */
  yamfarm: local('yamfarm'),
  /** 1920px wide: for full-height background panels. */
  harvestWide: local('harvestbasket-wide'),
  dishes: local('dishes'),
  // Produce
  tomatoes: local('tomatoes'),
  ugu: local('ugu'),
  mango: local('mango'),
  plantain: local('plantain'),
  oranges: local('oranges'),
  yam: local('yam'),
  maize: local('maize'),
  beans: local('beans'),
  rice: local('rice'),
  palmoil: local('palmoil'),
  onions: local('onions'),
  // Livestock
  whitefulani: local('whitefulani'),
  gudali: local('gudali'),
  redbororo: local('redbororo'),
  redsokoto: local('redsokoto'),
  dwarfgoat: local('dwarfgoat'),
  balami: local('balami'),
  // Older names still used around the site
  vegMix: local('veg-spread'),
  fruitMix: local('fruit-stall'),
  potatoes: local('yam'),
  cow: local('whitefulani'),
  harvest: local('harvestbasket'),
  wheat: local('farmfield'),
  sunset: local('herder'),
  seedlings: local('ugu'),
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
    'Store leafy greens (Ugu, Ewedu, Shoko, Scent Leaves, Waterleaf) wrapped loosely in dry paper or airy bags in your crisper drawer. Keep plum tomatoes, tatashe, rodo and red onions in a ventilated basket at room temperature. Keep fresh ginger dry and unpeeled.',
  Fruits:
    'Allow Benue mangoes, sweet bananas, avocados, and papayas to ripen naturally at room temperature. Never refrigerate green cooking plantains. Soften bush pears (ube) in warm water right before serving.',
  Tubers:
    'Store Benue white & yellow yams, water yams, sweet potatoes and Irish potatoes in a dry, dark, well-ventilated space elevated on slats or baskets, never on damp concrete floors.',
  Grains:
    'Store honey beans, brown drum beans, Ofada rice, egusi, ogbono, and acha in airtight dry containers. Keep virgin palm oil and raw honey tightly sealed in a cool, dark pantry away from direct heat or moisture.',
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
  /** Where the card leads. */
  link: string;
  fragment?: string;
}

export const POSTS: Post[] = [
  {
    title: 'How to Tell Carbide-Ripened Fruit from the Real Thing',
    topic: 'Food Safety',
    minutes: 5,
    excerpt:
      'Uniform colour, a hard core and no smell are warning signs. Here is what naturally ripened fruit looks like.',
    image: IMAGES.mango,
    link: '/real-food',
    fragment: 'spot',
  },
  {
    title: 'From Farm Gate to Your Gate in Three Days',
    topic: 'How We Work',
    minutes: 6,
    excerpt: 'Why we only harvest after you order, and what happens between Thursday and Sunday.',
    image: IMAGES.harvest,
    link: '/how-it-works',
  },
  {
    title: 'Sharing a Cow: A Simple Guide for Families',
    topic: 'Livestock',
    minutes: 8,
    excerpt:
      'How buying pools work, what a share gets you, and how the meat is portioned and packed.',
    image: IMAGES.whitefulani,
    link: '/livestock',
  },
];
