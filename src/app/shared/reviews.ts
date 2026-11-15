import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Review } from '../core/accounts';
import { AuthService } from '../core/auth.service';
import { StoreService } from '../core/store.service';

/**
 * Reviews for one product. Anyone can read them. Only a customer who has
 * had this product delivered can write one — the form is hidden otherwise,
 * and the database enforces the same rule, so it cannot be bypassed.
 */
@Component({
  selector: 'app-reviews',
  imports: [DatePipe, RouterLink],
  template: `
    <section class="reviews" id="reviews">
      <div class="reviews__head">
        <h2>Customer Reviews</h2>
        @if (reviews().length > 0) {
          <p>
            <span class="stars" [attr.aria-label]="average() + ' out of 5 stars'">{{
              stars(average())
            }}</span>
            {{ average() }} · {{ reviews().length }}
            {{ reviews().length === 1 ? 'review' : 'reviews' }}
            from verified buyers
          </p>
        }
      </div>

      @if (canReview()) {
        <form class="panel" (submit)="$event.preventDefault(); save(comment.value)">
          <h3>{{ mine() ? 'Update your review' : 'Write a review' }}</h3>
          <div class="rating" role="radiogroup" aria-label="Your rating">
            @for (n of [1, 2, 3, 4, 5]; track n) {
              <button
                type="button"
                role="radio"
                [attr.aria-checked]="rating() === n"
                [attr.aria-label]="n + (n === 1 ? ' star' : ' stars')"
                [class.is-on]="n <= rating()"
                (click)="rating.set(n)"
              >
                ★
              </button>
            }
          </div>
          <textarea
            #comment
            maxlength="1000"
            placeholder="How was it? Freshness, quality, delivery…"
            aria-label="Your review"
            [value]="mine()?.comment ?? ''"
          ></textarea>
          <div class="form__foot">
            <button type="submit" class="btn btn--primary btn--sm" [disabled]="busy()">
              {{ mine() ? 'Update Review' : 'Post Review' }}
            </button>
            @if (mine(); as review) {
              <button
                type="button"
                class="btn btn--danger btn--sm"
                [disabled]="busy()"
                (click)="remove(review)"
              >
                Delete
              </button>
            }
            @if (error()) {
              <span class="form__error" role="alert">{{ error() }}</span>
            }
          </div>
        </form>
      } @else if (!auth.profile()) {
        <p class="hint">
          <a routerLink="/login">Sign in</a> to review this product once you've received it.
        </p>
      } @else if (auth.profile()?.role === 'customer') {
        <p class="hint">
          You can review this product after an order containing it has been delivered.
        </p>
      }

      @for (review of reviews(); track review.id) {
        <article class="review">
          <p class="review__top">
            <strong>{{ review.author }}</strong>
            <span class="stars" [attr.aria-label]="review.rating + ' out of 5 stars'">{{
              stars(review.rating)
            }}</span>
          </p>
          <p class="review__meta">Verified buyer · {{ review.date | date: 'mediumDate' }}</p>
          @if (review.comment) {
            <p>{{ review.comment }}</p>
          }
        </article>
      } @empty {
        @if (loaded()) {
          <p class="hint">No reviews yet.</p>
        }
      }
    </section>
  `,
  styles: `
    .reviews {
      margin-top: 72px;
      max-width: 760px;
    }

    .reviews__head h2 {
      font-size: clamp(1.4rem, 3vw, 1.8rem);
    }

    .reviews__head p {
      margin-top: 6px;
      font-size: 0.9rem;
      color: var(--muted);
    }

    .stars {
      color: #b7791f;
      letter-spacing: 2px;
    }

    form {
      margin-top: 20px;
    }

    h3 {
      font-size: 1rem;
    }

    .rating {
      display: flex;
      gap: 4px;
      margin: 10px 0;
    }

    .rating button {
      font-size: 1.7rem;
      line-height: 1;
      color: var(--sand);
    }

    .rating button.is-on {
      color: #b7791f;
    }

    textarea {
      width: 100%;
      min-height: 90px;
      margin-bottom: 12px;
      padding: 10px 12px;
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
      font: inherit;
      resize: vertical;
    }

    .hint {
      margin-top: 16px;
      font-size: 0.9rem;
      color: var(--muted);
    }

    .hint a {
      font-weight: 600;
      text-decoration: underline;
      color: var(--ink);
    }

    .review {
      padding: 18px 0;
      border-bottom: 1px solid var(--line);
    }

    .review__top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .review__meta {
      margin-bottom: 6px;
      font-size: 0.78rem;
      color: var(--muted);
    }
  `,
})
export class Reviews {
  private readonly store = inject(StoreService);
  protected readonly auth = inject(AuthService);

  readonly productId = input.required<string>();

  protected readonly reviews = signal<Review[]>([]);
  protected readonly loaded = signal(false);
  protected readonly rating = signal(5);
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected readonly average = computed(() => {
    const list = this.reviews();
    return list.length
      ? Math.round((list.reduce((sum, r) => sum + r.rating, 0) / list.length) * 10) / 10
      : 0;
  });

  /** My own review of this product, if I have written one. */
  protected readonly mine = computed(() =>
    this.reviews().find((r) => r.customerId === this.auth.userId()),
  );

  /** True if I am a customer with a delivered order containing this product. */
  protected readonly canReview = computed(
    () =>
      this.auth.profile()?.role === 'customer' &&
      this.store
        .orders()
        .some(
          (o) =>
            o.status === 'Delivered' &&
            o.customerId === this.auth.userId() &&
            o.items.some((i) => i.productId === this.productId()),
        ),
  );

  constructor() {
    effect(() => {
      this.productId();
      untracked(() => void this.load());
    });
  }

  protected stars(rating: number): string {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  private async load(): Promise<void> {
    this.reviews.set(await this.store.loadReviews([this.productId()]));
    this.loaded.set(true);
    const mine = this.mine();
    if (mine) this.rating.set(mine.rating);
  }

  protected async save(comment: string): Promise<void> {
    this.busy.set(true);
    const error = await this.store.saveReview(this.productId(), this.rating(), comment.trim());
    this.error.set(error ?? '');
    if (!error) await this.load();
    this.busy.set(false);
  }

  protected async remove(review: Review): Promise<void> {
    this.busy.set(true);
    const error = await this.store.deleteReview(review.id);
    this.error.set(error ?? '');
    if (!error) {
      this.rating.set(5);
      await this.load();
    }
    this.busy.set(false);
  }
}
