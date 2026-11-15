import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { CartService } from './core/cart.service';

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
    const item = { key: 'a', title: 'A', detail: '', image: '', unitPrice: 500, qty: 1, link: '/' };
    cart.add(item);
    cart.add({ ...item, qty: 2 });
    expect(cart.items().length).toBe(1);
    expect(cart.count()).toBe(3);
    expect(cart.total()).toBe(1500);
  });
});
