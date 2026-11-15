import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IMAGES } from '../../core/data';
import { PhotoPipe } from '../../shared/pipes';

@Component({
  selector: 'app-about',
  imports: [RouterLink, PhotoPipe],
  template: `
    <section class="page-hero">
      <h1>About Us</h1>
      <nav aria-label="Breadcrumb"><a routerLink="/">Home</a> / About Us</nav>
    </section>

    <section class="section">
      <div class="container about">
        <img [src]="img.harvest | photo: 1000" alt="Farm workers harvesting vegetables" />
        <div>
          <span class="eyebrow">Our mission</span>
          <h2>Real food, straight from the people who grow it</h2>
          <p>
            Too much of what reaches Nigerian kitchens has been tampered with on the way: fruit
            forced ripe with chemicals, grain mixed with fillers, produce that changes hands so many
            times nobody can say where it came from.
          </p>
          <p>
            FarmDirect removes the hands in between. Households order directly from verified
            farmers, the farmer harvests for that order, and it is delivered to the door. You see
            the farm region on every item, and the farmer is paid fairly for it.
          </p>
          <ul>
            <li><strong>Verified farms.</strong> We only list farmers we have checked.</li>
            <li><strong>Harvested to order.</strong> Nothing sits in a warehouse.</li>
            <li>
              <strong>Shared livestock.</strong> Families pool together to buy healthy animals.
            </li>
          </ul>
          <a routerLink="/crops" class="btn btn--primary btn--pill">Visit the Marketplace</a>
        </div>
      </div>
    </section>
  `,
  styles: `
    .about {
      display: grid;
      grid-template-columns: 1fr 1.1fr;
      gap: 56px;
      align-items: center;
    }

    img {
      width: 100%;
      aspect-ratio: 4 / 5;
      object-fit: cover;
      border-radius: var(--radius-lg);
    }

    h2 {
      margin: 16px 0 20px;
      font-size: clamp(1.7rem, 3.4vw, 2.4rem);
    }

    p {
      margin-bottom: 16px;
      color: #3c453e;
    }

    ul {
      margin: 24px 0 28px;
    }

    li {
      padding: 10px 0;
      border-top: 1px solid var(--line);
      font-size: 0.95rem;
    }

    @media (max-width: 820px) {
      .about {
        grid-template-columns: 1fr;
        gap: 32px;
      }

      img {
        aspect-ratio: 4 / 3;
      }
    }
  `,
})
export class About {
  protected readonly img = IMAGES;
}
