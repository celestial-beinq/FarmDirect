/** Types for people, orders and reviews. The data itself lives in Supabase. */

export type Role = 'customer' | 'farmer' | 'admin';

export interface Profile {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'suspended';
  joined: string;
}

export type FarmerStatus = 'verified' | 'pending' | 'suspended';

/** A farm. Sample farms have no owner account. */
export interface Farmer {
  id: string;
  ownerId: string | null;
  name: string;
  location: string;
  status: FarmerStatus;
  joined: string;
}

export const ORDER_STEPS = ['Placed', 'Confirmed', 'Dispatched', 'Delivered'] as const;
export type OrderStatus = 'Awaiting payment' | (typeof ORDER_STEPS)[number] | 'Cancelled';
export const ORDER_STATUSES: OrderStatus[] = ['Awaiting payment', ...ORDER_STEPS, 'Cancelled'];

export interface OrderItem {
  productId: string | null;
  poolId: string | null;
  kind: 'crop' | 'animal' | 'pool';
  title: string;
  detail: string;
  image: string;
  unitPrice: number;
  qty: number;
}

/** One order goes to one farm. A basket with items from several farms becomes several orders. */
export interface Order {
  id: string;
  /** The number shown to people, e.g. "FD-1001". */
  code: string;
  customerId: string;
  customerName: string;
  farmerId: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  address: string;
}

export interface Review {
  id: string;
  productId: string;
  customerId: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

/** Colour for a status badge: good (green), warn (amber) or bad (red). */
export function tone(status: string): 'good' | 'warn' | 'bad' {
  if (['verified', 'live', 'active', 'Delivered', 'funded'].includes(status)) return 'good';
  if (['suspended', 'rejected', 'Cancelled', 'cancelled'].includes(status)) return 'bad';
  return 'warn';
}
