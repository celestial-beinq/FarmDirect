import { Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Supabase } from '../../core/supabase';

@Component({
  selector: 'app-login',
  template: `
    <section class="section">
      <div class="container login">
        <h1>{{ mode() === 'in' ? 'Sign in' : 'Create your account' }}</h1>

        @if (!supabase.configured) {
          <p class="notice">
            Accounts are not set up yet. Add your Supabase details to the .env file (see SETUP.md)
            and restart the site.
          </p>
        }

        @if (confirmEmail()) {
          <p class="notice" role="status">
            Almost done — we've sent a confirmation link to your email. Open it, then sign in here.
          </p>
        }

        <div class="panel">
          <form class="form" (submit)="$event.preventDefault(); submit()">
            @if (mode() === 'up') {
              <div class="wide roles" role="radiogroup" aria-label="Account type">
                <button
                  type="button"
                  role="radio"
                  [attr.aria-checked]="role() === 'customer'"
                  [class.is-chosen]="role() === 'customer'"
                  (click)="role.set('customer')"
                >
                  <strong>I want to buy</strong>
                  <span>Order produce and join livestock pools</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  [attr.aria-checked]="role() === 'farmer'"
                  [class.is-chosen]="role() === 'farmer'"
                  (click)="role.set('farmer')"
                >
                  <strong>I'm a farmer</strong>
                  <span>List produce and receive orders</span>
                </button>
              </div>
              <label class="wide">
                Full name
                <input
                  #fullName
                  name="name"
                  autocomplete="name"
                  required
                  maxlength="120"
                  (input)="name.set(fullName.value)"
                />
              </label>
              @if (role() === 'farmer') {
                <label>
                  Farm name
                  <input
                    #farm
                    name="farm"
                    required
                    maxlength="120"
                    (input)="farmName.set(farm.value)"
                  />
                </label>
                <label>
                  Farm location
                  <input
                    #place
                    name="location"
                    placeholder="Town, State"
                    maxlength="160"
                    (input)="farmLocation.set(place.value)"
                  />
                </label>
              }
            }
            <label class="wide">
              Email
              <input
                #mail
                type="email"
                name="email"
                autocomplete="email"
                required
                (input)="email.set(mail.value)"
              />
            </label>
            <label class="wide">
              Password
              <input
                #pass
                type="password"
                name="password"
                required
                minlength="8"
                [attr.autocomplete]="mode() === 'in' ? 'current-password' : 'new-password'"
                (input)="password.set(pass.value)"
              />
              @if (mode() === 'up') {
                <small>At least 8 characters.</small>
              }
            </label>

            <div class="form__foot">
              <button type="submit" class="btn btn--primary" [disabled]="busy()">
                {{ busy() ? 'Please wait…' : mode() === 'in' ? 'Sign In' : 'Create Account' }}
              </button>
              @if (error()) {
                <span class="form__error" role="alert">{{ error() }}</span>
              }
            </div>
          </form>
        </div>

        <p class="switch">
          @if (mode() === 'in') {
            New to FarmDirect?
            <button type="button" (click)="setMode('up')">Create an account</button>
          } @else {
            Already have an account?
            <button type="button" (click)="setMode('in')">Sign in</button>
          }
        </p>
      </div>
    </section>
  `,
  styles: `
    .login {
      max-width: 560px;
    }

    h1 {
      margin-bottom: 24px;
      font-size: clamp(1.8rem, 4vw, 2.4rem);
      text-align: center;
    }

    .roles {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .roles button {
      padding: 14px 16px;
      border: 2px solid var(--line);
      border-radius: var(--radius-sm);
      text-align: left;
    }

    .roles button.is-chosen {
      border-color: var(--green-900);
      background: var(--cream);
    }

    .roles strong,
    .roles span {
      display: block;
    }

    .roles span,
    small {
      font-size: 0.78rem;
      font-weight: 400;
      color: var(--muted);
    }

    .switch {
      text-align: center;
      font-size: 0.92rem;
    }

    .switch button {
      font-weight: 600;
      text-decoration: underline;
    }
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly supabase = inject(Supabase);

  /** "?next=basket" sends a customer back to finish their order. */
  readonly next = input<string>();

  protected readonly mode = signal<'in' | 'up'>('in');
  protected readonly role = signal<'customer' | 'farmer'>('customer');
  protected readonly name = signal('');
  protected readonly farmName = signal('');
  protected readonly farmLocation = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');

  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly confirmEmail = signal(false);

  protected setMode(mode: 'in' | 'up'): void {
    this.mode.set(mode);
    this.error.set('');
  }

  protected async submit(): Promise<void> {
    const email = this.email().trim();
    const password = this.password();
    this.error.set('');

    if (!/^\S+@\S+\.\S+$/.test(email)) return this.error.set('Enter a valid email address.');
    if (password.length < 8) return this.error.set('Your password needs at least 8 characters.');

    this.busy.set(true);
    try {
      if (this.mode() === 'in') {
        const error = await this.auth.signIn(email, password);
        if (error) return this.error.set(error);
      } else {
        if (!this.name().trim()) return this.error.set('Enter your full name.');
        if (this.role() === 'farmer' && this.farmName().trim().length < 2) {
          return this.error.set('Enter your farm name.');
        }
        const result = await this.auth.signUp({
          email,
          password,
          fullName: this.name().trim(),
          role: this.role(),
          farmName: this.farmName().trim(),
          farmLocation: this.farmLocation().trim(),
        });
        if (result.error) return this.error.set(result.error);
        if (result.confirmEmail) {
          this.confirmEmail.set(true);
          this.setMode('in');
          return;
        }
      }

      const profile = this.auth.profile();
      if (profile?.role === 'customer' && this.next() === 'basket') {
        await this.router.navigate(['/basket']);
      } else {
        await this.router.navigateByUrl(this.auth.homePath());
      }
    } finally {
      this.busy.set(false);
    }
  }
}
