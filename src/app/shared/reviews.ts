import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Review } from '../core/accounts';
import { AuthService } from '../core/auth.service';
import { StoreService } from '../core/store.service';
import { Icon } from './icon';

/**
 * Reviews for one product. Anyone can read them. Only a customer who has
 * had this product delivered can write one — the form is hidden otherwise,
 * and the database enforces the same rule, so it cannot be bypassed.
 */
@Component({
  selector: 'app-reviews',
  imports: [DatePipe, RouterLink, Icon],
  template: `
    <section class="reviews" id="reviews">
      <div class="reviews__head">
        <h2>Customer Reviews</h2>
        @if (reviews().length > 0) {
          <div class="reviews__summary-bar">
            <div class="reviews__summary-score">
              <span class="reviews__score-num">{{ average().toFixed(1) }}</span>
              <div class="reviews__summary-stars" [attr.aria-label]="average() + ' out of 5 stars'">
                @for (star of [1, 2, 3, 4, 5]; track star) {
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    [attr.fill]="star <= Math.round(average()) ? '#f59e0b' : '#e2e8f0'"
                    aria-hidden="true"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                }
              </div>
            </div>
            <p class="reviews__summary-meta">
              Based on <strong>{{ reviews().length }}</strong> {{ reviews().length === 1 ? 'verified purchase review' : 'verified purchase reviews' }}
            </p>
          </div>
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
        <article class="review-box">
          <div class="review-box__head">
            <div class="review-box__user">
              <span class="review-box__avatar" aria-hidden="true">{{ initials(review.author) }}</span>
              <div>
                <p class="review-box__name">
                  <strong>{{ review.author }}</strong>
                  <span class="review-box__badge">
                    <app-icon name="check" [size]="10" /> Verified Buyer
                  </span>
                </p>
                <p class="review-box__meta">{{ review.date | date: 'mediumDate' }}</p>
              </div>
            </div>
            <div class="review-box__stars" [attr.aria-label]="review.rating + ' out of 5 stars'">
              @for (star of [1, 2, 3, 4, 5]; track star) {
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  [attr.fill]="star <= review.rating ? '#f59e0b' : '#e2e8f0'"
                  aria-hidden="true"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              }
            </div>
          </div>
          @if (review.comment) {
            <blockquote class="review-box__comment">"{{ review.comment }}"</blockquote>
          }
        </article>
      } @empty {
        @if (loaded()) {
          <p class="hint">No reviews yet. Be the first to try this fresh produce!</p>
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
      color: var(--ink);
    }

    .reviews__summary-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
      margin-top: 10px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--line);
    }

    .reviews__summary-score {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .reviews__score-num {
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--ink);
      line-height: 1;
    }

    .reviews__summary-stars {
      display: inline-flex;
      gap: 2px;
      color: #f59e0b;
    }

    .reviews__summary-meta {
      font-size: 0.875rem;
      color: var(--muted);
      margin: 0;
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
      color: #f59e0b;
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

    .review-box {
      padding: 20px 0;
      border-bottom: 1px solid var(--line);
    }

    .review-box__head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .review-box__user {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .review-box__avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: #ffffff;
      font-size: 0.8125rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: 0.5px;
      flex-shrink: 0;
    }

    .review-box__name {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      font-size: 0.9375rem;
      color: var(--ink);
      line-height: 1.25;
      margin: 0;
    }

    .review-box__badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 1px 7px;
      border-radius: 999px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      font-size: 0.6875rem;
      font-weight: 600;
    }

    .review-box__meta {
      font-size: 0.75rem;
      color: var(--muted);
      margin: 2px 0 0;
    }

    .review-box__stars {
      display: inline-flex;
      gap: 2px;
      color: #f59e0b;
    }

    .review-box__comment {
      font-size: 0.9375rem;
      line-height: 1.6;
      color: #334155;
      margin: 12px 0 0 48px;
      padding: 6px 0 6px 14px;
      border-left: 2px solid #10b981;
      background: rgba(240, 253, 244, 0.4);
      border-radius: 0 6px 6px 0;
    }

    @media (max-width: 600px) {
      .review-box__comment {
        margin-left: 0;
      }
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
  protected readonly Math = Math;

  protected initials(name: string): string {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('');
  }

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
