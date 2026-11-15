import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { buyOptions as serverOptions } from '../../supabase/functions/_shared/pricing';
import { App } from './app';
import { tone } from './core/accounts';
import { CartItem, CartService } from './core/cart.service';
import { buyOptions, photo } from './core/data';

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
    const item: CartItem = {
      key: 'a',
      productId: 'p1',
      kind: 'crop',
      option: '5kg',
      title: 'A',
      detail: '5kg',
      image: '',
      unitPrice: 500,
      qty: 1,
      link: '/',
    };
    cart.add(item);
    cart.add({ ...item, qty: 2 });
    expect(cart.items().length).toBe(1);
    expect(cart.count()).toBe(3);
    expect(cart.total()).toBe(1500);
  });

  it('should show the same prices the checkout function charges', () => {
    // The site and the server share one pricing file; this guards against drift.
    expect(buyOptions({ price: 1200, unit: 'kg' })).toEqual(serverOptions(1200, 'kg'));
    expect(buyOptions({ price: 1200, unit: 'kg' }).map((o) => o.price)).toEqual([
      6000, 12000, 30000, 17100, 48600,
    ]);
    expect(buyOptions({ price: 400, unit: 'bunch' }).map((o) => [o.label, o.price])).toEqual([
      ['1 bunch', 400],
      ['5 bunches', 1900],
      ['10 bunches', 3600],
    ]);
  });

  it('should build photo URLs and status colours', () => {
    expect(photo('https://example.com/a.jpg')).toBe('https://example.com/a.jpg');
    expect(photo('123-abc', 400)).toContain('photo-123-abc?w=400');
    expect(tone('Delivered')).toBe('good');
    expect(tone('Awaiting payment')).toBe('warn');
    expect(tone('Cancelled')).toBe('bad');
  });
});
