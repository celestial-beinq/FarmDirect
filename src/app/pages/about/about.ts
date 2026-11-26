import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GROWN_WITHOUT, REGIONS, VERIFY_STEPS } from '../../core/content';
import { IMAGES } from '../../core/data';
import { Icon, IconName } from '../../shared/icon';
import { PhotoPipe } from '../../shared/pipes';

@Component({
  selector: 'app-about',
  imports: [RouterLink, PhotoPipe, Icon],
  template: `
    <section class="page-hero">
      <h1>About Us</h1>
      <nav aria-label="Breadcrumb"><a routerLink="/">Home</a> / About Us</nav>
    </section>

    <!-- Mission -->
    <section class="section">
      <div class="container about">
        <div class="about__photos">
          <img [src]="img.market | photo: 900" alt="A basket of fresh ata rodo peppers at a Nigerian market" />
          <img [src]="img.farmer | photo: 600" alt="Farm workers harvesting a green field, one carrying a crate of produce" loading="lazy" />
        </div>
        <div>
          <span class="eyebrow">Our mission</span>
          <h2>Real food, straight from the people who grow it</h2>
          <p>
            Too much of what reaches Nigerian kitchens has been tampered with on the way. Fruit is
            forced ripe with carbide, beans are sprayed with insecticide in storage, palm oil is
            coloured with dye, and grain is mixed with fillers. By the time it reaches you, food has
            changed hands so many times that nobody can say where it came from.
          </p>
          <p>
            FarmDirect removes the hands in between. Households order directly from verified
            farmers, the farmer harvests for that order, and it is delivered to your door. You see
            the farm and region on every item, and the farmer is paid fairly for it.
          </p>
          <ul class="about__points">
            <li><strong>Verified farms.</strong> We only list farmers we have checked in person.</li>
            <li><strong>Harvested to order.</strong> Nothing sits in a warehouse for weeks.</li>
            <li>
              <strong>Shared livestock.</strong> Families pool together to buy healthy,
              vet-checked animals.
            </li>
          </ul>
          <a routerLink="/crops" class="btn btn--primary btn--pill">Visit the Marketplace</a>
        </div>
      </div>
    </section>

    <!-- Values -->
    <section class="section section--tint">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">What we stand for</span>
          <h2>Four things we will not compromise on</h2>
        </div>
        <ul class="values">
          @for (v of values; track v.title) {
            <li>
              <span class="values__icon"><app-icon [name]="v.icon" [size]="24" /></span>
              <h3>{{ v.title }}</h3>
              <p>{{ v.text }}</p>
            </li>
          }
        </ul>
      </div>
    </section>

    <!-- Standards -->
    <section class="section">
      <div class="container standards">
        <div>
          <span class="eyebrow">Our standards</span>
          <h2>How a farm earns a place on FarmDirect</h2>
          <ol>
            @for (step of verify; track step.title) {
              <li>
                <app-icon [name]="step.icon" [size]="20" />
                <span><strong>{{ step.title }}.</strong> {{ step.text }}</span>
              </li>
            }
          </ol>
        </div>
        <aside class="standards__card">
          <img [src]="img.harvestbasket | photo: 800" alt="" loading="lazy" />
          <div>
            <h3>Grown and raised without</h3>
            <ul>
              @for (item of without; track item) {
                <li><app-icon name="close" [size]="14" /> {{ item }}</li>
              }
            </ul>
            <a routerLink="/real-food" class="standards__link">
              Read the Real Food Guide <app-icon name="arrow-right" [size]="16" />
            </a>
          </div>
        </aside>
      </div>
    </section>

    <!-- Regions -->
    <section class="section section--tint">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Our farms</span>
          <h2>From the North to the Niger Delta</h2>
          <p>
            We work with farms and pastoralists across Nigeria, each selling what their land grows
            best.
          </p>
        </div>
        <div class="regions">
          @for (r of regions; track r.name) {
            <article>
              <img [src]="r.image | photo: 600" alt="" loading="lazy" />
              <div>
                <h3>{{ r.name }}</h3>
                <p class="regions__states">{{ r.states }}</p>
                <p>{{ r.grows }}</p>
              </div>
            </article>
          }
        </div>
      </div>
    </section>

    <!-- Farmers -->
    <section class="section">
      <div class="container farmers">
        <img [src]="img.farmfield | photo: 1000" alt="Farmland in Adamawa State, Nigeria" loading="lazy" />
        <div>
          <span class="eyebrow">For farmers</span>
          <h2>Grow honestly, and get paid fairly for it</h2>
          <p>
            Farmers who do things the right way are undercut by those who don't. On FarmDirect,
            buyers can see your farm, your region and your reviews, and they pay for food they can
            trust. You set your price, harvest only what has been ordered, and keep more of what you
            earn.
          </p>
          <ul class="about__points">
            <li><strong>Free to join</strong> and free to list your produce.</li>
            <li><strong>Orders before harvest</strong>, so nothing is wasted.</li>
            <li><strong>Direct payment</strong> for every completed order.</li>
          </ul>
          <a routerLink="/signup" class="btn btn--primary btn--pill">
            Join as a farmer <app-icon name="arrow-right" [size]="18" />
          </a>
        </div>
      </div>
    </section>
  `,
  styles: `
    h2 {
      font-size: clamp(1.7rem, 3.4vw, 2.4rem);
    }

    .about,
    .farmers {
      display: grid;
      grid-template-columns: 1fr 1.1fr;
      gap: 56px;
      align-items: center;
    }

    .about h2,
    .farmers h2,
    .standards h2 {
      margin: 16px 0 20px;
    }

    .about p,
    .farmers p {
      margin-bottom: 16px;
      color: #3c453e;
    }

    .about__photos {
      position: relative;
      padding: 0 40px 40px 0;
    }

    .about__photos img {
      width: 100%;
      aspect-ratio: 4 / 5;
      object-fit: cover;
      border-radius: var(--radius-lg);
    }

    .about__photos img + img {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 48%;
      aspect-ratio: 1;
      border: 6px solid var(--white);
      box-shadow: var(--shadow);
    }

    .farmers img {
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      border-radius: var(--radius-lg);
    }

    .about__points {
      margin: 24px 0 28px;
      padding: 0;
      list-style: none;
    }

    .about__points li {
      padding: 10px 0;
      border-top: 1px solid var(--line);
      font-size: 0.95rem;
    }

    /* Values */
    .values {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 20px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .values li {
      padding: 26px 22px;
      border-radius: var(--radius);
      background: var(--white);
    }

    .values__icon {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      border-radius: 12px;
      background: var(--lime);
    }

    .values h3 {
      font-size: 1.05rem;
      margin-bottom: 6px;
    }

    .values p {
      font-size: 0.92rem;
      color: #3c453e;
    }

    /* Standards */
    .standards {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 56px;
      align-items: start;
    }

    .standards ol {
      display: grid;
      gap: 4px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .standards ol li {
      display: flex;
      gap: 14px;
      padding: 14px 0;
      border-bottom: 1px solid var(--line);
      color: #3c453e;
      font-size: 0.95rem;
    }

    .standards ol app-icon {
      margin-top: 2px;
      color: var(--green-600);
    }

    .standards ol strong {
      color: var(--ink);
    }

    .standards__card {
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: var(--green-900);
      color: var(--white);
    }

    .standards__card img {
      width: 100%;
      aspect-ratio: 16 / 9;
      object-fit: cover;
    }

    .standards__card > div {
      padding: 24px;
    }

    .standards__card h3 {
      font-size: 1.15rem;
      margin-bottom: 12px;
    }

    .standards__card ul {
      margin: 0 0 18px;
      padding: 0;
      list-style: none;
    }

    .standards__card li {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      font-size: 0.92rem;
    }

    .standards__card li app-icon {
      color: #fca5a5;
    }

    .standards__link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--lime);
      font-weight: 600;
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    /* Regions */
    .regions {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 20px;
    }

    .regions article {
      overflow: hidden;
      border-radius: var(--radius);
      background: var(--white);
    }

    .regions img {
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
    }

    .regions article > div {
      padding: 18px;
    }

    .regions h3 {
      font-size: 1.05rem;
    }

    .regions__states {
      margin: 2px 0 8px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--muted);
    }

    .regions p:last-child {
      font-size: 0.9rem;
      color: #3c453e;
    }

    @media (max-width: 1000px) {
      .values,
      .regions {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 820px) {
      .about,
      .farmers,
      .standards {
        grid-template-columns: 1fr;
        gap: 32px;
      }

      .about__photos img:first-child {
        aspect-ratio: 4 / 3;
      }
    }

    @media (max-width: 560px) {
      .values,
      .regions {
        grid-template-columns: 1fr;
      }

      .about__photos {
        padding: 0 20px 28px 0;
      }
    }
  `,
})
export class About {
  protected readonly img = IMAGES;
  protected readonly verify = VERIFY_STEPS;
  protected readonly without = GROWN_WITHOUT;
  protected readonly regions = REGIONS;

  protected readonly values: { icon: IconName; title: string; text: string }[] = [
    {
      icon: 'leaf',
      title: 'Real food',
      text: 'Food grown and raised the way it should be, with no shortcuts to make it look fresher or weigh more.',
    },
    {
      icon: 'pin',
      title: 'Full traceability',
      text: 'Every item names its farm and region. If something is wrong, we know exactly where it came from.',
    },
    {
      icon: 'users',
      title: 'Fair to farmers',
      text: 'No middlemen taking the biggest cut. Farmers set their prices and are paid directly.',
    },
    {
      icon: 'tag',
      title: 'Honest prices',
      text: 'The price you see is what you pay. Pools and seasonal buying help bring the cost down.',
    },
  ];
}
