import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IMAGES } from '../../core/data';
import { Icon, IconName } from '../../shared/icon';
import { PhotoPipe } from '../../shared/pipes';

interface Step {
  icon: IconName;
  title: string;
  text: string;
}

@Component({
  selector: 'app-how-it-works',
  imports: [RouterLink, Icon, PhotoPipe],
  template: `
    <section class="page-hero">
      <h1>How It Works</h1>
      <nav aria-label="Breadcrumb"><a routerLink="/">Home</a> / How It Works</nav>
    </section>

    <!-- Intro -->
    <section class="section">
      <div class="container intro">
        <div>
          <span class="eyebrow">Farm to door, every week</span>
          <h2>No middlemen. No warehouses. Just a weekly harvest made for you.</h2>
          <p>
            FarmDirect runs on a simple weekly rhythm. You order during the week, verified farmers
            harvest exactly what was ordered, and it arrives at your door on Sunday, usually less
            than three days after it left the soil.
          </p>
        </div>
        <ol class="cycle" aria-label="The weekly cycle">
          @for (day of cycle; track day.day) {
            <li>
              <span class="cycle__day">{{ day.day }}</span>
              <div>
                <strong>{{ day.title }}</strong>
                <small>{{ day.text }}</small>
              </div>
            </li>
          }
        </ol>
      </div>
    </section>

    <!-- Buyer / farmer tracks -->
    <section class="section section--tint">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Step by step</span>
          <h2>Pick your side of the market</h2>
        </div>

        <div class="switcher" role="tablist" aria-label="Audience">
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="track() === 'buyer'"
            [class.is-active]="track() === 'buyer'"
            (click)="track.set('buyer')"
          >
            <app-icon name="basket" [size]="18" /> For buyers
          </button>
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="track() === 'farmer'"
            [class.is-active]="track() === 'farmer'"
            (click)="track.set('farmer')"
          >
            <app-icon name="leaf" [size]="18" /> For farmers
          </button>
        </div>

        <ol class="steps">
          @for (step of track() === 'buyer' ? buyerSteps : farmerSteps; track step.title) {
            <li>
              <span class="steps__num">{{ $index + 1 }}</span>
              <span class="steps__icon"><app-icon [name]="step.icon" [size]="22" /></span>
              <h3>{{ step.title }}</h3>
              <p>{{ step.text }}</p>
            </li>
          }
        </ol>

        <div class="center">
          @if (track() === 'buyer') {
            <a routerLink="/crops" class="btn btn--primary btn--pill">
              Start shopping <app-icon name="arrow-right" [size]="18" />
            </a>
          } @else {
            <a routerLink="/signup" class="btn btn--primary btn--pill">
              Join as a farmer <app-icon name="arrow-right" [size]="18" />
            </a>
          }
        </div>
      </div>
    </section>

    <!-- Livestock pools -->
    <section class="section">
      <div class="container pools">
        <img [src]="img.cow | photo: 1000" alt="A healthy cow grazing on a farm" loading="lazy" />
        <div>
          <span class="eyebrow">Shared livestock</span>
          <h2>Too much cow for one family? Share it.</h2>
          <p>
            Livestock pools let several households buy one healthy animal together. Each family
            pays only for its share, and the meat is portioned and packed per share.
          </p>
          <ul>
            <li>
              <app-icon name="users" [size]="20" />
              <span><strong>Join or start a pool</strong> on any cow, goat or ram listing.</span>
            </li>
            <li>
              <app-icon name="chart" [size]="20" />
              <span><strong>Watch it fill</strong>: the progress bar shows how much is raised.</span>
            </li>
            <li>
              <app-icon name="box" [size]="20" />
              <span><strong>Get your portion</strong> delivered once the pool is fully funded.</span>
            </li>
          </ul>
          <a routerLink="/livestock" class="btn btn--primary btn--pill">
            Browse livestock <app-icon name="arrow-right" [size]="18" />
          </a>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="section section--tint">
      <div class="container faq">
        <div class="section-head">
          <span class="eyebrow">Questions</span>
          <h2>Frequently asked questions</h2>
        </div>
        <div class="faq__list">
          @for (item of faqs; track item.q) {
            <details>
              <summary>
                {{ item.q }}
                <app-icon name="plus" [size]="18" />
              </summary>
              <p>{{ item.a }}</p>
            </details>
          }
        </div>
        <p class="faq__more">
          Still have a question? <a routerLink="/contact">Get in touch with us</a>
        </p>
      </div>
    </section>
  `,
  styles: `
    h2 {
      font-size: clamp(1.6rem, 3.2vw, 2.3rem);
    }

    .center {
      display: flex;
      justify-content: center;
      margin-top: 36px;
    }

    /* Intro + cycle */
    .intro {
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: 56px;
      align-items: center;
    }

    .intro h2 {
      margin: 16px 0 18px;
    }

    .intro p {
      color: #3c453e;
    }

    .cycle {
      position: relative;
      display: grid;
      gap: 14px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .cycle::before {
      content: '';
      position: absolute;
      top: 28px;
      bottom: 28px;
      left: 27px;
      width: 2px;
      background: var(--line);
    }

    .cycle li {
      position: relative;
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 14px 18px 14px 0;
    }

    .cycle__day {
      display: grid;
      place-items: center;
      flex: none;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--green-900);
      color: var(--lime);
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 0.85rem;
      box-shadow: 0 0 0 6px var(--white);
    }

    .cycle strong {
      display: block;
      font-size: 1rem;
    }

    .cycle small {
      display: block;
      color: var(--muted);
      font-size: 0.88rem;
    }

    /* Switcher */
    .switcher {
      display: flex;
      justify-content: center;
      gap: 6px;
      width: fit-content;
      margin: -12px auto 36px;
      padding: 5px;
      border-radius: 999px;
      background: var(--white);
      box-shadow: var(--shadow);
    }

    .switcher button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--muted);
      transition:
        background 0.2s,
        color 0.2s;
    }

    .switcher button.is-active {
      background: var(--green-900);
      color: var(--white);
    }

    /* Steps */
    .steps {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .steps li {
      position: relative;
      padding: 28px 22px 24px;
      border-radius: var(--radius);
      background: var(--white);
      box-shadow: var(--shadow);
    }

    .steps__num {
      position: absolute;
      top: 18px;
      right: 20px;
      font-family: var(--font-display);
      font-size: 2.2rem;
      font-weight: 800;
      line-height: 1;
      color: var(--sand);
    }

    .steps__icon {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      margin-bottom: 18px;
      border-radius: 14px;
      background: var(--lime-soft);
      color: var(--green-900);
    }

    .steps h3 {
      font-size: 1.05rem;
      margin-bottom: 8px;
    }

    .steps p {
      font-size: 0.9rem;
      color: var(--muted);
    }

    /* Pools */
    .pools {
      display: grid;
      grid-template-columns: 1fr 1.1fr;
      gap: 56px;
      align-items: center;
    }

    .pools img {
      width: 100%;
      aspect-ratio: 4 / 3.4;
      object-fit: cover;
      border-radius: var(--radius-lg);
    }

    .pools h2 {
      margin: 16px 0 16px;
    }

    .pools p {
      color: #3c453e;
    }

    .pools ul {
      display: grid;
      gap: 14px;
      margin: 24px 0 30px;
    }

    .pools li {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      font-size: 0.95rem;
    }

    .pools li app-icon {
      margin-top: 2px;
      color: #059669;
    }

    /* FAQ */
    .faq {
      max-width: 820px;
    }

    .faq__list {
      display: grid;
      gap: 10px;
    }

    details {
      border-radius: var(--radius);
      background: var(--white);
      border: 1px solid var(--line);
      transition: box-shadow 0.2s;
    }

    details[open] {
      box-shadow: var(--shadow);
    }

    summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 18px 22px;
      font-weight: 600;
      cursor: pointer;
      list-style: none;
    }

    summary::-webkit-details-marker {
      display: none;
    }

    summary app-icon {
      transition: transform 0.2s;
      color: var(--muted);
    }

    details[open] summary app-icon {
      transform: rotate(45deg);
    }

    details p {
      padding: 0 22px 20px;
      color: var(--muted);
      font-size: 0.93rem;
    }

    .faq__more {
      margin-top: 28px;
      text-align: center;
      color: var(--muted);
    }

    .faq__more a {
      font-weight: 700;
      color: var(--green-900);
      text-decoration: underline;
    }

    @media (max-width: 960px) {
      .steps {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 820px) {
      .intro,
      .pools {
        grid-template-columns: 1fr;
        gap: 36px;
      }
    }

    @media (max-width: 520px) {
      .steps {
        grid-template-columns: 1fr;
      }

      .switcher button {
        padding: 9px 14px;
        font-size: 0.84rem;
      }
    }
  `,
})
export class HowItWorks {
  protected readonly img = IMAGES;
  protected readonly track = signal<'buyer' | 'farmer'>('buyer');

