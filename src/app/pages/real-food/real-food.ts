import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FOOD_CONCERNS,
  GROWN_WITHOUT,
  SEASONS,
  SPOT_TIPS,
  VERIFY_STEPS,
  seasonFor,
} from '../../core/content';
import { IMAGES } from '../../core/data';
import { Icon } from '../../shared/icon';
import { PhotoPipe } from '../../shared/pipes';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * "Real Food Guide": why market food in Nigeria is often not what it seems,
 * how to spot it, and how FarmDirect checks the farms it sells from.
 */
@Component({
  selector: 'app-real-food',
  imports: [RouterLink, Icon, PhotoPipe],
  template: `
    <section class="rf-hero">
      <img [src]="img.market | photo: 1600" alt="A trader selling fresh peppers, okra and palm oil at a Nigerian market" />
      <div class="rf-hero__shade"></div>
      <div class="container rf-hero__body">
        <nav aria-label="Breadcrumb"><a routerLink="/">Home</a> / Real Food Guide</nav>
        <h1>Is your food really what it looks like?</h1>
        <p>
          Bright yellow mangoes that are hard inside. Beans that smell of insecticide. Palm oil
          that's redder than it should be. Here is what's happening to food in Nigeria, how to spot
          it, and how to buy from farms you can trust.
        </p>
        <div class="rf-hero__cta">
          <a routerLink="/crops" class="btn btn--lime btn--pill">
            Shop verified produce <app-icon name="arrow-right" [size]="18" />
          </a>
          <a [routerLink]="[]" fragment="spot" class="btn btn--pill rf-hero__ghost">How to spot fake food</a>
        </div>
      </div>
    </section>

    <!-- The problem -->
    <section class="section">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">The problem</span>
          <h2>What happens to food between the farm and your kitchen</h2>
          <p>
            Most farmers grow good food. The trouble starts on the long road through middlemen,
            warehouses and markets, where food is treated to look fresher, last longer or weigh
            more.
          </p>
        </div>
        <div class="concerns">
          @for (c of concerns; track c.title) {
            <article class="concern">
              <img [src]="c.image | photo: 700" alt="" loading="lazy" />
              <div class="concern__body">
                <span class="concern__icon"><app-icon [name]="c.icon" [size]="20" /></span>
                <h3>{{ c.title }}</h3>
                <p>{{ c.text }}</p>
                <p class="concern__answer">
                  <app-icon name="check" [size]="16" />
                  <span><strong>What we do:</strong> {{ c.answer }}</span>
                </p>
              </div>
            </article>
          }
        </div>
      </div>
    </section>

    <!-- How to spot it -->
    <section class="section section--tint" id="spot">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">At the market</span>
          <h2>How to spot the real thing</h2>
          <p>Simple checks you can do anywhere, using only your eyes, nose and hands.</p>
        </div>
        <div class="spot">
          <div class="spot__head" aria-hidden="true">
            <span>Food</span><span>Real & natural</span><span>Be careful if…</span>
          </div>
          @for (tip of tips; track tip.food) {
            <div class="spot__row">
              <h3>{{ tip.food }}</h3>
              <p class="spot__real">
                <span class="spot__label"><app-icon name="check" [size]="14" /> Real</span>
                {{ tip.real }}
              </p>
              <p class="spot__warn">
                <span class="spot__label"><app-icon name="info" [size]="14" /> Be careful</span>
                {{ tip.warning }}
              </p>
            </div>
          }
        </div>
        <p class="spot__note">
          These checks help, but they are not lab tests. The surest way to know is to buy from a
          farm you can trace.
        </p>
      </div>
    </section>

    <!-- How we verify -->
    <section class="section">
      <div class="container verify">
        <div class="verify__intro">
          <span class="eyebrow">Our answer</span>
          <h2>Every farm is checked before it sells a single basket</h2>
          <p>
            We don't buy from markets or middlemen. Every listing comes from a named farm that has
            passed these checks, and you can see the farm and region on every product.
          </p>
          <img [src]="img.farmer | photo: 900" alt="A Nigerian farmer carrying freshly harvested plantain" loading="lazy" />
        </div>
        <ol class="verify__steps">
          @for (step of verify; track step.title; let i = $index) {
            <li>
              <span class="verify__num">{{ i + 1 }}</span>
              <div>
                <h3><app-icon [name]="step.icon" [size]="18" /> {{ step.title }}</h3>
                <p>{{ step.text }}</p>
              </div>
            </li>
          }
        </ol>
      </div>
    </section>

    <!-- Grown without -->
    <section class="without">
      <div class="container without__inner">
        <div>
          <span class="eyebrow eyebrow--light">The FarmDirect promise</span>
          <h2>Grown and raised without</h2>
        </div>
        <ul>
          @for (item of without; track item) {
            <li><app-icon name="close" [size]="16" /> {{ item }}</li>
          }
        </ul>
      </div>
    </section>

    <!-- Seasons -->
    <section class="section section--tint" id="seasons">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Eat with the seasons</span>
          <h2>What's fresh in Nigeria, month by month</h2>
          <p>
            Food in season is cheaper and tastes better, and it doesn't need chemicals to bring it
            to market early. Seasons shift a little by region and year.
          </p>
        </div>
        <div class="seasons">
          @for (s of seasons; track s.name) {
            <article class="season" [class.is-now]="s === now">
              <img [src]="s.image | photo: 600" alt="" loading="lazy" />
              <div class="season__body">
                <p class="season__months">
                  {{ monthsLabel(s.months) }}
                  @if (s === now) {
                    <span class="season__now">In season now</span>
                  }
                </p>
                <h3>{{ s.name }}</h3>
                <p>{{ s.note }}</p>
                <ul>
                  @for (food of s.foods; track food) {
                    <li class="chip">{{ food }}</li>
                  }
                </ul>
              </div>
            </article>
          }
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section">
      <div class="container cta">
        <img [src]="img.vegmarket | photo: 900" alt="" loading="lazy" />
        <div>
          <h2>Ready to eat real food?</h2>
          <p>
            Order by Thursday and get produce harvested for you, delivered on Sunday from a farm you
            can name.
          </p>
          <div class="cta__buttons">
            <a routerLink="/crops" class="btn btn--primary btn--pill">Shop crops</a>
            <a routerLink="/livestock" class="btn btn--soft btn--pill">Buy livestock</a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    h2 {
      font-size: clamp(1.6rem, 3.4vw, 2.3rem);
    }

    /* Hero */
    .rf-hero {
      position: relative;
      min-height: 520px;
      display: flex;
      align-items: flex-end;
      color: var(--white);
      overflow: hidden;
    }

    .rf-hero > img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .rf-hero__shade {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(18, 40, 26, 0.35) 0%, rgba(18, 40, 26, 0.92) 75%);
    }

    .rf-hero__body {
      position: relative;
      padding-top: 120px;
      padding-bottom: 64px;
    }

    .rf-hero nav {
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 0.95rem;
      opacity: 0.85;
    }

    .rf-hero h1 {
      max-width: 16ch;
      margin: 12px 0 16px;
      font-size: clamp(2.1rem, 6vw, 3.6rem);
      line-height: 1.05;
    }

    .rf-hero p {
      max-width: 58ch;
      font-size: 1.05rem;
      color: rgba(255, 255, 255, 0.88);
    }

    .rf-hero__cta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 28px;
    }

    .rf-hero__ghost {
      border: 1.5px solid rgba(255, 255, 255, 0.6);
      color: var(--white);
    }

    .rf-hero__ghost:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    /* Concerns */
    .concerns {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 22px;
    }

    .concern {
      display: flex;
      flex-direction: column;
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      overflow: hidden;
    }

    .concern img {
      width: 100%;
      aspect-ratio: 16 / 10;
      object-fit: cover;
    }

    .concern__body {
      position: relative;
      display: flex;
      flex-direction: column;
      flex: 1;
      padding: 26px 22px 22px;
    }

    .concern__icon {
      position: absolute;
      top: -20px;
      left: 22px;
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--green-900);
      color: var(--lime);
    }

    .concern h3 {
      font-size: 1.08rem;
      margin-bottom: 8px;
    }

    .concern p {
      color: #3c453e;
      font-size: 0.92rem;
    }

    .concern__answer {
      display: flex;
      gap: 8px;
      margin-top: auto;
      padding-top: 14px;
      border-top: 1px dashed var(--line);
      margin-block-start: 16px;
      color: var(--green-800) !important;
    }

    .concern__answer app-icon {
      margin-top: 3px;
      color: #4d7c0f;
    }

    /* Spot table */
    .spot {
      background: var(--white);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    .spot__head,
    .spot__row {
      display: grid;
      grid-template-columns: 0.8fr 1.2fr 1.2fr;
      gap: 24px;
      padding: 18px 24px;
    }

    .spot__head {
      background: var(--green-900);
      color: var(--lime);
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .spot__row + .spot__row {
      border-top: 1px solid var(--line);
    }

    .spot__row h3 {
      font-size: 1rem;
    }

    .spot__row p {
      font-size: 0.92rem;
      color: #3c453e;
    }

    .spot__label {
      display: none;
      align-items: center;
      gap: 5px;
      margin-bottom: 4px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .spot__real .spot__label {
      color: #3f6212;
    }

    .spot__warn .spot__label {
      color: var(--danger);
    }

    .spot__note {
      margin-top: 18px;
      text-align: center;
      font-size: 0.88rem;
      color: var(--muted);
    }

    /* Verify */
    .verify {
      display: grid;
      grid-template-columns: 1fr 1.1fr;
      gap: 56px;
      align-items: start;
    }

    .verify__intro h2 {
      margin: 14px 0 16px;
    }

    .verify__intro p {
      color: #3c453e;
      margin-bottom: 24px;
    }

    .verify__intro img {
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      border-radius: var(--radius-lg);
    }

    .verify__steps {
      display: grid;
      gap: 14px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .verify__steps li {
      display: flex;
      gap: 18px;
      padding: 20px 22px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--white);
    }

    .verify__num {
      display: grid;
      place-items: center;
      flex: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--lime);
      font-family: var(--font-display);
      font-weight: 800;
    }

    .verify__steps h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.02rem;
      margin-bottom: 4px;
    }

    .verify__steps p {
      color: #3c453e;
      font-size: 0.92rem;
    }

    /* Grown without */
    .without {
      background: var(--green-900);
      color: var(--white);
      padding: 56px 0;
    }

    .without__inner {
      display: grid;
      grid-template-columns: 1fr 1.6fr;
      gap: 40px;
      align-items: center;
    }

    .eyebrow--light {
      border-color: var(--lime);
      color: var(--lime);
    }

    .without h2 {
      margin-top: 14px;
    }

    .without ul {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px 24px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .without li {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      font-weight: 500;
    }

    .without li app-icon {
      display: grid;
      place-items: center;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.2);
      color: #fca5a5;
    }

    /* Seasons */
    .seasons {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 20px;
    }

    .season {
      background: var(--white);
      border-radius: var(--radius);
      overflow: hidden;
      border: 2px solid transparent;
    }

    .season.is-now {
      border-color: var(--green-900);
      box-shadow: var(--shadow);
    }

    .season img {
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
    }

    .season__body {
      padding: 18px;
    }

    .season__months {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .season__now {
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--lime);
      color: var(--ink);
      text-transform: none;
      letter-spacing: 0;
    }

    .season h3 {
      margin: 6px 0 8px;
      font-size: 1.05rem;
    }

    .season p {
      font-size: 0.88rem;
      color: #3c453e;
    }

    .season ul {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 14px 0 0;
      padding: 0;
      list-style: none;
    }

    /* CTA */
    .cta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
      align-items: center;
    }

    .cta img {
      width: 100%;
      aspect-ratio: 16 / 10;
      object-fit: cover;
      border-radius: var(--radius-lg);
    }

    .cta p {
      margin: 12px 0 24px;
      color: #3c453e;
    }

    .cta__buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    @media (max-width: 1000px) {
      .concerns {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .seasons {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 820px) {
      .verify,
      .without__inner,
      .cta {
        grid-template-columns: 1fr;
        gap: 32px;
      }

      .spot__head {
        display: none;
      }

      .spot__row {
        grid-template-columns: 1fr;
        gap: 10px;
      }

      .spot__label {
        display: flex;
      }
    }

    @media (max-width: 560px) {
      .rf-hero {
        min-height: 460px;
      }

      .concerns,
      .seasons,
      .without ul {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class RealFood {
  protected readonly img = IMAGES;
  protected readonly concerns = FOOD_CONCERNS;
  protected readonly tips = SPOT_TIPS;
  protected readonly verify = VERIFY_STEPS;
  protected readonly without = GROWN_WITHOUT;
  protected readonly seasons = SEASONS;
  protected readonly now = seasonFor();

  protected monthsLabel(months: number[]): string {
    return `${MONTHS[months[0] - 1]} – ${MONTHS[months[months.length - 1] - 1]}`;
  }
}
