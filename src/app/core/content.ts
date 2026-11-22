/**
 * Editorial content shared by the public pages: why FarmDirect exists, how to
 * spot tampered food, how farms are verified, what is in season, and the
 * Nigerian breeds we sell. Kept here so every page tells the same story.
 *
 * Wording note: claims about food tampering describe practices that NAFDAC and
 * the Nigerian press have warned about. Keep them general (no invented figures)
 * and keep the GMO wording about labelling and choice, not about health harm.
 */
import { IconName } from '../shared/icon';
import { IMAGES } from './data';

export interface Concern {
  icon: IconName;
  title: string;
  /** What is happening. */
  text: string;
  /** What FarmDirect does about it. */
  answer: string;
  image: string;
}

/** What is going wrong on the way from farm to Nigerian kitchens. */
export const FOOD_CONCERNS: Concern[] = [
  {
    icon: 'clock',
    title: 'Fruit forced ripe with carbide',
    text: 'Calcium carbide is used to turn green mangoes, bananas and pawpaw yellow overnight so they can be sold early. NAFDAC has warned against it repeatedly.',
    answer: 'Our farmers harvest close to ripeness and let fruit finish naturally. Carbide ripening gets a farm removed.',
    image: IMAGES.mango,
  },
  {
    icon: 'shield',
    title: 'Grains stored with poison',
    text: 'Beans and grains in open markets are sometimes sprayed with dichlorvos ("Sniper") to keep weevils away, a chemical made for killing insects in homes, not for food.',
    answer: 'Stored grains are kept dry, sealed and naturally cured. We never accept chemically treated storage.',
    image: IMAGES.beans,
  },
  {
    icon: 'eye',
    title: 'Dyed palm oil',
    text: 'Industrial dyes have been found in palm oil to make weak or mixed oil look rich and red. The colour is attractive but the dye is not food.',
    answer: 'Our palm oil is pressed by named producers and comes from a single source, with nothing added.',
    image: IMAGES.palmoil,
  },
  {
    icon: 'box',
    title: 'Fillers, stones and mixing',
    text: 'Rice mixed with stones, old stock blended with new and foreign rice bagged as local. Once food has passed through many hands, nobody can say what is in the bag.',
    answer: 'Every item goes from one farm straight to you, and the farm’s name and region are on the listing.',
    image: IMAGES.rice,
  },
  {
    icon: 'leaf',
    title: 'Seeds nobody tells you about',
    text: 'Nigeria has approved some genetically modified crop varieties, and market food is never labelled. You have no way of knowing what seed your food came from.',
    answer: 'Farms tell us the seed they plant, and we list local and heritage varieties so you can choose.',
    image: IMAGES.farmfield,
  },
  {
    icon: 'users',
    title: 'Livestock fattened with drugs',
    text: 'Some animals are given steroids or antibiotics in their last weeks so they look heavier at market, and they are sold without any health check.',
    answer: 'Our animals are raised on pasture and checked by a vet before sale, and the breed and origin are listed.',
    image: IMAGES.herder,
  },
];

export interface SpotTip {
  food: string;
  real: string;
  warning: string;
}

/** Simple checks anyone can do at the market. */
export const SPOT_TIPS: SpotTip[] = [
  {
    food: 'Mangoes, bananas & pawpaw',
    real: 'Colour comes in gradually, and the fruit smells sweet at the stalk and gives slightly when pressed.',
    warning: 'Bright, even yellow all over but hard inside, little or no smell, and it rots within a day or two.',
  },
  {
    food: 'Beans & grains',
    real: 'A clean, dry, slightly earthy smell. A few weevil holes in old stock are a sign nothing was sprayed.',
    warning: 'A sharp chemical or kerosene-like smell, or a white powdery coating. Soak and wash well if you are unsure.',
  },
  {
    food: 'Palm oil',
    real: 'Deep orange-red that goes cloudy and thick in the cold, with a nutty, earthy smell.',
    warning: 'Unusually bright red that stains your hands and won’t wash off, or oil that stays clear and runny when cold.',
  },
  {
    food: 'Tomatoes',
    real: 'Firm and heavy for its size, with an even red colour and a fresh green smell at the stem.',
    warning: 'Very red skin but pale and hard inside, or a sour smell, which is a sign of old stock or forced ripening.',
  },
  {
    food: 'Rice',
    real: 'Grains of the same size and colour, with only a light dust. Local rice may vary slightly but should be clean.',
    warning: 'Stones, chaff or very mixed grain sizes, or a plastic-like shine and a musty smell.',
  },
  {
    food: 'Meat',
    real: 'Bright to dark red meat, firm, with creamy fat and a mild smell.',
    warning: 'Grey or green patches, a slimy feel, or a chemical smell. Buy from animals you can trace.',
  },
];

export interface VerifyStep {
  icon: IconName;
  title: string;
  text: string;
}

/** What a farm goes through before it can sell on FarmDirect. */
export const VERIFY_STEPS: VerifyStep[] = [
  {
    icon: 'user',
    title: 'Identity check',
    text: 'Every farmer gives their NIN and home address, and we check them before any listing goes live.',
  },
  {
    icon: 'pin',
    title: 'Farm visit',
    text: 'We visit the farmland to confirm it exists, record its size and see what is actually growing.',
  },
  {
    icon: 'file',
    title: 'Growing practices',
    text: 'The farm declares its seed source, fertiliser and any sprays it uses, and agrees to our no-carbide, no-dye, no-chemical-storage rules.',
  },
  {
    icon: 'shield',
    title: 'Vet checks for livestock',
    text: 'Animals are inspected by a vet before sale and must come from pasture, not from a fattening pen.',
  },
  {
    icon: 'star',
    title: 'Ongoing reviews',
    text: 'Customer reviews and spot checks keep farms honest. Any farm that breaks the rules is suspended.',
  },
];

