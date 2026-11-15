import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from './core/auth.service';
import { CartService } from './core/cart.service';
import { Supabase } from './core/supabase';
import { Icon } from './shared/icon';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);
  protected readonly supabase = inject(Supabase);
  private readonly router = inject(Router);
  protected readonly menuOpen = signal(false);

  /** True on the dashboards, which fill the screen and bring their own menu. */
  protected readonly bare = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => {
        let route = this.router.routerState.snapshot.root;
        while (route.firstChild) route = route.firstChild;
        return route.data['bare'] === true;
      }),
    ),
    { initialValue: false },
  );
  protected readonly year = new Date().getFullYear();

  protected readonly links = [
    { path: '/', label: 'Home', exact: true },
    { path: '/about', label: 'About Us', exact: false },
    { path: '/crops', label: 'Crops', exact: false },
    { path: '/livestock', label: 'Livestock', exact: false },
    { path: '/blog', label: 'Blog', exact: false },
  ];
}
