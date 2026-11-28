import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Farmer, isFarmerVerified } from './accounts';
import { Crop } from './data';
import { StoreService } from './store.service';
import { Supabase } from './supabase';

describe('Security hardening invariants', () => {
  it('shows live crops for verified farms even when KYC/PII fields are stripped for shoppers', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: Supabase,
          useValue: { configured: true, client: null },
        },
      ],
    });

    const store = TestBed.inject(StoreService);

    const publicVerifiedFarm: Farmer = {
      id: 'farm-verified-public',
      ownerId: null,
      name: 'Ogun Valley Farm',
      location: 'Abeokuta, Ogun State',
      status: 'verified',
      joined: '2026-11-15T00:00:00Z',
    };
    const pendingFarm: Farmer = {
      id: 'farm-pending-public',
      ownerId: null,
      name: 'Unvetted Farm',
      location: 'Ibadan, Oyo State',
      status: 'pending',
      joined: '2026-11-15T00:00:00Z',
    };

    const crops: Crop[] = [
      {
        id: 'crop-live-verified',
        name: 'Ofada Rice',
        category: 'Grains',
        price: 2600,
        unit: 'kg',
        tags: [],
        image: '/images/ofada.jpg',
        gallery: ['/images/ofada.jpg'],
        origin: 'Abeokuta, Ogun State',
        description: 'Stone-free Ofada rice.',
        highlights: [],
        farmerId: publicVerifiedFarm.id,
        quantity: 20,
        status: 'live',
      },
      {
        id: 'crop-live-unverified',
        name: 'Unvetted Maize',
        category: 'Grains',
        price: 600,
        unit: 'piece',
        tags: [],
        image: '/images/maize.jpg',
        gallery: ['/images/maize.jpg'],
        origin: 'Ibadan, Oyo State',
        description: 'Should stay hidden.',
        highlights: [],
        farmerId: pendingFarm.id,
        quantity: 20,
        status: 'live',
      },
      {
        id: 'crop-pending-verified',
        name: 'Pending Yam',
        category: 'Tubers',
        price: 2800,
        unit: 'tuber',
        tags: [],
        image: '/images/yam.jpg',
        gallery: ['/images/yam.jpg'],
        origin: 'Abeokuta, Ogun State',
        description: 'Should stay hidden.',
        highlights: [],
        farmerId: publicVerifiedFarm.id,
        quantity: 20,
        status: 'pending',
      },
    ];

    store.farmers.set([publicVerifiedFarm, pendingFarm]);
    store.crops.set(crops);

    // Public farm records must not contain KYC/PII, yet liveCrops still renders verified produce.
    expect(isFarmerVerified(publicVerifiedFarm)).toBe(false);
    expect(store.liveCrops().map((c) => c.id)).toEqual(['crop-live-verified']);
  });
});
