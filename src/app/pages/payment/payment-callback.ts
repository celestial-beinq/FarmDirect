import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CartService } from '../../core/cart.service';
import { StoreService } from '../../core/store.service';

/**
 * Where Paystack sends the customer back to. The page does not decide
 * whether the payment worked — it asks our server, which asks Paystack.
 */
@Component({
  selector: 'app-payment-callback',
  imports: [RouterLink],
  template: `
    <section class="section">
      <div class="container">
        <div class="empty" aria-live="polite">
          @switch (state()) {
            @case ('checking') {
              <h2>Confirming your payment…</h2>
              <p class="muted">This only takes a moment. Please don't close the page.</p>
            }
            @case ('success') {
              <h2>Payment received — thank you!</h2>
              <p class="muted">
                Your order has been sent to the farm. You can follow it from your account.
              </p>
              <a routerLink="/account" [queryParams]="{ tab: 'orders' }" class="btn btn--primary"
                >View My Orders</a
              >
            }
            @case ('pending') {
              <h2>We haven't received your payment yet</h2>
              <p class="muted">
                If you completed the payment, it can take a minute to arrive. Otherwise your order
                is saved as "Awaiting payment" and nothing has been charged.
              </p>
              <button type="button" class="btn btn--primary" (click)="check()">Check Again</button>
            }
            @default {
              <h2>We couldn't confirm your payment</h2>
              <p class="muted">{{ message() }}</p>
              <a routerLink="/basket" class="btn btn--primary">Back to Basket</a>
            }
          }
        </div>
      </div>
    </section>
  `,
})
export class PaymentCallback {
  private readonly auth = inject(AuthService);
  private readonly cart = inject(CartService);
  private readonly store = inject(StoreService);

  /** Paystack adds "?reference=..." to the return address. */
  readonly reference = input<string>();

  protected readonly state = signal<'checking' | 'success' | 'pending' | 'failed'>('checking');
  protected readonly message = signal('');

  constructor() {
    effect(() => {
      this.reference();
      untracked(() => void this.check());
    });
  }

  protected async check(): Promise<void> {
    const reference = this.reference();
    if (!reference) {
      this.message.set('This page was opened without a payment reference.');
      this.state.set('failed');
      return;
    }

    this.state.set('checking');
    await this.auth.ready;
    const { data, error } = await this.store.verifyPayment(reference);

    if (error || !data) {
      this.message.set(error ?? 'Please try again.');
      this.state.set('failed');
    } else if (data.status === 'success') {
      this.cart.clear();
      await this.store.refresh();
      this.state.set('success');
    } else if (data.status === 'pending') {
      this.state.set('pending');
    } else {
      this.message.set('The payment did not go through. Nothing has been charged.');
      this.state.set('failed');
    }
  }
}
