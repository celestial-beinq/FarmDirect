/**
 * People and orders. Like the catalogue, this is sample data that stands in
 * for a real backend so the dashboards have something to show.
 */
import { IMAGES } from './data';

export type Role = 'customer' | 'farmer' | 'admin';

export type FarmerStatus = 'verified' | 'pending' | 'suspended';

export interface Farmer {
  id: string;
  /** Farm name shown to customers. */
  name: string;
  owner: string;
  location: string;
  phone: string;
  status: FarmerStatus;
  joined: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'suspended';
  joined: string;
}

export const ORDER_STEPS = ['Placed', 'Confirmed', 'Dispatched', 'Delivered'] as const;
export type OrderStatus = (typeof ORDER_STEPS)[number] | 'Cancelled';
export const ORDER_STATUSES: OrderStatus[] = [...ORDER_STEPS, 'Cancelled'];

export interface OrderItem {
  title: string;
  detail: string;
  image: string;
  unitPrice: number;
  qty: number;
  kind: 'crop' | 'animal' | 'pool';
  poolId?: string;
}

/** One order goes to one farm. A basket with items from several farms becomes several orders. */
export interface Order {
  id: string;
  customerId: string;
  farmerId: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  address: string;
}

/** Colour for a status badge: good (green), warn (amber) or bad (red). */
export function tone(status: string): 'good' | 'warn' | 'bad' {
  if (['verified', 'live', 'active', 'Delivered'].includes(status)) return 'good';
  if (['suspended', 'rejected', 'Cancelled'].includes(status)) return 'bad';
  return 'warn';
}

/* The accounts used by the demo sign-in. */
export const DEMO_CUSTOMER_ID = 'c-demo';
export const DEMO_FARMER_ID = 'f-ogun';

export const FARMERS: Farmer[] = [
  {
    id: 'f-ogun',
    name: 'Ogun Valley Farm',
    owner: 'Demo Farmer',
    location: 'Abeokuta, Ogun State',
    phone: '0800 000 0001',
    status: 'verified',
    joined: '2026-03-02',
  },
  {
    id: 'f-plateau',
    name: 'Plateau Fresh Growers',
    owner: 'Sample Farmer B',
    location: 'Jos, Plateau State',
    phone: '0800 000 0002',
    status: 'verified',
    joined: '2026-03-18',
  },
  {
    id: 'f-arewa',
    name: 'Arewa Harvest Co-op',
    owner: 'Sample Farmer C',
    location: 'Kano, Kano State',
    phone: '0800 000 0003',
    status: 'verified',
    joined: '2026-04-09',
  },
  {
    id: 'f-benue',
    name: 'Benue Orchards',
    owner: 'Sample Farmer D',
    location: 'Makurdi, Benue State',
    phone: '0800 000 0004',
    status: 'verified',
    joined: '2026-05-21',
  },
  {
    id: 'f-sahel',
    name: 'Sahel Livestock Ranch',
    owner: 'Sample Farmer E',
    location: 'Zaria, Kaduna State',
    phone: '0800 000 0005',
    status: 'verified',
    joined: '2026-06-14',
  },
  {
    id: 'f-edo',
    name: 'Greenfield Edo Farm',
    owner: 'Sample Farmer F',
    location: 'Benin City, Edo State',
    phone: '0800 000 0006',
    status: 'pending',
    joined: '2026-11-10',
  },
];

export const CUSTOMERS: Customer[] = [
  {
    id: 'c-demo',
    name: 'Demo Customer',
    email: 'customer@farmdirect.example',
    phone: '0800 000 0100',
    address: '12 Example Street, Ikeja, Lagos',
    status: 'active',
    joined: '2026-08-01',
  },
  {
    id: 'c-2',
    name: 'Sample Customer B',
    email: 'customer.b@farmdirect.example',
    phone: '0800 000 0101',
    address: '4 Sample Close, Wuse, Abuja',
    status: 'active',
    joined: '2026-09-12',
  },
  {
    id: 'c-3',
    name: 'Sample Customer C',
    email: 'customer.c@farmdirect.example',
    phone: '0800 000 0102',
    address: '9 Placeholder Road, Lekki, Lagos',
    status: 'active',
    joined: '2026-10-03',
  },
  {
    id: 'c-4',
    name: 'Sample Customer D',
    email: 'customer.d@farmdirect.example',
    phone: '0800 000 0103',
    address: '21 Demo Avenue, Surulere, Lagos',
    status: 'active',
    joined: '2026-10-27',
  },
];

const item = (
  title: string,
  detail: string,
  image: string,
  unitPrice: number,
  qty = 1,
  kind: OrderItem['kind'] = 'crop',
  poolId?: string,
): OrderItem => ({ title, detail, image, unitPrice, qty, kind, poolId });

const order = (
  id: string,
  customerId: string,
  farmerId: string,
  date: string,
  status: OrderStatus,
  items: OrderItem[],
): Order => ({
  id,
  customerId,
  farmerId,
  date,
  status,
  items,
  total: items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0),
  address: CUSTOMERS.find((c) => c.id === customerId)!.address,
});

export const ORDERS: Order[] = [
  order('FD-1001', 'c-demo', 'f-ogun', '2026-11-05', 'Delivered', [
    item('Vine-Ripened Tomatoes', '5kg', IMAGES.tomatoes, 6000, 2),
  ]),
  order('FD-1002', 'c-2', 'f-benue', '2026-11-08', 'Delivered', [
    item('Sweet Mangoes', '5kg', IMAGES.mangoes, 7500, 2),
  ]),
  order('FD-1003', 'c-3', 'f-sahel', '2026-11-10', 'Confirmed', [
    item(
      'Friesian Cross Cow share',
      'Lagos Island Group 04',
      IMAGES.cow,
      25000,
      1,
      'pool',
      'lagos-island-04',
    ),
  ]),
  order('FD-1004', 'c-demo', 'f-sahel', '2026-11-11', 'Confirmed', [
    item(
      'Friesian Cross Cow share',
      'Lagos Island Group 04',
      IMAGES.cow,
      50000,
      1,
      'pool',
      'lagos-island-04',
    ),
  ]),
  order('FD-1005', 'c-demo', 'f-plateau', '2026-11-12', 'Dispatched', [
    item('Weekly Vegetable Box', '1 box', IMAGES.vegMix, 12500),
    item('Crunchy Carrots', '5kg', IMAGES.carrots, 4250),
  ]),
  order('FD-1006', 'c-2', 'f-ogun', '2026-11-13', 'Confirmed', [
    item('Local Ofada Rice', '10kg', IMAGES.rice, 24000),
  ]),
  order('FD-1007', 'c-3', 'f-ogun', '2026-11-14', 'Placed', [
    item('Vine-Ripened Tomatoes', '10kg', IMAGES.tomatoes, 12000),
    item('Fresh Spinach Leaves', '5 bunches', IMAGES.spinach, 1900),
  ]),
  order('FD-1008', 'c-4', 'f-arewa', '2026-11-14', 'Placed', [
    item('Mixed Bell Peppers', '5kg', IMAGES.bellPeppers, 9000),
  ]),
];
