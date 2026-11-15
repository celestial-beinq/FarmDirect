/**
 * Pack sizes and prices for a crop.
 *
 * This file is the single source of truth for pricing: the website imports
 * it to SHOW prices, and the checkout function imports it to CHARGE them.
 * The server never trusts a price sent by the browser — it recalculates
 * from the database using this same code.
 *
 * Keep this file free of imports so both Angular and Deno can load it.
 */

export interface BuyOption {
  group: string;
  label: string;
  price: number;
}

export const UNIT_PLURALS: Record<string, string> = {
  kg: 'kg',
  bunch: 'bunches',
  piece: 'pieces',
  basket: 'baskets',
  box: 'boxes',
  tuber: 'tubers',
  bag: 'bags',
};

const round50 = (n: number) => Math.round(n / 50) * 50;

/** `price` is the naira price of one `unit`. */
export function buyOptions(price: number, unit: string): BuyOption[] {
  if (unit === 'kg') {
    return [
      { group: 'By Weight', label: '5kg', price: price * 5 },
      { group: 'By Weight', label: '10kg', price: price * 10 },
      { group: 'By Weight', label: '25kg', price: price * 25 },
      { group: 'By Basket', label: '1 basket (≈15kg)', price: round50(price * 15 * 0.95) },
      { group: 'By Basket', label: '3 baskets (≈45kg)', price: round50(price * 45 * 0.9) },
    ];
  }
  const plural = UNIT_PLURALS[unit] ?? unit;
  return [
    { group: 'Pack Size', label: `1 ${unit}`, price },
    { group: 'Pack Size', label: `5 ${plural}`, price: round50(price * 5 * 0.95) },
    { group: 'Pack Size', label: `10 ${plural}`, price: round50(price * 10 * 0.9) },
  ];
}

/** Works out how many base units (e.g. baskets or kg) an option label + qty consumes. */
export function unitsFromOption(optionLabel: string | undefined, qty: number, unit: string): number {
  if (!optionLabel || qty <= 0) return Math.max(1, qty);
  if (unit === 'kg') {
    if (optionLabel.startsWith('5kg')) return 5 * qty;
    if (optionLabel.startsWith('10kg')) return 10 * qty;
    if (optionLabel.startsWith('25kg')) return 25 * qty;
    if (optionLabel.includes('1 basket')) return 15 * qty;
    if (optionLabel.includes('3 baskets')) return 45 * qty;
  }
  const match = optionLabel.match(/^(\d+)/);
  if (match) {
    return parseInt(match[1], 10) * qty;
  }
  return qty;
}

