import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/cart.service';
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
  /** Shown when checkout is pressed — there is no payment provider connected yet. */
  protected readonly checkoutNotice = signal(false);
}
