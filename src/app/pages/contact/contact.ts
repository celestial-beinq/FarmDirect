import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { sanitizeEmail, sanitizeText } from '../../core/sanitizer';
import { Icon } from '../../shared/icon';

/** Where contact-form messages are addressed. Keep in sync with the footer. */
const CONTACT_EMAIL = 'hello@farmdirect.example';


@Component({
  selector: 'app-contact',
  imports: [RouterLink, Icon],
  template: `
    <section class="page-hero">
      <h1>Contact Us</h1>
      <nav aria-label="Breadcrumb"><a routerLink="/">Home</a> / Contact</nav>
    </section>

    <section class="section">
      <div class="container contact">
        <!-- Info column -->
        <aside class="info">
          <span class="eyebrow">We’re here to help</span>
          <h2>Talk to the FarmDirect team</h2>
          <p class="info__lede">
            Questions about an order, joining as a farmer or a livestock pool? Send us a message and
            a real person will get back to you.
          </p>
          <p class="info__lede">
            <strong>Something not right with your food?</strong> If anything you bought from us
            looks, smells or tastes wrong, let us know below. We trace it to
            the farm and follow it up. See our
            <a routerLink="/real-food" class="info__link">Real Food Guide</a> for what to look out
            for.
          </p>

          <ul class="info__cards">
            <li>
              <span class="info__icon"><app-icon name="mail" [size]="20" /></span>
              <div>
                <strong>Email us</strong>
                <a [href]="'mailto:' + email">{{ email }}</a>
              </div>
            </li>
            <li>
              <span class="info__icon"><app-icon name="pin" [size]="20" /></span>
              <div>
                <strong>Visit</strong>
                <span>Lagos, Nigeria</span>
              </div>
            </li>
            <li>
              <span class="info__icon"><app-icon name="clock" [size]="20" /></span>
              <div>
                <strong>Support hours</strong>
                <span>Mon to Sat, 8am to 6pm WAT</span>
              </div>
            </li>
          </ul>

          <div class="info__farmer">
            <app-icon name="leaf" [size]="22" />
            <div>
              <strong>Are you a farmer?</strong>
              <p>Create a free farmer account and start listing your harvest.</p>
              <a routerLink="/signup">Join as a farmer →</a>
            </div>
          </div>
        </aside>

        <!-- Form -->
        <div class="card-form">
          @if (sent()) {
            <div class="sent" role="status">
              <span class="sent__icon"><app-icon name="check" [size]="28" /></span>
              <h3>Your message is ready to send</h3>
              <p>
                We’ve opened your email app with your message filled in, just press send. If
                nothing opened, email us directly at
                <a [href]="'mailto:' + email">{{ email }}</a>.
              </p>
              <button type="button" class="btn-outline" (click)="reset()">
                Write another message
              </button>
            </div>
          } @else {
            <h3>Send us a message</h3>
            <p class="card-form__sub">We usually reply within one working day.</p>

            <form novalidate (submit)="$event.preventDefault(); submit()">
              <div class="row">
                <div class="field">
                  <label for="c-name">Your name</label>
                  <input
                    #n
                    id="c-name"
                    name="name"
                    autocomplete="name"
                    maxlength="120"
                    placeholder="Full name"
                    [value]="name()"
                    (input)="name.set(n.value)"
                  />
                </div>
                <div class="field">
                  <label for="c-email">Email address</label>
                  <input maxlength="254"
                    #e
                    id="c-email"
                    type="email"
                    name="email"
                    autocomplete="email"
                    placeholder="you@example.com"
                    [value]="from()"
                    (input)="from.set(e.value)"
                  />
                </div>
              </div>

              <div class="field">
                <label for="c-order">Order reference <span>(optional)</span></label>
                <input
                  #o
                  id="c-order"
                  name="order"
                  maxlength="60"
                  placeholder="e.g. FD-10234"
                  [value]="orderRef()"
                  (input)="orderRef.set(o.value)"
                />
              </div>

              <div class="field">
                <label for="c-message">Message</label>
                <textarea
                  #m
                  id="c-message"
                  name="message"
                  rows="6"
                  maxlength="2000"
                  placeholder="How can we help?"
                  [value]="message()"
                  (input)="message.set(m.value)"
                ></textarea>
                <small class="count">{{ message().length }} / 2000</small>
              </div>

              @if (error()) {
                <p class="error" role="alert">
                  <app-icon name="info" [size]="18" /> {{ error() }}
                </p>
              }

              <button type="submit" class="submit">
                Send message <app-icon name="arrow-right" [size]="18" />
              </button>
            </form>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      --accent: #059669;
    }

    .contact {
      display: grid;
      grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
      gap: 56px;
      align-items: start;
    }

    /* Info column */
    .info h2 {
      margin: 16px 0 14px;
      font-size: clamp(1.7rem, 3.2vw, 2.3rem);
    }

    .info__lede {
      color: #3c453e;
      max-width: 44ch;
    }

    .info__cards {
      display: grid;
      gap: 12px;
      margin: 28px 0;
    }

    .info__cards li {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 18px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      transition:
        border-color 0.15s,
        transform 0.15s;
    }

    .info__cards li:hover {
      border-color: #c9cfc2;
      transform: translateX(2px);
    }

    .info__icon {
      display: grid;
      place-items: center;
      flex: none;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: var(--lime-soft);
      color: var(--green-900);
    }

    .info__cards strong {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--muted);
    }

    .info__cards a,
    .info__cards span:not(.info__icon) {
      font-weight: 600;
      overflow-wrap: anywhere;
    }

    .info__cards a:hover {
      text-decoration: underline;
    }

    .info__farmer {
      display: flex;
      gap: 14px;
      padding: 20px;
      border-radius: var(--radius);
      background: var(--green-900);
      color: var(--white);
    }

    .info__farmer app-icon {
      color: var(--lime);
      margin-top: 2px;
    }

    .info__farmer p {
      margin: 4px 0 10px;
      font-size: 0.9rem;
      opacity: 0.85;
    }

    .info__farmer a {
      font-weight: 700;
      color: var(--lime);
    }

    .info__farmer a:hover {
      text-decoration: underline;
    }

    /* Form card */
    .card-form {
      padding: clamp(24px, 4vw, 40px);
      border-radius: var(--radius-lg);
      background: var(--white);
      border: 1px solid var(--line);
      box-shadow: 0 20px 50px -24px rgba(18, 40, 26, 0.22);
    }

    .card-form h3 {
      font-size: 1.4rem;
    }

    .card-form__sub {
      margin: 6px 0 22px;
      color: var(--muted);
      font-size: 0.92rem;
    }

    form {
      display: grid;
      gap: 16px;
    }

    .info__link {
      color: var(--green-800);
      font-weight: 600;
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .field {
      position: relative;
    }

    .field label {
      display: block;
      margin-bottom: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #2f3a33;
    }

    .field label span {
      font-weight: 400;
      color: var(--muted);
    }

    .field input,
    .field textarea {
      width: 100%;
      padding: 13px 14px;
      border: 1.5px solid var(--line);
      border-radius: 12px;
      background: #f8faf6;
      font: inherit;
      font-size: 0.95rem;
      color: var(--ink);
      transition:
        border-color 0.15s,
        box-shadow 0.15s,
        background 0.15s;
    }

    .field textarea {
      resize: vertical;
      min-height: 140px;
    }

    .field input::placeholder,
    .field textarea::placeholder {
      color: #a3aba5;
    }

    .field input:hover,
    .field textarea:hover {
      border-color: #c9cfc2;
    }

    .field input:focus,
    .field textarea:focus {
      outline: none !important;
      border-color: var(--accent);
      background: var(--white);
      box-shadow: none !important;
    }

    .count {
      display: block;
      margin-top: 4px;
      text-align: right;
      font-size: 0.74rem;
      color: var(--muted);
    }

    .error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 14px;
      border-radius: 10px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
      font-size: 0.86rem;
    }

    .submit {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 52px;
      border-radius: 12px;
      background: var(--green-900);
      color: var(--white);
      font-weight: 700;
      transition:
        background 0.15s,
        box-shadow 0.15s;
    }

    .submit app-icon {
      transition: transform 0.15s;
    }

    .submit:hover {
      background: var(--green-800);
      box-shadow: 0 10px 24px -10px rgba(18, 40, 26, 0.6);
    }

    .submit:hover app-icon {
      transform: translateX(3px);
    }

    /* Sent state */
    .sent {
      padding: 24px 0;
      text-align: center;
    }

    .sent__icon {
      display: inline-grid;
      place-items: center;
      width: 64px;
      height: 64px;
      margin-bottom: 18px;
      border-radius: 50%;
      background: #ecfdf5;
      color: var(--accent);
    }

    .sent p {
      max-width: 40ch;
      margin: 10px auto 24px;
      color: var(--muted);
    }

    .sent a {
      font-weight: 600;
      color: var(--ink);
      text-decoration: underline;
    }

    .btn-outline {
      padding: 12px 20px;
      border: 1.5px solid var(--line);
      border-radius: 12px;
      font-weight: 600;
    }

    .btn-outline:hover {
      border-color: var(--green-900);
    }

    @media (max-width: 900px) {
      .contact {
        grid-template-columns: 1fr;
        gap: 40px;
      }
    }

    @media (max-width: 520px) {
      .row {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class Contact {
  protected readonly email = CONTACT_EMAIL;

  protected readonly name = signal('');
  protected readonly from = signal('');
  protected readonly orderRef = signal('');
  protected readonly message = signal('');
  protected readonly error = signal('');
  protected readonly sent = signal(false);

  protected submit(): void {
    this.error.set('');
    const name = sanitizeText(this.name(), 120);
    const from = sanitizeEmail(this.from());
    const orderRef = sanitizeText(this.orderRef(), 60);
    const message = sanitizeText(this.message(), 2000);

    if (!name) return this.error.set('Please enter your name.');
    if (!from || !/^\S+@\S+\.\S+$/.test(from)) {
      return this.error.set('Please enter a valid email address.');
    }
    if (message.length < 10) {
      return this.error.set('Please tell us a little more (at least 10 characters).');
    }

    const subject = `[FarmDirect] Message from ${name}${orderRef ? ` (${orderRef})` : ''}`;
    const body = [message, '', `Name: ${name}`, `Email: ${from}`]
      .concat(orderRef ? [`Order: ${orderRef}`] : [])
      .join('\n');

    window.location.href =
      `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;
    this.sent.set(true);
  }

  protected reset(): void {
    this.message.set('');
    this.orderRef.set('');
    this.sent.set(false);
  }
}
