import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { Role } from '../../core/accounts';
import { AuthService } from '../../core/auth.service';
import { Icon, IconName } from '../../shared/icon';

@Component({
  selector: 'app-login',
  imports: [Icon],
  template: `
    <section class="section">
      <div class="container login">
        <h1>Sign in</h1>
        <p class="muted">
          This is a demo sign-in: choose a role to open that dashboard with a sample account. Real
          accounts with passwords need a backend.
        </p>

        <div class="roles">
          @for (option of options; track option.role) {
            <button type="button" class="role" (click)="choose(option.role)">
              <span class="role__icon"><app-icon [name]="option.icon" [size]="26" /></span>
              <strong>{{ option.title }}</strong>
              <span>{{ option.text }}</span>
              <span class="role__go">Continue <app-icon name="arrow-right" [size]="16" /></span>
            </button>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .login {
      max-width: 900px;
      text-align: center;
    }

    h1 {
      font-size: clamp(1.9rem, 4vw, 2.6rem);
    }

    p {
      max-width: 52ch;
      margin: 12px auto 40px;
    }

    .roles {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .role {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 28px 24px;
      border: 2px solid var(--line);
      border-radius: var(--radius);
      text-align: left;
      font-size: 0.88rem;
      color: var(--muted);
      transition: border-color 0.15s;
    }

    .role:hover {
      border-color: var(--green-900);
    }

    .role strong {
      font-family: var(--font-display);
      font-size: 1.2rem;
      color: var(--ink);
    }

    .role__icon {
      display: grid;
      place-items: center;
      width: 52px;
      height: 52px;
      margin-bottom: 8px;
      border-radius: 12px;
      background: var(--lime);
      color: var(--ink);
    }

    .role__go {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 12px;
      font-weight: 600;
      color: var(--ink);
    }

    @media (max-width: 720px) {
      .roles {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** "?next=basket" sends a customer back to finish their order. */
  readonly next = input<string>();

  protected readonly options: { role: Role; icon: IconName; title: string; text: string }[] = [
    {
      role: 'customer',
      icon: 'basket',
      title: 'Customer',
      text: 'Track orders, follow your livestock shares and manage your delivery address.',
    },
    {
      role: 'farmer',
      icon: 'leaf',
      title: 'Farmer',
      text: 'List your produce, handle incoming orders and see your sales.',
    },
    {
      role: 'admin',
      icon: 'shield',
      title: 'Admin',
      text: 'Verify farms, approve listings and oversee orders, pools and customers.',
    },
  ];

  protected choose(role: Role): void {
    this.auth.signIn(role);
    if (role === 'customer' && this.next() === 'basket') this.router.navigate(['/basket']);
    else this.router.navigateByUrl(this.auth.homePath());
  }
}
