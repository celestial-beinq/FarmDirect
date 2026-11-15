/**
 * Catalogue data. This is placeholder content so the UI can be built and
 * tested — replace it with calls to a real backend when one exists.
 */

/** Builds a stock-photo URL. Swap these for your own farm photos. */
export function photo(id: string, width = 800): string {
  return `https://images.unsplash.com/photo-${id}?w=${width}&q=70&auto=format&fit=crop`;
}

const IMG = {
  tomatoes: '1592924357228-91a4daadcfea',
  carrots: '1598170845058-32b9d6a5da37',
  bellPeppers: '1563565375-f3fdfdbefa83',
  chili: '1583119022894-919a68a3d0e3',
  spinach: '1576045057995-568f588f82fb',
  potatoes: '1518977676601-b53f82aba655',
  rice: '1586201375761-83865001e31c',
  mangoes: '1601493700631-2b16ec4b4716',
  pineapple: '1550258987-190a2d41a8ba',
  watermelon: '1587049352846-4a222e784d38',
  vegMix: '1464226184884-fa280b87c399',
  fruitMix: '1610832958506-aa56368176cf',
  market: '1488459716781-31db52582fe9',
  cow: '1570042225831-d98fa7577f1e',
  brownCow: '1527153857715-3908f2bae5e8',
  goat: '1524024973431-2ad916746881',
  sheep: '1484557985045-edf25e08da73',
  harvest: '1605000797499-95a51c5269ae',
  farmer: '1574943320219-553eb213f72d',
  wheat: '1500937386664-56d1dfef3854',
  rows: '1560493676-04071c5f467b',
  sunset: '1500382017468-9049fed747ef',
  bowl: '1546069901-ba9599a7e63c',
  seedlings: '1523348837708-15d4a09cfac2',
} as const;

export const IMAGES = IMG;

/* ------------------------------ Crops ------------------------------ */

export type CropCategory = 'Vegetables' | 'Fruits' | 'Tubers' | 'Grains';

export const CROP_CATEGORIES: CropCategory[] = ['Vegetables', 'Fruits', 'Tubers', 'Grains'];

export interface Crop {
  id: string;
  name: string;
  category: CropCategory;
  /** Price in naira for one `unit`. */
  price: number;
  unit: string;
  unitPlural: string;
  tags: string[];
  image: string;
  gallery: string[];
  origin: string;
  blurb: string;
  description: string;
  highlights: string[];
}

export interface BuyOption {
  group: string;
  label: string;
  price: number;
}

const round50 = (n: number) => Math.round(n / 50) * 50;

/** The pack sizes a crop can be bought in, with the price of each. */
export function buyOptions(crop: Crop): BuyOption[] {
  if (crop.unit === 'kg') {
    return [
      { group: 'By Weight', label: '5kg', price: crop.price * 5 },
      { group: 'By Weight', label: '10kg', price: crop.price * 10 },
      { group: 'By Weight', label: '25kg', price: crop.price * 25 },
      { group: 'By Basket', label: '1 basket (≈15kg)', price: round50(crop.price * 15 * 0.95) },
      { group: 'By Basket', label: '3 baskets (≈45kg)', price: round50(crop.price * 45 * 0.9) },
    ];
  }
  return [
    { group: 'Pack Size', label: `1 ${crop.unit}`, price: crop.price },
    { group: 'Pack Size', label: `5 ${crop.unitPlural}`, price: round50(crop.price * 5 * 0.95) },
    { group: 'Pack Size', label: `10 ${crop.unitPlural}`, price: round50(crop.price * 10 * 0.9) },
  ];
}

const organic = ['Grown without synthetic pesticides', 'Harvested to order, not stored'];

