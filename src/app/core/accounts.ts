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
  /** Raw saved settings; read them through SettingsService. */
  settings?: Record<string, unknown>;
}

export type FarmerStatus = 'verified' | 'pending' | 'rejected' | 'suspended';

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
] as const;

/** A farm. Sample farms have no owner account. */
export interface Farmer {
  id: string;
  ownerId: string | null;
  name: string;
  location: string;
  status: FarmerStatus;
  joined: string;
  // Verification & Vetting Dossier fields
  nin?: string;
  residentialAddress?: string;
  farmSize?: string;
  cropProduces?: string;
  stateOfOrigin?: string;
  documentUrl?: string;
  verificationNotes?: string;
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
  paymentId?: string;
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

/** Check if farmer has submitted all compulsory verification dossier items. */
export function getFarmerVerificationErrors(farmer: Farmer | null | undefined): string[] {
  if (!farmer) return ['Farmer profile not found.'];
  const errors: string[] = [];
  const nin = (farmer.nin || '').replace(/\D/g, '');
  if (!nin || nin.length !== 11) {
    errors.push('National Identity Number (NIN) must be exactly 11 digits.');
  }
  if (!farmer.residentialAddress || farmer.residentialAddress.trim().length < 5) {
    errors.push('Complete residential address is compulsory.');
  }
  if (!farmer.location || farmer.location.trim().length < 3) {
    errors.push('Farmland location / address is compulsory.');
  }
  if (!farmer.farmSize || farmer.farmSize.trim().length < 2) {
    errors.push('Farm size (e.g. 5 Hectares or 10 Acres) is compulsory.');
  }
  if (!farmer.cropProduces || farmer.cropProduces.trim().length < 2) {
    errors.push('Primary crop & livestock produces are compulsory.');
  }
  return errors;
}

/** A farmer is fully verified for listing only when status is verified AND all compulsory vetting dossier fields are valid. */
export function isFarmerVerified(farmer: Farmer | null | undefined): boolean {
  if (!farmer || farmer.status !== 'verified') return false;
  return getFarmerVerificationErrors(farmer).length === 0;
}