/** What our farms agree not to do. */
export const GROWN_WITHOUT = [
  'Calcium carbide ripening',
  'Dichlorvos ("Sniper") on stored food',
  'Artificial dyes or colouring',
  'Fillers, stones or mixed old stock',
  'Fattening steroids for livestock',
  'Unlabelled genetically modified seed',
];

/* ------------------------- Seasonal calendar ------------------------- */

export interface Season {
  name: string;
  /** Month numbers, 1 = January. */
  months: number[];
  note: string;
  foods: string[];
  image: string;
}

/**
 * When Nigerian produce is at its best. These are typical seasons;
 * they shift a little by region and year.
 */
export const SEASONS: Season[] = [
  {
    name: 'Dry season & Harmattan',
    months: [11, 12, 1, 2],
    note: 'Cool, dusty mornings. Northern irrigated farms supply tomatoes, peppers and onions, and they cost less.',
    foods: ['Agbalumo', 'Oranges', 'Watermelon', 'Tomatoes', 'Onions', 'Carrots', 'Sugarcane'],
    image: IMAGES.oranges,
  },
  {
    name: 'Early rains',
    months: [3, 4, 5],
    note: 'The first rains bring fresh leafy greens and the start of the mango season.',
    foods: ['Mangoes', 'Cashew apples', 'Ugu', 'Ewedu', 'Pineapple', 'Cucumber'],
    image: IMAGES.ugu,
  },
  {
    name: 'Peak rainy season',
    months: [6, 7, 8],
    note: 'Fresh corn and ube are everywhere and new yam arrives. Tomatoes become scarce and expensive.',
    foods: ['Fresh maize', 'Ube (bush pear)', 'New yam', 'Garden egg', 'Okra', 'Avocado'],
    image: IMAGES.maize,
  },
  {
    name: 'Late rains & harvest',
    months: [9, 10],
    note: 'The main harvest. Yam, rice, beans and groundnuts come in, and grain prices ease.',
    foods: ['Yam', 'Local rice', 'Beans', 'Groundnuts', 'Sweet potatoes', 'Plantain'],
    image: IMAGES.yam,
  },
];

/** The season that the given date falls in. */
export function seasonFor(date = new Date()): Season {
  const month = date.getMonth() + 1;
  return SEASONS.find((s) => s.months.includes(month)) ?? SEASONS[0];
}

/* ------------------------------ Regions ------------------------------ */

export interface Region {
  name: string;
  states: string;
  grows: string;
  image: string;
}

/** Where our produce comes from, and what each region is known for. */
export const REGIONS: Region[] = [
  {
    name: 'The North',
    states: 'Kano, Kaduna, Sokoto, Borno',
    grows: 'Onions, tomatoes, peppers, groundnuts, sorghum, beans, ginger, and Sokoto and Fulani livestock.',
    image: IMAGES.onions,
  },
  {
    name: 'The Middle Belt',
    states: 'Benue, Plateau, Nasarawa',
    grows: 'Yams, oranges, mangoes, Irish potatoes, carrots and acha. Benue is known as the food basket of the nation.',
    image: IMAGES.yam,
  },
  {
    name: 'The South West',
    states: 'Ogun, Oyo, Lagos',
    grows: 'Ofada rice, cassava and garri, plantain, cashew, pineapple, and leafy greens like ewedu and efo.',
    image: IMAGES.plantain,
  },
  {
    name: 'The South East & South South',
    states: 'Ebonyi, Enugu, Edo, Rivers',
    grows: 'Abakaliki rice, Nsukka pepper, ugu, bitterleaf, uziza, ogbono, palm oil and plantain.',
    image: IMAGES.palmoil,
  },
];

/* ------------------------------ Livestock ----------------------------- */

export interface Breed {
  name: string;
  type: 'Cow' | 'Goat' | 'Ram';
  from: string;
  text: string;
  image: string;
}

/** The Nigerian breeds we sell. */
export const BREEDS: Breed[] = [
  {
    name: 'White Fulani (Bunaji)',
    type: 'Cow',
    from: 'Across the North',
    text: 'Nigeria’s most common cattle. White coat, long lyre-shaped horns, and lean meat from animals that walk and graze freely.',
    image: IMAGES.whitefulani,
  },
  {
    name: 'Sokoto Gudali',
    type: 'Cow',
    from: 'Sokoto & the North West',
    text: 'A heavy, short-horned breed with a large hump, known for a high meat yield. A good choice for a shared pool.',
    image: IMAGES.gudali,
  },
  {
    name: 'Red Bororo (Rahaji)',
    type: 'Cow',
    from: 'Northern grasslands',
    text: 'Deep red coat and very long horns. A hardy breed raised by Bororo Fulani herders on open range.',
    image: IMAGES.redbororo,
  },
  {
    name: 'Red Sokoto goat',
    type: 'Goat',
    from: 'Sokoto, Kano, Katsina',
    text: 'A reddish-brown goat prized for tender meat and its skin. It is the most common goat in Nigerian markets.',
    image: IMAGES.redsokoto,
  },
  {
    name: 'West African Dwarf goat',
    type: 'Goat',
    from: 'The South',
    text: 'A small, sturdy goat raised in southern villages. Its meat is the favourite for pepper soup and asun.',
    image: IMAGES.dwarfgoat,
  },
  {
    name: 'Balami & Uda rams',
    type: 'Ram',
    from: 'The far North',
    text: 'Balami is a big white ram and Uda has a black or brown front and white back. Both are favourites for Sallah and celebrations.',
    image: IMAGES.balami,
  },
];