export const CROPS: Crop[] = [
  {
    id: 'tomatoes',
    name: 'Vine-Ripened Tomatoes',
    category: 'Vegetables',
    price: 1200,
    unit: 'kg',
    unitPlural: 'kg',
    tags: ['By Weight', 'Basket Available'],
    image: IMG.tomatoes,
    gallery: [IMG.tomatoes, IMG.vegMix, IMG.market, IMG.rows],
    origin: 'Ogun State farms',
    blurb: 'Plump, sun-ripened tomatoes picked at peak flavour.',
    description:
      'Plump, sun-ripened Nigerian tomatoes harvested at peak flavour. Firm skin and rich juice — right for jollof rice, stews or fresh salads.',
    highlights: [...organic, 'Sorted by hand before packing'],
  },
  {
    id: 'carrots',
    name: 'Crunchy Carrots',
    category: 'Vegetables',
    price: 850,
    unit: 'kg',
    unitPlural: 'kg',
    tags: ['By Weight', 'Direct Farm'],
    image: IMG.carrots,
    gallery: [IMG.carrots, IMG.vegMix, IMG.market, IMG.rows],
    origin: 'Plateau State farms',
    blurb: 'Sweet highland carrots with the tops still on.',
    description:
      'Sweet, crunchy carrots from the cool Jos plateau. Delivered with their tops on so you can see how fresh they are.',
    highlights: [...organic, 'Washed in clean water at the farm'],
  },
  {
    id: 'irish-potatoes',
    name: 'Irish Potatoes',
    category: 'Tubers',
    price: 900,
    unit: 'kg',
    unitPlural: 'kg',
    tags: ['By Weight', 'Bulk Pricing'],
    image: IMG.potatoes,
    gallery: [IMG.potatoes, IMG.market, IMG.rows, IMG.sunset],
    origin: 'Plateau State farms',
    blurb: 'Firm, clean potatoes for frying, boiling or porridge.',
    description:
      'Firm Irish potatoes dug the week you order. Even sized and clean skinned — good for chips, boiling or potato porridge.',
    highlights: ['Dug the week of delivery', 'No sprouting inhibitors used', 'Sorted for even size'],
  },
  {
    id: 'bell-peppers',
    name: 'Mixed Bell Peppers',
    category: 'Vegetables',
    price: 1800,
    unit: 'kg',
    unitPlural: 'kg',
    tags: ['By Weight'],
    image: IMG.bellPeppers,
    gallery: [IMG.bellPeppers, IMG.vegMix, IMG.market, IMG.rows],
    origin: 'Kaduna State farms',
    blurb: 'Red, yellow and green tatashe-style sweet peppers.',
    description:
      'A colourful mix of sweet bell peppers. Thick walled and crisp — they hold up in stir fries, stews and salads.',
    highlights: [...organic, 'Mixed colours in every pack'],
  },
  {
    id: 'chili-peppers',
    name: 'Red Chili (Shombo)',
    category: 'Vegetables',
    price: 1100,
    unit: 'kg',
    unitPlural: 'kg',
    tags: ['By Weight', 'Extra Hot'],
    image: IMG.chili,
    gallery: [IMG.chili, IMG.vegMix, IMG.market, IMG.rows],
    origin: 'Kano State farms',
    blurb: 'Long red chili with real heat and deep colour.',
    description:
      'Long red chili peppers with real heat and deep colour. Blend into your pepper mix or dry them for later.',
    highlights: [...organic, 'Naturally red — no colouring added'],
  },
  {
    id: 'spinach',
    name: 'Fresh Spinach Leaves',
    category: 'Vegetables',
    price: 400,
    unit: 'bunch',
    unitPlural: 'bunches',
    tags: ['Fresh Cut'],
    image: IMG.spinach,
    gallery: [IMG.spinach, IMG.seedlings, IMG.market, IMG.rows],
    origin: 'Lagos State farms',
    blurb: 'Tender green leaves cut the morning they ship.',
    description:
      'Tender spinach cut the morning it ships and kept cool on the way to you. Good for efo riro, smoothies and stir fries.',
    highlights: ['Cut the morning of dispatch', 'Irrigated with clean borehole water'],
  },
  {
    id: 'ofada-rice',
    name: 'Local Ofada Rice',
    category: 'Grains',
    price: 2400,
    unit: 'kg',
    unitPlural: 'kg',
    tags: ['By Weight', 'Stone-Free'],
    image: IMG.rice,
    gallery: [IMG.rice, IMG.farmer, IMG.wheat, IMG.sunset],
    origin: 'Ogun State farms',
    blurb: 'Unpolished local rice with its own aroma.',
    description:
      'Unpolished Ofada rice straight from the mill. Destoned and sealed at source — no plastic rice, no mixing with imported grain.',
    highlights: ['Milled and bagged at source', 'Destoned twice', 'Nothing mixed in'],
  },
  {
    id: 'mangoes',
    name: 'Sweet Mangoes',
    category: 'Fruits',
    price: 1500,
    unit: 'kg',
    unitPlural: 'kg',
    tags: ['By Weight', 'In Season'],
    image: IMG.mangoes,
    gallery: [IMG.mangoes, IMG.fruitMix, IMG.market, IMG.sunset],
    origin: 'Benue State farms',
    blurb: 'Tree-ripened mangoes, never forced with carbide.',
    description:
      'Juicy mangoes left to ripen on the tree. We never use calcium carbide or any other ripening chemical.',
    highlights: ['Tree-ripened — no carbide', 'Picked 48 hours before delivery'],
  },
  {
    id: 'pineapple',
    name: 'Sugarloaf Pineapple',
    category: 'Fruits',
    price: 1300,
    unit: 'piece',
    unitPlural: 'pieces',
    tags: ['Per Piece', 'Bulk Pricing'],
    image: IMG.pineapple,
    gallery: [IMG.pineapple, IMG.fruitMix, IMG.market, IMG.sunset],
    origin: 'Edo State farms',
    blurb: 'Low-acid pineapple that is sweet to the core.',
    description:
      'Sweet, low-acid pineapple harvested ripe. Each one is checked by hand before it leaves the farm.',
    highlights: ['Harvested ripe, not green', 'No ripening chemicals'],
  },
  {
    id: 'watermelon',
    name: 'Watermelon',
    category: 'Fruits',
    price: 2200,
    unit: 'piece',
    unitPlural: 'pieces',
    tags: ['Per Piece', 'Bulk Pricing'],
    image: IMG.watermelon,
    gallery: [IMG.watermelon, IMG.fruitMix, IMG.market, IMG.sunset],
    origin: 'Kano State farms',
    blurb: 'Large, deep-red melons with no injected sweetener.',
    description:
      'Large watermelons with deep red flesh. Nothing is injected — the sweetness comes from the field.',
    highlights: ['Nothing injected', 'Average weight 6–8kg'],
  },
  {
    id: 'vegetable-box',
    name: 'Weekly Vegetable Box',
    category: 'Vegetables',
    price: 12500,
    unit: 'box',
    unitPlural: 'boxes',
    tags: ['Mixed Box', 'Feeds a Family'],
    image: IMG.vegMix,
    gallery: [IMG.vegMix, IMG.market, IMG.carrots, IMG.tomatoes],
    origin: 'Plateau State farms',
    blurb: 'A week of seasonal vegetables in one box.',
    description:
      'Assorted seasonal vegetables harvested for your order: tomatoes, peppers, carrots, greens and whatever is best that week.',
    highlights: [...organic, 'Contents change with the season'],
  },
  {
    id: 'fruit-basket',
    name: 'Tropical Fruit Basket',
    category: 'Fruits',
    price: 8800,
    unit: 'basket',
    unitPlural: 'baskets',
    tags: ['Mixed Basket', 'In Season'],
    image: IMG.fruitMix,
    gallery: [IMG.fruitMix, IMG.mangoes, IMG.pineapple, IMG.watermelon],
    origin: 'Benue State farms',
    blurb: 'A mix of ripe seasonal fruit, picked for your order.',
    description:
      'A mix of ripe seasonal fruit — pineapple, pawpaw, citrus, mango — picked for your order and packed the same day.',
    highlights: ['Naturally ripened', 'Packed the day it is picked'],
  },
];

