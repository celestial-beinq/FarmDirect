import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CartService } from '../../core/cart.service';
import { StoreService } from '../../core/store.service';
import { Icon } from '../../shared/icon';
import { NairaPipe, PhotoPipe } from '../../shared/pipes';

@Component({
  selector: 'app-basket',
  imports: [RouterLink, Icon, NairaPipe, PhotoPipe],
  templateUrl: './basket.html',
  styleUrl: './basket.css',
})
export class Basket {
  protected readonly cart = inject(CartService);
  private readonly auth = inject(AuthService);
  private readonly store = inject(StoreService);
  private readonly router = inject(Router);

  protected readonly problem = signal('');

  /** Turns the basket into orders. Payment is not connected yet, so none is taken. */
  protected placeOrder(): void {
    this.auth.restore();
    this.store.restore();
    const session = this.auth.session();

    if (!session) {
      this.router.navigate(['/login'], { queryParams: { next: 'basket' } });
      return;
    }
    if (session.role !== 'customer') {
      this.problem.set(
        'Only customer accounts can place orders. Sign in as a customer to continue.',
      );
      return;
    }
    const customer = this.store.customers().find((c) => c.id === session.id);
    if (!customer || customer.status === 'suspended') {
      this.problem.set(
        'This account is suspended and cannot place orders. Please contact support.',
      );
      return;
    }

    this.store.placeOrders(customer, this.cart.items());
    this.cart.clear();
    this.router.navigate(['/account'], { queryParams: { tab: 'orders' } });
  }
}
