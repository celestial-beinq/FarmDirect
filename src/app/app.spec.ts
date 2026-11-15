import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { CUSTOMERS } from './core/accounts';
import { CartService } from './core/cart.service';
import { StoreService } from './core/store.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the brand name', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.logo')?.textContent).toContain('FarmDirect');
  });

  it('should total the basket and merge repeated items', () => {
    const cart = TestBed.inject(CartService);
    const item = {
      key: 'a',
      title: 'A',
      detail: '',
      image: '',
      unitPrice: 500,
      qty: 1,
      link: '/',
      kind: 'crop' as const,
      farmerId: 'f-ogun',
    };
    cart.add(item);
    cart.add({ ...item, qty: 2 });
    expect(cart.items().length).toBe(1);
    expect(cart.count()).toBe(3);
    expect(cart.total()).toBe(1500);
  });

  it('should split a basket into one order per farm', () => {
    const store = TestBed.inject(StoreService);
    const before = store.orders().length;
    const line = {
      title: 'A',
      detail: '',
      image: '',
      unitPrice: 1000,
      qty: 2,
      link: '/',
      kind: 'crop' as const,
    };
    const placed = store.placeOrders(CUSTOMERS[0], [
      { ...line, key: 'a', farmerId: 'f-ogun' },
      { ...line, key: 'b', farmerId: 'f-ogun' },
      { ...line, key: 'c', farmerId: 'f-benue' },
    ]);
    expect(placed.length).toBe(2);
    expect(placed.find((o) => o.farmerId === 'f-ogun')?.total).toBe(4000);
    expect(store.orders().length).toBe(before + 2);
  });

  it('should hide listings that are not approved or whose farm is not verified', () => {
    const store = TestBed.inject(StoreService);
    expect(store.liveCrops().some((c) => c.id === 'ugu-leaves')).toBe(false);
    store.setProductStatus('ugu-leaves', 'live');
    expect(store.liveCrops().some((c) => c.id === 'ugu-leaves')).toBe(true);
    store.setFarmerStatus('f-ogun', 'suspended');
    expect(store.liveCrops().some((c) => c.farmerId === 'f-ogun')).toBe(false);
  });
});
