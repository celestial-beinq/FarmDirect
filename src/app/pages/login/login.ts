import { Component, OnInit, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';
import { IMAGES } from '../../core/data';
import { sanitizeEmail, sanitizeText } from '../../core/sanitizer';
import { Supabase } from '../../core/supabase';
import { Icon } from '../../shared/icon';
import { PhotoPipe } from '../../shared/pipes';

@Component({
  selector: 'app-login',
  imports: [RouterLink, Icon, PhotoPipe],
  template: `
    <section class="auth">
      <!-- Brand panel -->
      <aside
        class="auth__visual"
        [style.background-image]="'url(' + (img.harvest | photo: 1200) + ')'"
      >
        <div class="auth__visual-inner">
          <span class="auth__kicker">
            <app-icon name="leaf" [size]="16" />
            Farm-to-door marketplace
          </span>
          <h2>
            @if (mode() === 'in') {
              Good to see you again.
            } @else {
              Fresh food starts with a direct connection.
            }
          </h2>
          <p class="auth__lede">
            Order straight from verified Nigerian farms. Harvested for your order, delivered to your
            door — nothing in between.
          </p>

          <ul class="auth__perks">
            <li>
              <span><app-icon name="shield" [size]="18" /></span>
              <div>
                <strong>Verified farms only</strong>
                <small>Every farmer is checked before listing.</small>
              </div>
            </li>
            <li>
              <span><app-icon name="truck" [size]="18" /></span>
              <div>
                <strong>Harvested to order</strong>
                <small>From the farm gate to your gate in days.</small>
              </div>
            </li>
            <li>
              <span><app-icon name="users" [size]="18" /></span>
              <div>
                <strong>Shared livestock pools</strong>
                <small>Split a cow or ram with other families.</small>
              </div>
            </li>
          </ul>

          <figure class="auth__quote">
            <blockquote>
              “The tomatoes actually taste like tomatoes, and I know exactly which farm they came
              from.”
            </blockquote>
            <figcaption>— FarmDirect customer, Lagos</figcaption>
          </figure>
        </div>
      </aside>

      <!-- Form side -->
      <div class="auth__main">
        <div class="auth__card">
          <a routerLink="/" class="auth__back">
            <app-icon name="arrow-left" [size]="16" /> Back to home
          </a>

          <header class="auth__head">
            <h1>{{ mode() === 'in' ? 'Welcome back' : 'Create your account' }}</h1>
            <p>
              {{
                mode() === 'in'
                  ? 'Sign in to track orders, manage your basket and more.'
                  : 'Join FarmDirect in under a minute — it’s free.'
              }}
            </p>
          </header>

          <div class="tabs" role="tablist" aria-label="Account">
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="mode() === 'in'"
              [class.is-active]="mode() === 'in'"
              (click)="setMode('in')"
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="mode() === 'up'"
              [class.is-active]="mode() === 'up'"
              (click)="setMode('up')"
            >
              Create account
            </button>
            <span class="tabs__glider" [class.is-right]="mode() === 'up'" aria-hidden="true"></span>
          </div>

          @if (!supabase.configured) {
            <p class="alert alert--info">
              <app-icon name="info" [size]="18" />
              <span>
                Accounts are not set up yet. Add your Supabase details to the .env file (see
                SETUP.md) and restart the site.
              </span>
            </p>
          }

          @if (errorParam() === 'suspended') {
            <p class="alert alert--bad" role="alert">
              <app-icon name="info" [size]="18" />
              <span>
                Your account is currently suspended. Please
                <a routerLink="/contact">contact support</a>.
              </span>
            </p>
          }

          @if (reason() === 'inactivity') {
            <p class="alert alert--info" role="alert">
              <app-icon name="lock" [size]="18" />
              <span>
                For your security, you were signed out after 5 minutes of inactivity. Please sign
                in again.
              </span>
            </p>
          }

          @if (confirmEmail()) {
            <p class="alert alert--good" role="status">
              <app-icon name="mail" [size]="18" />
              <span>
                Almost done — we’ve sent a confirmation link to your email. Open it, then sign in
                here.
              </span>
            </p>
          }

          <form class="auth-form" novalidate (submit)="$event.preventDefault(); submit()">
            @if (mode() === 'up') {
              <fieldset class="roles">
                <legend>I’m joining as</legend>
                <div class="roles__grid" role="radiogroup" aria-label="Account type">
                  <button
                    type="button"
                    role="radio"
                    [attr.aria-checked]="role() === 'customer'"
                    [class.is-chosen]="role() === 'customer'"
                    (click)="role.set('customer')"
                  >
                    <span class="roles__icon"><app-icon name="basket" [size]="20" /></span>
                    <strong>A buyer</strong>
                    <small>Order produce and join livestock pools</small>
                    <span class="roles__tick"><app-icon name="check" [size]="14" /></span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    [attr.aria-checked]="role() === 'farmer'"
                    [class.is-chosen]="role() === 'farmer'"
                    (click)="role.set('farmer')"
                  >
                    <span class="roles__icon"><app-icon name="leaf" [size]="20" /></span>
                    <strong>A farmer</strong>
                    <small>List produce and receive orders</small>
                    <span class="roles__tick"><app-icon name="check" [size]="14" /></span>
                  </button>
                </div>
              </fieldset>

              <div class="field">
                <label for="auth-name">Full name</label>
                <div class="field__control">
                  <app-icon name="user" [size]="18" />
                  <input
                    #fullName
                    id="auth-name"
                    name="name"
                    autocomplete="name"
                    placeholder="e.g. Ngozi Adebayo"
                    required
                    maxlength="120"
                    (input)="name.set(fullName.value)"
                  />
                </div>
              </div>

              @if (role() === 'farmer') {
                <div class="field-row">
                  <div class="field">
                    <label for="auth-farm">Farm name</label>
                    <div class="field__control">
                      <app-icon name="leaf" [size]="18" />
                      <input
                        #farm
                        id="auth-farm"
                        name="farm"
                        placeholder="Green Valley Farm"
                        required
                        maxlength="120"
                        (input)="farmName.set(farm.value)"
                      />
                    </div>
                  </div>
                  <div class="field">
                    <label for="auth-location">Farm location</label>
                    <div class="field__control">
                      <app-icon name="pin" [size]="18" />
                      <input
                        #place
                        id="auth-location"
                        name="location"
                        placeholder="Town, State"
                        maxlength="160"
                        (input)="farmLocation.set(place.value)"
                      />
                    </div>
                  </div>
                </div>
              }
            }

            <div class="field">
              <label for="auth-email">Email address</label>
              <div class="field__control">
                <app-icon name="mail" [size]="18" />
                <input
                  #mail
                  id="auth-email"
                  type="email"
                  name="email"
                  autocomplete="email"
                  placeholder="you@example.com"
                  required
                  (input)="email.set(mail.value)"
                />
              </div>
            </div>

            <div class="field">
              <label for="auth-password">Password</label>
              <div class="field__control">
                <app-icon name="lock" [size]="18" />
                <input
                  #pass
                  id="auth-password"
                  [type]="showPassword() ? 'text' : 'password'"
                  name="password"
                  [placeholder]="mode() === 'in' ? 'Your password' : 'At least 8 characters'"
                  required
                  minlength="8"
                  [attr.autocomplete]="mode() === 'in' ? 'current-password' : 'new-password'"
                  (input)="password.set(pass.value)"
                />
                <button
                  type="button"
                  class="field__toggle"
                  [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                  [attr.aria-pressed]="showPassword()"
                  (click)="showPassword.set(!showPassword())"
                >
                  <app-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="18" />
                </button>
              </div>
              @if (mode() === 'up') {
                <div class="strength" [attr.data-level]="strength()">
                  <span></span><span></span><span></span>
                  <small>{{ strengthLabel() }}</small>
                </div>
              }
            </div>

            @if (error()) {
              <p class="alert alert--bad" role="alert">
                <app-icon name="info" [size]="18" />
                <span>{{ error() }}</span>
              </p>
            }

            <button type="submit" class="auth-submit" [disabled]="busy()">
              @if (busy()) {
                <span class="spinner" aria-hidden="true"></span> Please wait…
              } @else {
                {{ mode() === 'in' ? 'Sign in' : 'Create account' }}
                <app-icon name="arrow-right" [size]="18" />
              }
            </button>

            @if (mode() === 'up') {
              <p class="fine">
                By creating an account you agree to buy and sell fairly and honestly on FarmDirect.
              </p>
            }
          </form>

          <p class="switch">
            @if (mode() === 'in') {
              New to FarmDirect?
              <button type="button" (click)="setMode('up')">Create an account</button>
            } @else {
              Already have an account?
              <button type="button" (click)="setMode('in')">Sign in</button>
            }
          </p>

          <p class="help">Need help? <a routerLink="/contact">Contact our support team</a></p>

          @if (debugMode) {
            <div class="demo-box">
              <div class="demo-box__head">
                <span class="demo-badge">Developer debug mode</span>
                <h3>Try a demo account</h3>
                <p>Explore dashboards, orders, produce management and KYC.</p>
              </div>
              <div class="demo-box__buttons">
                <button type="button" class="btn-demo" (click)="loginAsDemo('customer')">
                  <span class="role-icon">🛒</span>
                  <div>
                    <strong>Customer</strong>
                    <small>Ngozi Adebayo · Lekki Phase 1</small>
                  </div>
                </button>
                <button type="button" class="btn-demo" (click)="loginAsDemo('farmer')">
                  <span class="role-icon">🚜</span>
                  <div>
                    <strong>Farmer</strong>
                    <small>Segun Adeleke · Ogun Valley</small>
                  </div>
                </button>
                <button type="button" class="btn-demo" (click)="loginAsDemo('admin')">
                  <span class="role-icon">🛡️</span>
                  <div>
                    <strong>Administrator</strong>
                    <small>FarmDirect HQ</small>
                  </div>
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      --accent: #059669;
      --accent-dark: #047857;
      --field-bg: #f8faf6;
      display: block;
    }

    .auth {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      min-height: calc(100dvh - 76px);
      background: var(--cream);
    }

    /* ---------- Brand panel ---------- */
    .auth__visual {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: clamp(32px, 4vw, 72px);
      background-color: var(--green-900);
      background-size: cover;
      background-position: center;
      color: var(--white);
      overflow: hidden;
    }

    .auth__visual::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(180deg, rgba(18, 40, 26, 0.6) 0%, rgba(18, 40, 26, 0.94) 70%),
        radial-gradient(circle at 20% 15%, rgba(207, 232, 110, 0.25), transparent 50%);
    }

    .auth__visual-inner {
      position: relative;
      max-width: 500px;
      width: 100%;
    }

    .auth__kicker {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(207, 232, 110, 0.16);
      border: 1px solid rgba(207, 232, 110, 0.4);
      color: var(--lime);
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .auth__visual h2 {
      margin: 20px 0 14px;
      font-size: clamp(1.85rem, 3.2vw, 2.6rem);
      font-weight: 800;
      line-height: 1.2;
    }

    .auth__lede {
      font-size: 1rem;
      line-height: 1.55;
      opacity: 0.88;
      max-width: 44ch;
    }

    .auth__perks {
      display: grid;
      gap: 16px;
      margin: 28px 0;
    }

    .auth__perks li {
      display: flex;
      gap: 14px;
      align-items: flex-start;
    }

    .auth__perks li > span {
      display: grid;
      place-items: center;
      flex: none;
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.12);
      color: var(--lime);
    }

    .auth__perks strong {
      display: block;
      font-size: 0.95rem;
    }

    .auth__perks small {
      display: block;
      font-size: 0.83rem;
      opacity: 0.78;
    }

    .auth__quote {
      margin: 0;
      padding: 16px 20px;
      border-radius: var(--radius);
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.14);
      backdrop-filter: blur(6px);
    }

    .auth__quote blockquote {
      margin: 0;
      font-size: 0.92rem;
      font-style: italic;
      line-height: 1.5;
    }

    .auth__quote figcaption {
      margin-top: 8px;
      font-size: 0.78rem;
      color: var(--lime);
    }

    /* ---------- Form side ---------- */
    .auth__main {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      padding: clamp(32px, 4vw, 72px);
      min-height: 100%;
      background: var(--cream);
    }

    .auth__card {
      width: 100%;
      max-width: 490px;
      margin: auto 0;
      padding: clamp(24px, 3.8vw, 40px);
      border-radius: var(--radius-lg);
      background: var(--white);
      box-shadow:
        0 1px 3px rgba(18, 40, 26, 0.05),
        0 20px 45px -15px rgba(18, 40, 26, 0.12);
    }

    .auth__back {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 22px;
      font-size: 0.83rem;
      font-weight: 600;
      color: var(--muted);
    }

    .auth__back:hover {
      color: var(--ink);
    }

    .auth__head h1 {
      font-size: clamp(1.6rem, 3vw, 2rem);
      font-weight: 800;
    }

    .auth__head p {
      margin-top: 6px;
      color: var(--muted);
      font-size: 0.93rem;
    }

    /* Tabs */
    .tabs {
      position: relative;
      display: grid;
      grid-template-columns: 1fr 1fr;
      margin: 24px 0 20px;
      padding: 4px;
      border-radius: 12px;
      background: var(--cream);
    }

    .tabs button {
      position: relative;
      z-index: 1;
      padding: 10px 12px;
      border-radius: 9px;
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--muted);
      transition: color 0.2s;
    }

    .tabs button.is-active {
      color: var(--ink);
    }

    .tabs__glider {
      position: absolute;
      top: 4px;
      bottom: 4px;
      left: 4px;
      width: calc(50% - 4px);
      border-radius: 9px;
      background: var(--white);
      box-shadow: 0 1px 3px rgba(18, 40, 26, 0.12);
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .tabs__glider.is-right {
      transform: translateX(100%);
    }

    /* Alerts */
    .alert {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      margin-bottom: 16px;
      padding: 12px 14px;
      border-radius: 10px;
      font-size: 0.85rem;
      line-height: 1.45;
    }

    .alert app-icon {
      margin-top: 1px;
    }

    .alert a {
      font-weight: 600;
      text-decoration: underline;
    }

    .alert--info {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
    }

    .alert--bad {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .alert--good {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
    }

    /* Form */
    .auth-form {
      display: grid;
      gap: 16px;
    }

    .auth-form .alert {
      margin-bottom: 0;
    }

    .roles {
      margin: 0;
      padding: 0;
      border: 0;
      min-width: 0;
    }

    .roles legend,
    .field label {
      display: block;
      margin-bottom: 6px;
      padding: 0;
      font-size: 0.82rem;
      font-weight: 600;
      color: #2f3a33;
    }

    .roles__grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .roles__grid button {
      position: relative;
      display: grid;
      gap: 2px;
      align-content: start;
      padding: 14px;
      border: 1.5px solid var(--line);
      border-radius: 12px;
      text-align: left;
      transition:
        border-color 0.15s,
        background 0.15s,
        box-shadow 0.15s;
    }

    .roles__grid button:hover {
      border-color: #c3c9bb;
    }

    .roles__grid button.is-chosen {
      border-color: var(--accent);
      background: #f0fdf7;
      box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
    }

    .roles__icon {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      margin-bottom: 8px;
      border-radius: 10px;
      background: var(--cream);
      color: var(--green-900);
    }

    .is-chosen .roles__icon {
      background: var(--accent);
      color: var(--white);
    }

    .roles__grid strong {
      font-size: 0.9rem;
    }

    .roles__grid small {
      font-size: 0.75rem;
      color: var(--muted);
      line-height: 1.35;
    }

    .roles__tick {
      position: absolute;
      top: 10px;
      right: 10px;
      display: grid;
      place-items: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--accent);
      color: var(--white);
      opacity: 0;
      transform: scale(0.6);
      transition:
        opacity 0.15s,
        transform 0.15s;
    }

    .is-chosen .roles__tick {
      opacity: 1;
      transform: scale(1);
    }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .field__control {
      display: flex;
      align-items: center;
      gap: 10px;
      height: 50px;
      padding: 0 14px;
      border: 1.5px solid var(--line);
      border-radius: 12px;
      background: var(--field-bg);
      color: #8a938c;
      transition:
        border-color 0.15s,
        box-shadow 0.15s,
        background 0.15s;
    }

    .field__control:hover {
      border-color: #c9cfc2;
    }

    .field__control:focus-within {
      border-color: var(--accent);
      background: var(--white);
      box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.14);
      color: var(--accent);
    }

    .field__control input {
      flex: 1;
      min-width: 0;
      height: 100%;
      padding: 0;
      border: 0;
      outline: 0;
      background: transparent;
      font-size: 1rem;
      color: var(--ink);
    }

    .field__control input::placeholder {
      color: #a3aba5;
    }

    .field__toggle {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      margin-right: -6px;
      border-radius: 8px;
      color: #7b847d;
    }

    .field__toggle:hover {
      background: var(--cream);
      color: var(--ink);
    }

    /* Password strength */
    .strength {
      display: grid;
      grid-template-columns: repeat(3, 1fr) auto;
      gap: 6px;
      align-items: center;
      margin-top: 8px;
    }

    .strength span {
      height: 4px;
      border-radius: 999px;
      background: var(--sand);
      transition: background 0.2s;
    }

    .strength small {
      min-width: 9ch;
      text-align: right;
      font-size: 0.74rem;
      color: var(--muted);
    }

    .strength[data-level='1'] span:nth-child(1) {
      background: #dc2626;
    }

    .strength[data-level='2'] span:nth-child(-n + 2) {
      background: #d97706;
    }

    .strength[data-level='3'] span {
      background: var(--accent);
    }

    .auth-submit {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      height: 52px;
      margin-top: 4px;
      border-radius: 12px;
      background: var(--green-900);
      color: var(--white);
      font-weight: 700;
      font-size: 0.97rem;
      transition:
        background 0.15s,
        transform 0.15s,
        box-shadow 0.15s;
    }

    .auth-submit app-icon {
      transition: transform 0.15s;
    }

    .auth-submit:hover:not(:disabled) {
      background: var(--green-800);
      box-shadow: 0 10px 24px -10px rgba(18, 40, 26, 0.6);
    }

    .auth-submit:hover:not(:disabled) app-icon {
      transform: translateX(3px);
    }

    .auth-submit:active:not(:disabled) {
      transform: translateY(1px);
    }

    .auth-submit:disabled {
      opacity: 0.7;
      cursor: progress;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.35);
      border-top-color: var(--white);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    .fine {
      font-size: 0.75rem;
      color: var(--muted);
      text-align: center;
    }

    .switch,
    .help {
      text-align: center;
      font-size: 0.9rem;
      color: var(--muted);
    }

    .switch {
      margin-top: 22px;
      padding-top: 20px;
      border-top: 1px solid var(--line);
    }

    .switch button,
    .help a {
      font-weight: 700;
      color: var(--accent-dark);
    }

    .switch button:hover,
    .help a:hover {
      text-decoration: underline;
    }

    .help {
      margin-top: 8px;
      font-size: 0.82rem;
    }

    /* ---------- Demo accounts ---------- */
    .demo-box {
      margin-top: 24px;
      padding: 18px;
      border: 1px dashed #c9cfc2;
      border-radius: var(--radius);
      background: var(--field-bg);
    }

    .demo-box__head {
      text-align: center;
      margin-bottom: 14px;
    }

    .demo-badge {
      display: inline-block;
      padding: 3px 10px;
      margin-bottom: 6px;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      background: var(--lime);
      color: var(--green-900);
      border-radius: 999px;
    }

    .demo-box__head h3 {
      font-size: 1rem;
      font-weight: 700;
    }

    .demo-box__head p {
      font-size: 0.8rem;
      color: var(--muted);
    }

    .demo-box__buttons {
      display: grid;
      gap: 8px;
    }

    .btn-demo {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: var(--white);
      text-align: left;
      transition:
        border-color 0.15s,
        transform 0.15s;
    }

    .btn-demo:hover {
      border-color: var(--accent);
      transform: translateY(-1px);
    }

    .role-icon {
      font-size: 1.35rem;
      line-height: 1;
    }

    .btn-demo strong {
      display: block;
      font-size: 0.86rem;
    }

    .btn-demo small {
      display: block;
      font-size: 0.74rem;
      color: var(--muted);
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* ---------- Responsive Breakpoints ---------- */
    @media (min-width: 1600px) {
      .auth__visual {
        padding-right: 96px;
      }

      .auth__main {
        padding-left: 96px;
      }

      .auth__card {
        max-width: 520px;
      }

      .auth__visual-inner {
        max-width: 540px;
      }
    }

    @media (max-width: 1024px) {
      .auth {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
      }

      .auth__visual {
        padding: 32px 24px;
      }

      .auth__main {
        padding: 32px 24px;
      }

      .auth__perks {
        gap: 12px;
        margin: 20px 0;
      }

      .auth__quote {
        display: none;
      }
    }

    @media (max-width: 860px) {
      .auth {
        grid-template-columns: 1fr;
        min-height: auto;
      }

      .auth__visual {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 220px;
        padding: 36px 20px;
        text-align: center;
      }

      .auth__visual-inner {
        max-width: 520px;
        margin: 0 auto;
      }

      .auth__perks,
      .auth__quote,
      .auth__lede {
        display: none;
      }

      .auth__visual h2 {
        font-size: 1.75rem;
        margin: 12px 0 0;
      }

      .auth__main {
        align-items: center;
        justify-content: center;
        padding: 32px 20px 48px;
        background:
          radial-gradient(circle at 50% 0%, rgba(207, 232, 110, 0.28), transparent 55%),
          var(--cream);
      }

      .auth__card {
        max-width: 500px;
        margin: 0 auto;
      }
    }

    @media (max-width: 560px) {
      .auth__visual {
        display: none;
      }

      .auth__main {
        padding: 16px 12px 32px;
        align-items: stretch;
      }

      .auth__card {
        max-width: 100%;
        padding: 22px 16px;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(18, 40, 26, 0.08);
      }

      .auth__head h1 {
        font-size: 1.55rem;
      }

      .roles__grid,
      .field-row {
        grid-template-columns: 1fr;
        gap: 10px;
      }

      .field__control {
        height: 48px;
      }

      .auth-submit {
        height: 48px;
      }

      .tabs {
        margin: 18px 0 16px;
      }

      .tabs button {
        padding: 9px 8px;
        font-size: 0.85rem;
      }
    }

    @media (max-height: 720px) and (min-width: 861px) {
      .auth__visual {
        padding-top: 20px;
        padding-bottom: 20px;
      }

      .auth__perks {
        margin: 14px 0;
        gap: 8px;
      }

      .auth__quote {
        display: none;
      }

      .auth__card {
        padding: 22px 28px;
      }

      .auth-form {
        gap: 12px;
      }
    }
  `,
})
export class Login implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly supabase = inject(Supabase);
  protected readonly debugMode = environment.debug;
  protected readonly img = IMAGES;

  /** "?next=basket" sends a customer back to finish their order. */
  readonly next = input<string>();
  /** "?error=suspended" displays account suspension message. */
  readonly errorParam = input<string>('', { alias: 'error' });
  /** "?reason=inactivity" displays session inactivity timeout message. */
  readonly reason = input<string>();
  /** From route data: the /signup route opens on the "create account" tab. */
  readonly start = input<'in' | 'up'>('in');

  protected readonly mode = signal<'in' | 'up'>('in');
  protected readonly role = signal<'customer' | 'farmer'>('customer');
  protected readonly name = signal('');
  protected readonly farmName = signal('');
  protected readonly farmLocation = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly showPassword = signal(false);

  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly confirmEmail = signal(false);

  constructor() {
    void this.auth.ready.then(() => {
      if (this.auth.profile()) {
        void this.router.navigateByUrl(this.auth.homePath());
      }
    });
  }

  ngOnInit(): void {
    this.mode.set(this.start() === 'up' ? 'up' : 'in');
  }

  /** 0 = empty, 1 = too short, 2 = good, 3 = strong. */
  protected strength(): number {
    const p = this.password();
    if (!p) return 0;
    if (p.length < 8) return 1;
    let score = 1;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/\d/.test(p) || /[^A-Za-z0-9]/.test(p)) score++;
    return Math.min(score, 3);
  }

  protected strengthLabel(): string {
    return ['At least 8 characters', 'Too short', 'Good', 'Strong'][this.strength()];
  }

  protected setMode(mode: 'in' | 'up'): void {
    this.mode.set(mode);
    this.error.set('');
  }

  protected async submit(): Promise<void> {
    const email = sanitizeEmail(this.email());
    const password = this.password();
    this.error.set('');

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return this.error.set('Enter a valid email address.');
    }
    if (!password || password.trim().length < 8) {
      return this.error.set('Your password needs at least 8 characters.');
    }

    this.busy.set(true);
    try {
      if (this.mode() === 'in') {
        const error = await this.auth.signIn(email, password);
        if (error) return this.error.set(error);
      } else {
        const fullName = sanitizeText(this.name(), 120);
        if (!fullName) return this.error.set('Enter your full name.');

        const farm = sanitizeText(this.farmName(), 120);
        const location = sanitizeText(this.farmLocation(), 160);

        if (this.role() === 'farmer' && farm.length < 2) {
          return this.error.set('Enter your farm name.');
        }

        const result = await this.auth.signUp({
          email,
          password,
          fullName,
          role: this.role(),
          farmName: farm,
          farmLocation: location,
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

  protected async loginAsDemo(role: 'customer' | 'farmer' | 'admin'): Promise<void> {
    if (!this.debugMode) return;
    this.auth.signInDemo(role);
    if (role === 'customer' && this.next() === 'basket') {
      await this.router.navigate(['/basket']);
    } else {
      await this.router.navigateByUrl(this.auth.homePath());
    }
  }
}
