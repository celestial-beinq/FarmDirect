import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { POSTS } from '../../core/data';
import { PhotoPipe } from '../../shared/pipes';

@Component({
  selector: 'app-blog',
  imports: [RouterLink, PhotoPipe],
  template: `
    <section class="page-hero">
      <h1>Blog</h1>
      <nav aria-label="Breadcrumb"><a routerLink="/">Home</a> / Blog</nav>
    </section>

    <section class="section">
      <div class="container posts">
        @for (post of posts; track post.title) {
          <article>
            <img [src]="post.image | photo: 700" alt="" loading="lazy" />
            <p class="meta">
              <strong>{{ post.topic }}</strong> {{ post.minutes }} min read
            </p>
            <h2>{{ post.title }}</h2>
            <p>{{ post.excerpt }}</p>
          </article>
        }
      </div>
    </section>
  `,
  styles: `
    .posts {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 32px;
    }

    img {
      width: 100%;
      aspect-ratio: 5 / 4;
      object-fit: cover;
      border-radius: var(--radius);
    }

    .meta {
      margin: 16px 0 8px;
      font-size: 0.72rem;
      color: var(--muted);
    }

    .meta strong {
      margin-right: 10px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ink);
    }

    h2 {
      font-size: 1.2rem;
      font-weight: 600;
    }

    article p:last-child {
      margin-top: 8px;
      color: var(--muted);
      font-size: 0.9rem;
    }

    @media (max-width: 860px) {
      .posts {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class Blog {
  protected readonly posts = POSTS;
}
