import { Component, OnDestroy, OnInit, inject, input, signal } from '@angular/core';
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
        [style.background-image]="'url(' + (img.harvestWide | photo: 1920) + ')'"
      >
        <div class="auth__visual-inner">
          <span class="auth__kicker">
            <app-icon name="leaf" [size]="16" />
            Farm-to-door marketplace
          </span>
          <h2>
            @if (mode() === 'in') {
              Good to see you again.
            } @else if (mode() === 'confirm') {
              Verify your email.
            } @else {
              Fresh food starts with a direct connection.
            }
          </h2>
          <p class="auth__lede">
            Order straight from verified Nigerian farms. Harvested for your order, delivered to your
            door, nothing in between.
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
            <figcaption>FarmDirect customer, Lagos</figcaption>
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
            <h1>
              @if (mode() === 'confirm') {
                Confirm your email
              } @else if (mode() === 'up') {
                Create your account
              } @else {
                Welcome back
              }
            </h1>
            <p>
              @if (mode() === 'confirm') {
                Enter the confirmation code sent to your email to verify your account.
              } @else if (mode() === 'up') {
                Join FarmDirect in under a minute: it’s free.
              } @else {
                Sign in to track orders, manage your basket and more.
              }
            </p>
          </header>

          @if (mode() !== 'confirm') {
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
          }

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

          @if (confirmEmail() && mode() !== 'confirm') {
            <p class="alert alert--good" role="status">
              <app-icon name="mail" [size]="18" />
              <span>
                Almost done: we’ve sent a confirmation code to your email.
                <button type="button" class="confirm-link-btn" (click)="setMode('confirm')">Enter code</button>
              </span>
            </p>
          }

          @if (mode() === 'confirm') {
            <form class="auth-form" novalidate (submit)="$event.preventDefault(); verifyCode()">
              <div class="confirm-email-chip">
                <app-icon name="mail" [size]="18" />
                <span class="confirm-email-chip__text">{{ email() }}</span>
                <button type="button" class="confirm-email-chip__edit" (click)="setMode('up')">
                  Change
                </button>
              </div>

              <div class="field">
                <label for="auth-code">Confirmation code</label>
                <div class="field__control">
                  <app-icon name="lock" [size]="18" />
                  <input
                    #code
                    id="auth-code"
                    type="text"
                    inputmode="numeric"
                    autocomplete="one-time-code"
                    placeholder="Enter 6-digit code"
                    maxlength="8"
                    required
                    [value]="confirmationCode()"
                    (input)="confirmationCode.set(code.value)"
                  />
                </div>
                <p class="field-hint">
                  Please check your inbox or spam folder for your confirmation code.
                  @if (debugMode && demoCodeHint()) {
                    <span class="demo-code-note">Demo code: {{ demoCodeHint() }}</span>
                  }
                </p>
              </div>

              @if (error()) {
                <p class="alert alert--bad" role="alert">
                  <app-icon name="info" [size]="18" />
                  <span>{{ error() }}</span>
                </p>
              }

              @if (resendMessage()) {
                <p class="alert alert--good" role="status">
                  <app-icon name="check" [size]="18" />
                  <span>{{ resendMessage() }}</span>
                </p>
              }

              <button
                type="submit"
                class="auth-submit"
                [disabled]="busy() || !confirmationCode().trim()"
              >
                @if (busy()) {
                  <span class="spinner" aria-hidden="true"></span> Verifying…
                } @else {
                  Verify and sign in
                  <app-icon name="arrow-right" [size]="18" />
                }
              </button>

              <div class="resend-row">
                <span>Didn’t receive the code?</span>
                <button
                  type="button"
                  class="resend-btn"
                  [disabled]="resendCooldown() > 0 || resendBusy()"
                  (click)="resendCode()"
                >
                  @if (resendCooldown() > 0) {
                    Resend in {{ resendCooldown() }}s
                  } @else if (resendBusy()) {
                    Sending…
                  } @else {
                    Resend code
                  }
                </button>
              </div>

              <p class="switch">
                Want to sign in with an existing account?
                <button type="button" (click)="setMode('in')">Sign in</button>
              </p>
            </form>
          } @else {
            <form class="auth-form" novalidate (submit)="$event.preventDefault(); submit()">
              @if (mode() === 'up') {
                <div class="steps">
                  <p class="steps__label">
                    Step {{ upStep() }} of 3 <span aria-hidden="true">·</span>
                    <strong>{{ stepTitles[upStep() - 1] }}</strong>
                  </p>
                  <div class="steps__bar" aria-hidden="true">
                    @for (n of [1, 2, 3]; track n) {
                      <span [class.is-done]="n <= upStep()"></span>
                    }
                  </div>
                </div>
              }

              @if (mode() === 'up' && upStep() === 1) {
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
                      <span class="roles__icon"><app-icon name="basket" [size]="18" /></span>
                      <span class="roles__text">
                        <strong>A buyer</strong>
                        <small>Order produce and join livestock pools</small>
                      </span>
                      <span class="roles__tick"><app-icon name="check" [size]="14" /></span>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      [attr.aria-checked]="role() === 'farmer'"
                      [class.is-chosen]="role() === 'farmer'"
                      (click)="role.set('farmer')"
                    >
                      <span class="roles__icon"><app-icon name="leaf" [size]="18" /></span>
                      <span class="roles__text">
                        <strong>A farmer</strong>
                        <small>List produce and receive orders</small>
                      </span>
                      <span class="roles__tick"><app-icon name="check" [size]="14" /></span>
                    </button>
                  </div>
                </fieldset>
              }

              @if (mode() === 'up' && upStep() === 2) {
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
                      [value]="name()"
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
                          [value]="farmName()"
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
                          [value]="farmLocation()"
                          maxlength="160"
                          (input)="farmLocation.set(place.value)"
                        />
                      </div>
                    </div>
                  </div>
                }
              }

              @if (mode() === 'in' || upStep() === 3) {
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
                    [value]="email()"
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
                    [value]="password()"
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
              }

              @if (error()) {
                <p class="alert alert--bad" role="alert">
                  <app-icon name="info" [size]="18" />
                  <span>{{ error() }}</span>
                </p>
              }

              <div class="auth-actions">
                @if (mode() === 'up' && upStep() > 1) {
                  <button type="button" class="auth-back-step" [disabled]="busy()" (click)="prevStep()">
                    <app-icon name="arrow-left" [size]="18" /> Back
                  </button>
                }
                <button type="submit" class="auth-submit" [disabled]="busy()">
                  @if (busy()) {
                    <span class="spinner" aria-hidden="true"></span> Please wait…
                  } @else {
                    {{ mode() === 'in' ? 'Sign in' : upStep() < 3 ? 'Continue' : 'Create account' }}
                    <app-icon name="arrow-right" [size]="18" />
                  }
                </button>
              </div>

              @if (mode() === 'up' && upStep() === 3) {
                <p class="fine">
                  By creating an account you agree to buy and sell fairly and honestly on FarmDirect.
                </p>
              }
            </form>

          }

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
      /* Two equal halves, so neither side swamps the other on wide screens. */
      grid-template-columns: minmax(0, 1fr) minmax(460px, 1fr);
      /* The page has no shop header (the route is "bare"), so fill the screen. */
      min-height: 100dvh;
      width: 100%;
      background: var(--cream);
      overflow-x: hidden;
    }

    /* ---------- Brand panel ---------- */
    .auth__visual {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
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
      /* Darker only behind the text (left), clear on the right so the photo shows. */
      background:
        linear-gradient(
          90deg,
          rgba(18, 40, 26, 0.72) 0%,
          rgba(18, 40, 26, 0.5) 45%,
          rgba(18, 40, 26, 0.12) 100%
        ),
        linear-gradient(180deg, transparent 60%, rgba(18, 40, 26, 0.35) 100%);
    }

    /* Keeps white text readable over the brighter parts of the photo. */
    .auth__visual h2,
    .auth__lede,
    .auth__perks strong,
    .auth__perks small {
      text-shadow: 0 1px 12px rgba(0, 0, 0, 0.45);
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
      align-items: center;
      justify-content: center;
      padding: clamp(24px, 3.5vw, 64px);
      min-height: 100%;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      background: var(--cream);
    }

    .auth__card {
      width: 100%;
      max-width: 420px;
      min-width: 0;
      margin: auto;
      box-sizing: border-box;
      padding: clamp(20px, 2.5vw, 30px);
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
      margin-bottom: 14px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--muted);
    }

    .auth__back:hover {
      color: var(--ink);
    }

    .auth__head h1 {
      font-size: clamp(1.4rem, 2.4vw, 1.65rem);
      font-weight: 800;
    }

    .auth__head p {
      margin-top: 4px;
      color: var(--muted);
      font-size: 0.86rem;
    }

    /* Tabs */
    .tabs {
      position: relative;
      display: grid;
      grid-template-columns: 1fr 1fr;
      margin: 18px 0 16px;
      padding: 4px;
      border-radius: 10px;
      background: var(--cream);
    }

    .tabs button {
      position: relative;
      z-index: 1;
      padding: 7px 10px;
      border-radius: 8px;
      font-size: 0.84rem;
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

    .confirm-link-btn {
      margin-left: 6px;
      font-weight: 700;
      color: var(--accent-dark);
      text-decoration: underline;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
    }

    .confirm-email-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 12px;
      background: var(--cream);
      border: 1.5px solid var(--line);
      font-size: 0.88rem;
      color: var(--ink);
      min-width: 0;
      word-break: break-all;
    }

    .confirm-email-chip app-icon {
      color: var(--accent);
      flex-shrink: 0;
    }

    .confirm-email-chip__text {
      flex: 1;
      font-weight: 600;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .confirm-email-chip__edit {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--accent-dark);
      text-decoration: underline;
      cursor: pointer;
      background: none;
      border: none;
      padding: 0;
    }

    .confirm-email-chip__edit:hover {
      color: var(--green-900);
    }

    .field-hint {
      margin-top: 6px;
      font-size: 0.78rem;
      color: var(--muted);
      line-height: 1.4;
    }

    .demo-code-note {
      display: block;
      margin-top: 4px;
      font-weight: 600;
      color: var(--accent-dark);
    }

    .field__control input#auth-code {
      letter-spacing: 0.16em;
      font-weight: 700;
      font-size: 1.15rem;
    }

    .resend-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding-top: 4px;
      font-size: 0.85rem;
      color: var(--muted);
    }

    .resend-btn {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--accent-dark);
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background 0.15s, color 0.15s;
    }

    .resend-btn:hover:not(:disabled) {
      background: var(--cream);
      color: var(--green-900);
      text-decoration: underline;
    }

    .resend-btn:disabled {
      color: var(--muted);
      cursor: not-allowed;
      text-decoration: none;
      opacity: 0.7;
    }

    /* Form */
    .auth-form {
      display: grid;
      gap: 12px;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }

    .auth-form .alert {
      margin-bottom: 0;
    }

    .roles {
      margin: 0;
      padding: 0;
      border: 0;
      min-width: 0;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }

    .roles legend,
    .field label {
      display: block;
      margin-bottom: 5px;
      padding: 0;
      font-size: 0.78rem;
      font-weight: 600;
      color: #2f3a33;
    }

    .roles__grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }

    .roles__grid button {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 36px 12px 12px;
      border: 1.5px solid var(--line);
      border-radius: 10px;
      text-align: left;
      min-width: 0;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
      word-break: break-word;
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
      flex: none;
      width: 36px;
      height: 36px;
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
      top: 50%;
      right: 8px;
      margin-top: -9px;
      display: grid;
      place-items: center;
      width: 18px;
      height: 18px;
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
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }

    .field {
      min-width: 0;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }

    .field__control {
      display: flex;
      align-items: center;
      gap: 9px;
      height: 42px;
      padding: 0 12px;
      border: 1.5px solid var(--line);
      border-radius: 10px;
      background: var(--field-bg);
      color: #8a938c;
      width: 100%;
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
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
      outline: none !important;
      box-shadow: none !important;
      color: var(--accent);
    }

    .field__control input {
      flex: 1;
      min-width: 0;
      width: 100%;
      height: 100%;
      padding: 0;
      border: 0;
      outline: 0;
      background: transparent;
      font-size: 0.92rem;
      color: var(--ink);
      box-sizing: border-box;
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
      height: 44px;
      margin-top: 2px;
      border-radius: 10px;
      background: var(--green-900);
      color: var(--white);
      font-weight: 700;
      font-size: 0.92rem;
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
      margin-top: -4px;
      font-size: 0.72rem;
      line-height: 1.4;
      color: var(--muted);
      text-align: center;
    }

    .switch,
    .help {
      text-align: center;
      font-size: 0.84rem;
      color: var(--muted);
    }

    .switch {
      margin-top: 16px;
      padding-top: 14px;
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
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid var(--line);
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

    /* ---------- Sign-up steps ---------- */
    .steps {
      display: grid;
      gap: 8px;
    }

    .steps__label {
      font-size: 0.78rem;
      color: var(--muted);
    }

    .steps__label strong {
      color: var(--ink);
    }

    .steps__bar {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }

    .steps__bar span {
      height: 4px;
      border-radius: 999px;
      background: var(--line);
      transition: background 0.2s;
    }

    .steps__bar span.is-done {
      background: var(--accent);
    }

    .roles__text {
      display: grid;
      gap: 1px;
      min-width: 0;
    }

    .auth-actions {
      display: flex;
      gap: 10px;
    }

    .auth-actions .auth-submit {
      flex: 1;
    }

    .auth-back-step {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 44px;
      margin-top: 2px;
      padding: 0 16px;
      border: 1.5px solid var(--line);
      border-radius: 10px;
      background: var(--white);
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--ink);
      transition: border-color 0.15s, background 0.15s;
    }

    .auth-back-step:hover:not(:disabled) {
      border-color: #c3c9bb;
      background: var(--cream);
    }

    .auth-back-step:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* ---------- Responsive Breakpoints ---------- */
    /* Big screens: let the text and the form grow a little so they don't look lost. */
    @media (min-width: 1600px) {
      .auth__card {
        max-width: 440px;
      }

      .auth__visual-inner {
        max-width: 580px;
      }

      .auth__visual h2 {
        font-size: 3rem;
      }

      .auth__lede {
        font-size: 1.1rem;
      }
    }

    @media (max-width: 1120px) and (min-width: 901px) {
      .auth {
        grid-template-columns: minmax(0, 1fr) minmax(440px, 490px);
      }

      .auth__visual {
        padding: 32px 24px;
      }

      .auth__main {
        padding: 24px 20px;
      }

      .auth__card {
        max-width: 420px;
        padding: 22px 20px;
      }

      .auth__perks {
        gap: 12px;
        margin: 20px 0;
      }

      .auth__quote {
        display: none;
      }
    }

    @media (max-width: 900px) {
      .auth {
        grid-template-columns: 1fr;
        min-height: auto;
      }

      .auth__visual {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        padding: 28px 20px;
        text-align: center;
      }

      /* Text is centred here, so shade evenly instead of from the left. */
      .auth__visual::before {
        background: rgba(18, 40, 26, 0.5);
      }

      .auth__visual-inner {
        max-width: 480px;
        margin: 0 auto;
      }

      .auth__perks,
      .auth__quote,
      .auth__lede {
        display: none;
      }

      .auth__visual h2 {
        font-size: 1.65rem;
        margin: 10px 0 0;
      }

      .auth__main {
        align-items: center;
        justify-content: center;
        padding: 24px 16px 40px;
        background:
          radial-gradient(circle at 50% 0%, rgba(207, 232, 110, 0.28), transparent 55%),
          var(--cream);
      }

      .auth__card {
        max-width: 420px;
        margin: 0 auto;
        padding: 24px 20px;
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
        padding: 20px 14px;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(18, 40, 26, 0.08);
      }

      .auth__head h1 {
        font-size: 1.45rem;
      }

      .field-row {
        grid-template-columns: 1fr;
        gap: 10px;
      }

      .field__control {
        height: 46px;
      }

      .field__control input {
        font-size: 1rem;
      }

      .auth-submit {
        height: 46px;
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
export class Login implements OnInit, OnDestroy {
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

  protected readonly mode = signal<'in' | 'up' | 'confirm'>('in');
  protected readonly role = signal<'customer' | 'farmer'>('customer');
  /** Which sign-up step is showing: 1 who you are, 2 your details, 3 email & password. */
  protected readonly upStep = signal<1 | 2 | 3>(1);
  protected readonly stepTitles = ['Who are you?', 'Your details', 'Secure your account'];
  protected readonly name = signal('');
  protected readonly farmName = signal('');
  protected readonly farmLocation = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly showPassword = signal(false);

  /* --- Email Confirmation Code (OTP) State --- */
  protected readonly confirmationCode = signal('');
  protected readonly demoCodeHint = signal('');
  protected readonly resendCooldown = signal(0);
  protected readonly resendMessage = signal('');
  protected readonly resendBusy = signal(false);
  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

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

  ngOnDestroy(): void {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
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

  protected setMode(mode: 'in' | 'up' | 'confirm'): void {
    if (mode === 'up' && this.mode() !== 'up') this.upStep.set(1);
    this.mode.set(mode);
    this.error.set('');
    this.resendMessage.set('');
    this.confirmationCode.set('');
  }

  /** Goes back one sign-up step, keeping what was typed. */
  protected prevStep(): void {
    this.error.set('');
    const step = this.upStep();
    if (step > 1) this.goToStep((step - 1) as 1 | 2);
  }

  /** Checks the current sign-up step. Returns an error message, or '' if it's fine. */
  private stepError(step: 1 | 2 | 3): string {
    if (step === 2) {
      if (!sanitizeText(this.name(), 120)) return 'Enter your full name.';
      if (this.role() === 'farmer' && sanitizeText(this.farmName(), 120).length < 2) {
        return 'Enter your farm name.';
      }
    }
    return '';
  }

  private goToStep(step: 1 | 2 | 3): void {
    this.upStep.set(step);
    // Put the cursor in the first field of the new step.
    const firstField = { 1: '', 2: 'auth-name', 3: 'auth-email' }[step];
    if (firstField && typeof document !== 'undefined') {
      setTimeout(() => document.getElementById(firstField)?.focus());
    }
  }

  protected async submit(): Promise<void> {
    // Sign-up is split into steps: check this one and move on until the last.
    if (this.mode() === 'up' && this.upStep() < 3) {
      const step = this.upStep() as 1 | 2;
      const problem = this.stepError(step);
      this.error.set(problem);
      if (!problem) this.goToStep((step + 1) as 2 | 3);
      return;
    }

    const email = sanitizeEmail(this.email());
    const password = this.password();
    this.error.set('');
    this.resendMessage.set('');

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
        if (error) {
          if (/email not confirmed/i.test(error) || /not confirmed/i.test(error)) {
            this.error.set(
              'Your email is not confirmed yet. Please enter the confirmation code sent to your email.',
            );
            this.setMode('confirm');
            this.startResendCooldown(30);
            return;
          }
          return this.error.set(error);
        }
      } else {
        // Name and farm are on step 2: if something is wrong there, go back to it.
        const detailsProblem = this.stepError(2);
        if (detailsProblem) {
          this.goToStep(2);
          return this.error.set(detailsProblem);
        }
        const fullName = sanitizeText(this.name(), 120);
        const farm = sanitizeText(this.farmName(), 120);
        const location = sanitizeText(this.farmLocation(), 160);

        const result = await this.auth.signUp({
          email,
          password,
          fullName,
          role: this.role(),
          farmName: farm,
          farmLocation: location,
        });
        if (result.error) return this.error.set(result.error);
        if (result.demoCode) {
          this.demoCodeHint.set(result.demoCode);
        }
        if (result.confirmEmail || this.role() === 'customer') {
          this.setMode('confirm');
          this.startResendCooldown(30);
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

  /** Verifies the email confirmation code entered by the customer. */
  protected async verifyCode(): Promise<void> {
    const email = sanitizeEmail(this.email());
    const code = this.confirmationCode().trim();
    this.error.set('');
    this.resendMessage.set('');

    if (!email) {
      return this.error.set('Email is missing. Please return to sign up.');
    }
    if (!code) {
      return this.error.set('Please enter the confirmation code from your email.');
    }

    this.busy.set(true);
    try {
      const res = await this.auth.verifySignUpCode(email, code);
      if (res.error) {
        return this.error.set(res.error);
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

  /** Requests a fresh confirmation code to be sent to the user's email. */
  protected async resendCode(): Promise<void> {
    const email = sanitizeEmail(this.email());
    if (!email) {
      return this.error.set('Please enter your email address.');
    }

    this.resendBusy.set(true);
    this.error.set('');
    try {
      const res = await this.auth.resendSignUpCode(email);
      if (res.error) {
        return this.error.set(res.error);
      }
      if (res.demoCode) {
        this.demoCodeHint.set(res.demoCode);
      }
      this.resendMessage.set('A new confirmation code has been sent to your email.');
      this.startResendCooldown(45);
    } finally {
      this.resendBusy.set(false);
    }
  }

  private startResendCooldown(seconds: number): void {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }
    this.resendCooldown.set(seconds);
    this.cooldownTimer = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.resendCooldown.set(0);
        if (this.cooldownTimer) {
          clearInterval(this.cooldownTimer);
          this.cooldownTimer = null;
        }
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
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
