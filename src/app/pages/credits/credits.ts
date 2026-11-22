import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PHOTO_CREDITS } from '../../core/photo-credits';

/**
 * Credits for the photos on the site. Most come from Wikimedia Commons under
 * Creative Commons licences, which require naming the photographer and licence.
 */
@Component({
  selector: 'app-credits',
  imports: [RouterLink],
  template: `
    <section class="page-hero">
      <h1>Photo Credits</h1>
      <nav aria-label="Breadcrumb"><a routerLink="/">Home</a> / Photo Credits</nav>
    </section>

    <section class="section">
      <div class="container">
        <p class="intro">
          Many of the photos on FarmDirect were taken in Nigerian markets and farms by
          photographers who shared them on
          <a href="https://commons.wikimedia.org" target="_blank" rel="noopener">Wikimedia Commons</a>.
          Thank you to each of them. Photos have been resized and cropped to fit the site.
        </p>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Photographer</th>
                <th>Licence</th>
              </tr>
            </thead>
            <tbody>
              @for (c of credits; track c.file) {
                <tr>
                  <td>
                    <span class="thumb"><img [src]="c.file" alt="" loading="lazy" /></span>
                    <a [href]="c.source" target="_blank" rel="noopener">{{ c.title }}</a>
                  </td>
                  <td>{{ c.author || 'Unknown' }}</td>
                  <td>
                    @if (c.licenceUrl) {
                      <a [href]="c.licenceUrl" target="_blank" rel="noopener">{{ c.licence }}</a>
                    } @else {
                      {{ c.licence }}
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
  styles: `
    .intro {
      max-width: 70ch;
      margin-bottom: 28px;
      color: #3c453e;
    }

    a {
      color: var(--green-800);
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .table-scroll {
      overflow-x: auto;
      border: 1px solid var(--line);
      border-radius: var(--radius);
    }

    table {
      width: 100%;
      min-width: 640px;
      border-collapse: collapse;
      font-size: 0.88rem;
    }

    th {
      padding: 12px 16px;
      background: var(--cream);
      text-align: left;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--muted);
    }

    td {
      padding: 10px 16px;
      border-top: 1px solid var(--line);
      vertical-align: middle;
    }

    td:first-child {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .thumb {
      flex: none;
      width: 56px;
      height: 42px;
      overflow: hidden;
      border-radius: 6px;
      background: var(--sand);
    }

    .thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,
})
export class Credits {
  protected readonly credits = PHOTO_CREDITS;
}
