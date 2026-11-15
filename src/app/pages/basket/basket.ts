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

  protected readonly busy = signal(false);
  protected readonly problem = signal('');
  /** True when the problem is a missing delivery address, to show a link to fix it. */
  protected readonly needsAddress = signal(false);

  /**
   * Sends the basket to the server and goes to Paystack to pay. The server
   * works out the prices itself; the totals shown here are for display.
   */
  protected async pay(): Promise<void> {
    this.problem.set('');
    this.needsAddress.set(false);
    await this.auth.ready;
    const profile = this.auth.profile();

    if (!profile) {
      await this.router.navigate(['/login'], { queryParams: { next: 'basket' } });
      return;
    }
    if (profile.role !== 'customer') {
      return this.problem.set(
        'Only customer accounts can place orders. Sign in as a customer to continue.',
      );
    }
    if (!profile.address.trim()) {
      this.needsAddress.set(true);
      return this.problem.set('Add a delivery address before paying.');
    }

    this.busy.set(true);
    const { data, error } = await this.store.checkout(this.cart.items());
    if (error || !data) {
      this.busy.set(false);
      return this.problem.set(error ?? 'Could not start the payment. Please try again.');
    }
    // Paystack's own secure payment page. Card details never touch our site.
    location.href = data.authorizationUrl;
  }
}
