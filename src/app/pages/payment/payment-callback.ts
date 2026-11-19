import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Order } from '../../core/accounts';
import { AuthService } from '../../core/auth.service';
import { CartService } from '../../core/cart.service';
import { StoreService } from '../../core/store.service';
import { Supabase } from '../../core/supabase';
import { Icon } from '../../shared/icon';

export interface ReceiptItem {
  title: string;
  detail?: string;
  unitPrice: number;
  qty: number;
}

export interface ReceiptData {
  orderCode: string;
  date: string;
  items: ReceiptItem[];
  total: number;
  paymentMethod: string;
  customerName?: string;
  address?: string;
}

/**
 * Where Paystack sends the customer back to. Displays an authentic
 * thermal paper receipt ticket upon successful payment confirmation.
 */
@Component({
  selector: 'app-payment-callback',
  imports: [RouterLink, Icon],
  templateUrl: './payment-callback.html',
  styleUrl: './payment-callback.css',
})
export class PaymentCallback {
  private readonly auth = inject(AuthService);
  private readonly cart = inject(CartService);
  private readonly store = inject(StoreService);
  private readonly supabase = inject(Supabase);

  /** Paystack adds "?reference=..." to the return address. */
  readonly reference = input<string>();

  protected readonly state = signal<'checking' | 'success' | 'pending' | 'failed'>('checking');
  protected readonly message = signal('');

  protected readonly receipt = signal<ReceiptData>({
    orderCode: 'ORD-2048',
    date: this.formatReceiptDate(),
    items: [],
    total: 0,
    paymentMethod: 'Paystack',
  });

  constructor() {
    effect(() => {
      this.reference();
      untracked(() => void this.check());
    });
  }

  /** Formats date to receipt style: "11 AUG 2026 · 14:32" */
  protected formatReceiptDate(dStr?: string): string {
    const d = dStr ? new Date(dStr) : new Date();
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} · ${hours}:${mins}`;
  }

  /** Formats amounts with 2 decimal places e.g. "1,200.00" */
  protected formatAmount(val: number): string {
    return new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  }

  protected printReceipt(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
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

    // Snapshot cart items before any clear in case refresh doesn't return immediately
    const cartBackup = [...this.cart.items()];

    const { data, error } = await this.store.verifyPayment(reference);

    if (error || !data) {
      this.message.set(error ?? 'Please try again.');
      this.state.set('failed');
    } else if (data.status === 'success') {
      await this.store.refresh();

      // Find matching order(s) for this payment
      const client = this.supabase.client;
      let matchedOrders: Order[] = [];

      if (client && !reference.startsWith('DEMO-')) {
        try {
          const { data: payment } = await client
            .from('payments')
            .select('id, amount, created_at')
            .eq('reference', reference)
            .maybeSingle();

          if (payment) {
            matchedOrders = this.store.orders().filter((o) => o.paymentId === payment.id);
          }
        } catch {
          // Fall through to fallback matching
        }
      }

      if (matchedOrders.length === 0) {
        const userOrders = this.store.orders();
        if (userOrders.length > 0) {
          matchedOrders = [userOrders[0]];
        }
      }

      if (matchedOrders.length > 0) {
        const items: ReceiptItem[] = matchedOrders.flatMap((o) =>
          o.items.map((i) => ({
            title: i.title,
            detail: i.detail,
            unitPrice: i.unitPrice,
            qty: i.qty,
          })),
        );
        const total = matchedOrders.reduce((sum, o) => sum + o.total, 0);
        const orderCode = matchedOrders
          .map((o) => 'ORD-' + o.code.replace(/^FD-/, ''))
          .join(', ');
        const date = this.formatReceiptDate(matchedOrders[0]?.date);
        const address = matchedOrders[0]?.address;
        const customerName = matchedOrders[0]?.customerName;

        this.receipt.set({
          orderCode: orderCode || 'ORD-2048',
          date,
          items,
          total,
          paymentMethod: 'Paystack',
          customerName,
          address,
        });
      } else if (cartBackup.length > 0) {
        const items: ReceiptItem[] = cartBackup.map((i) => ({
          title: i.title,
          detail: i.detail,
          unitPrice: i.unitPrice,
          qty: i.qty,
        }));
        const total = cartBackup.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
        const orderCode = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
        const date = this.formatReceiptDate();

        this.receipt.set({
          orderCode,
          date,
          items,
          total,
          paymentMethod: 'Paystack',
        });
      }

      this.cart.clear();
      this.state.set('success');
    } else if (data.status === 'pending') {
      this.state.set('pending');
    } else {
      this.message.set('The payment did not go through. Nothing has been charged.');
      this.state.set('failed');
    }
  }
}