  protected readonly cycle = [
    { day: 'MON', title: 'Orders open', text: 'Browse the week’s harvest and fill your basket.' },
    { day: 'THU', title: 'Midnight cut-off', text: 'Orders close so farmers know what to pick.' },
    { day: 'FRI', title: 'Harvest & pack', text: 'Farmers harvest only what was ordered.' },
    { day: 'SUN', title: 'Delivered fresh', text: 'Your order arrives at your door.' },
  ];

  protected readonly buyerSteps: Step[] = [
    {
      icon: 'search',
      title: 'Browse the harvest',
      text: 'Explore crops and livestock from verified farms. Every item shows the farm region it comes from.',
    },
    {
      icon: 'basket',
      title: 'Order by Thursday',
      text: 'Add items to your basket and check out securely before the Thursday midnight cut-off.',
    },
    {
      icon: 'leaf',
      title: 'We harvest for you',
      text: 'Over the weekend, farmers harvest and pack exactly what you ordered, nothing sits in storage.',
    },
    {
      icon: 'truck',
      title: 'Sunday delivery',
      text: 'Your produce arrives at your door on Sunday. Track every step from your account.',
    },
  ];

  protected readonly farmerSteps: Step[] = [
    {
      icon: 'user',
      title: 'Create a farmer account',
      text: 'Sign up as a farmer with your farm name and location. It is free to join.',
    },
    {
      icon: 'shield',
      title: 'Get verified',
      text: 'Complete a quick KYC check. We only list farms we have verified, which builds trust with buyers.',
    },
    {
      icon: 'tag',
      title: 'List your produce',
      text: 'Add crops or livestock with prices and available quantities from your dashboard.',
    },
    {
      icon: 'chart',
      title: 'Harvest and get paid',
      text: 'Receive orders each Thursday, harvest to order, and get paid fairly for every sale.',
    },
  ];

  protected readonly faqs = [
    {
      q: 'When is the order cut-off?',
      a: 'Orders close every Thursday at midnight. Anything ordered after that joins the following week’s batch for the next Sunday delivery.',
    },
    {
      q: 'Where do you deliver?',
      a: 'We currently deliver across Lagos and are expanding to more cities. Enter your address at checkout to confirm delivery to your area.',
    },
    {
      q: 'How do I know the produce is genuine?',
      a: 'Every farmer goes through verification before listing, and every item shows its farm region. Produce is harvested only after you order, so it is never forced-ripened or stored for weeks.',
    },
    {
      q: 'How do livestock pools work?',
      a: 'Several families each pay for a share of one animal. When the pool is fully funded, the animal is processed, portioned per share and delivered. If a pool does not fill, contributions are returned.',
    },
    {
      q: 'How do I pay?',
      a: 'Payments are handled securely online at checkout. You will get a confirmation as soon as your payment is received.',
    },
    {
      q: 'I am a farmer. How much does it cost to sell?',
      a: 'Creating a farmer account and listing produce is free. Contact our team for details on fees per completed order.',
    },
  ];
}