export const STORAGE_TIPS: Record<CropCategory, string> = {
  Vegetables:
    'Keep in a cool, airy place and use within 5–7 days. Refrigerate leafy greens in a loose bag; keep tomatoes out of the fridge until fully ripe.',
  Fruits:
    'Leave at room temperature to finish ripening, then refrigerate. Wash only just before eating.',
  Tubers: 'Store in a dark, dry, well-ventilated place — not the fridge. Keep away from onions.',
  Grains: 'Keep sealed in an airtight container in a cool, dry place, away from sunlight.',
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
}

export const ANIMALS: Animal[] = [
  {
    id: 'friesian-cross-cow',
    name: 'Friesian Cross Cow',
    type: 'Cow',
    price: 500000,
    weight: '280–320kg',
    yieldKg: 180,
    origin: 'Kaduna',
    image: IMG.cow,
    gallery: [IMG.cow, IMG.brownCow, IMG.sunset],
    minShare: 25000,
  },
  {
    id: 'brown-cross-cow',
    name: 'Brown Cross Cow',
    type: 'Cow',
    price: 450000,
    weight: '250–290kg',
    yieldKg: 160,
    origin: 'Adamawa',
    image: IMG.brownCow,
    gallery: [IMG.brownCow, IMG.cow, IMG.sunset],
    minShare: 25000,
  },
  {
    id: 'sahel-goat',
    name: 'White Sahel Goat',
    type: 'Goat',
    price: 75000,
    weight: '25–35kg',
    yieldKg: 14,
    origin: 'Kano',
    image: IMG.goat,
    gallery: [IMG.goat, IMG.sunset],
    minShare: 15000,
  },
  {
    id: 'farm-ram',
    name: 'Pasture-Raised Ram',
    type: 'Ram',
    price: 180000,
    weight: '45–60kg',
    yieldKg: 28,
    origin: 'Sokoto',
    image: IMG.sheep,
    gallery: [IMG.sheep, IMG.sunset],
    minShare: 20000,
  },
];

export interface Pool {
  id: string;
  animalId: string;
  name: string;
  /** Naira contributed so far. */
  raised: number;
  members: number;
  closesIn: string;
}

export const INITIAL_POOLS: Pool[] = [
  {
    id: 'lagos-island-04',
    animalId: 'friesian-cross-cow',
    name: 'Lagos Island Group 04',
    raised: 350000,
    members: 15,
    closesIn: '2 days',
  },
  {
    id: 'abuja-central-2',
    animalId: 'friesian-cross-cow',
    name: 'Abuja Central – Bulk 2',
    raised: 225000,
    members: 6,
    closesIn: '5 days',
  },
  {
    id: 'ikeja-early-bird',
    animalId: 'friesian-cross-cow',
    name: 'Ikeja Early Bird Shared',
    raised: 460000,
    members: 21,
    closesIn: '4 hours',
  },
  {
    id: 'lekki-families',
    animalId: 'brown-cross-cow',
    name: 'Lekki Families Pool',
    raised: 180000,
    members: 7,
    closesIn: '6 days',
  },
  {
    id: 'surulere-goat',
    animalId: 'sahel-goat',
    name: 'Surulere Goat Share',
    raised: 45000,
    members: 3,
    closesIn: '3 days',
  },
];

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
    image: IMG.fruitMix,
  },
  {
    title: 'From Farm Gate to Your Gate in Three Days',
    topic: 'How We Work',
    minutes: 6,
    excerpt:
      'Why we only harvest after you order, and what happens between Thursday and Sunday.',
    image: IMG.harvest,
  },
  {
    title: 'Sharing a Cow: A Simple Guide for Families',
    topic: 'Livestock',
    minutes: 8,
    excerpt:
      'How buying pools work, what a share gets you, and how the meat is portioned and packed.',
    image: IMG.sunset,
  },
];
