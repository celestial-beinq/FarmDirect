import { NgTemplateOutlet } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from './icon';

interface CycleInfo {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  nextThursdayStr: string;
  nextSundayStr: string;
  isUrgent: boolean;
  isHarvestingWeekend: boolean;
}

@Component({
  selector: 'app-order-cycle',
  imports: [RouterLink, Icon, NgTemplateOutlet],
  template: `
    <!-- One message, shown as a scrolling strip. -->
    <ng-template #message>
      <span class="cycle-item">
        @if (cycle().isHarvestingWeekend) {
          <span class="cycle-badge cycle-badge--weekend">
            <span class="dot dot--weekend"></span> Harvest &amp; Packing Weekend
          </span>
          <span class="cycle-msg">
            Farmers are harvesting this week's orders. Now taking orders for
            <strong>Sunday, {{ cycle().nextSundayStr }}</strong>.
          </span>
        } @else if (cycle().isUrgent) {
          <span class="cycle-badge cycle-badge--urgent">
            <span class="dot dot--urgent"></span> Orders Closing Soon
          </span>
          <span class="cycle-msg">
            Cut-off is <strong>Thursday midnight</strong>. Only
            <strong class="timer"
              >{{ cycle().hours }}h {{ cycle().minutes }}m {{ cycle().seconds }}s</strong
            >
            left for Sunday delivery ({{ cycle().nextSundayStr }}).
          </span>
        } @else {
          <span class="cycle-badge"> <span class="dot"></span> Sunday Batch Open </span>
          <span class="cycle-msg">
            Order by <strong>Thursday ({{ cycle().days }}d {{ cycle().hours }}h left)</strong> for
            farm-fresh delivery on <strong>Sunday, {{ cycle().nextSundayStr }}</strong>.
          </span>
        }
      </span>
    </ng-template>

    <div class="cycle-banner" [class.cycle-banner--urgent]="cycle().isUrgent">
      <div class="cycle-marquee">
        <div class="cycle-track">
          <!-- Two identical halves; sliding by one half loops seamlessly.
               Only the very first copy is read by screen readers. -->
          @for (half of halves; track half) {
            <div class="cycle-half" [attr.aria-hidden]="half > 0 ? 'true' : null">
              @for (copy of copies; track copy) {
                <span class="cycle-copy" [attr.aria-hidden]="copy > 0 ? 'true' : null">
                  <ng-container [ngTemplateOutlet]="message" />
                </span>
              }
            </div>
          }
        </div>
      </div>
      <a routerLink="/crops" class="cycle-link">
        <span class="cycle-link__text">Shop Harvest</span>
        <app-icon name="arrow-right" [size]="14" />
      </a>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .cycle-banner {
      --cycle-bg: #193821;
      display: flex;
      align-items: stretch;
      min-height: 38px;
      background: var(--cycle-bg);
      color: #f3f6ea;
      font-size: 0.84rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      overflow: hidden;
    }

    .cycle-banner--urgent {
      --cycle-bg: #451a03;
      color: #fef3c7;
      border-bottom-color: #f59e0b;
    }

    /* The scrolling area: fades out at both edges. */
    .cycle-marquee {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      overflow: hidden;
      -webkit-mask-image: linear-gradient(90deg, transparent, #000 32px, #000 calc(100% - 32px), transparent);
      mask-image: linear-gradient(90deg, transparent, #000 32px, #000 calc(100% - 32px), transparent);
    }

    .cycle-track {
      display: flex;
      width: max-content;
      animation: cycle-scroll 45s linear infinite;
    }

    /* Let people stop it to read or click. */
    .cycle-banner:hover .cycle-track,
    .cycle-banner:focus-within .cycle-track {
      animation-play-state: paused;
    }

    @keyframes cycle-scroll {
      from { transform: translateX(0); }
      to { transform: translateX(-50%); }
    }

    .cycle-half {
      display: flex;
      flex: none;
    }

    .cycle-copy {
      display: flex;
      flex: none;
    }

    .cycle-item {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 0 28px;
      white-space: nowrap;
    }

    /* A small separator between repeats. */
    .cycle-item::after {
      content: '•';
      margin-left: 18px;
      color: rgba(255, 255, 255, 0.35);
    }

    .cycle-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(207, 232, 110, 0.18);
      color: #cfe86e;
      white-space: nowrap;
    }

    .cycle-badge::before {
      display: none !important;
    }

    .cycle-badge--urgent {
      background: rgba(239, 68, 68, 0.25);
      color: #fca5a5;
    }

    .cycle-badge--weekend {
      background: rgba(59, 130, 246, 0.2);
      color: #93c5fd;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #cfe86e;
      animation: pulse 2s infinite;
      flex-shrink: 0;
    }

    .dot--urgent {
      background: #ef4444;
    }

    .dot--weekend {
      background: #60a5fa;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    .cycle-msg {
      margin: 0;
      color: rgba(255, 255, 255, 0.9);
    }

    .cycle-msg strong {
      color: #ffffff;
    }

    .cycle-banner--urgent .cycle-msg strong {
      color: #fef08a;
    }

    .timer {
      font-family: monospace;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.05em;
    }

    /* Fixed on the right so it is always easy to tap. */
    .cycle-link {
      display: inline-flex;
      flex: none;
      align-items: center;
      gap: 6px;
      padding: 0 16px;
      background: var(--cycle-bg);
      border-left: 1px solid rgba(255, 255, 255, 0.12);
      color: #cfe86e;
      font-weight: 600;
      font-size: 0.8rem;
      white-space: nowrap;
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    .cycle-link:hover {
      color: #ffffff;
    }

    .cycle-link:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: -4px;
    }

    .cycle-banner--urgent .cycle-link {
      color: #fde047;
    }

    @media (max-width: 640px) {
      .cycle-banner {
        font-size: 0.78rem;
        min-height: 34px;
      }

      .cycle-item {
        gap: 8px;
        padding: 0 18px;
      }

      .cycle-badge {
        font-size: 0.66rem;
        padding: 2px 7px;
      }

      .cycle-link {
        padding: 0 12px;
      }
    }

    /* Just the arrow on very small phones; the label stays for screen readers. */
    @media (max-width: 380px) {
      .cycle-link__text {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
      }
    }

    /* No motion wanted: show one copy that fits, cut off with "…". */
    @media (prefers-reduced-motion: reduce) {
      .cycle-track {
        animation: none;
        width: 100%;
      }

      .cycle-half + .cycle-half,
      .cycle-copy + .cycle-copy {
        display: none;
      }

      .cycle-half,
      .cycle-copy,
      .cycle-item {
        min-width: 0;
        max-width: 100%;
        flex: 1 1 auto;
      }

      .cycle-item {
        padding: 0 16px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .cycle-item::after {
        display: none;
      }

      .cycle-marquee {
        -webkit-mask-image: none;
        mask-image: none;
      }
    }
  `,
})
export class OrderCycle implements OnInit, OnDestroy {
  protected readonly cycle = signal<CycleInfo>(this.computeCycle());
  /** The track holds two equal halves (for a seamless loop)... */
  protected readonly halves = [0, 1];
  /** ...each repeating the message enough times to cover wide screens. */
  protected readonly copies = [0, 1, 2];
  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.cycle.set(this.computeCycle());
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private computeCycle(): CycleInfo {
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday, 4 is Thursday, 5 Friday, 6 Saturday

    // Thursday cutoff is day 4 at 23:59:59
    const targetThursday = new Date(now);
    let daysUntilThursday = (4 - day + 7) % 7;
    targetThursday.setDate(now.getDate() + daysUntilThursday);
    targetThursday.setHours(23, 59, 59, 999);

    // If today is Thursday and past 23:59:59 cut-off, target next Thursday (+7 days)
    if (day === 4 && now.getTime() > targetThursday.getTime()) {
      targetThursday.setDate(targetThursday.getDate() + 7);
    }

    // Delivery Sunday is 3 days after targetThursday
    const targetSunday = new Date(targetThursday);
    targetSunday.setDate(targetThursday.getDate() + 3);

    const isHarvestingWeekend = day === 5 || day === 6; // Friday or Saturday
    const diff = Math.max(0, targetThursday.getTime() - now.getTime());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const isUrgent = !isHarvestingWeekend && days === 0 && hours < 24;

    const monthFormat = new Intl.DateTimeFormat('en-NG', { month: 'short', day: 'numeric' });

    return {
      days,
      hours,
      minutes,
      seconds,
      nextThursdayStr: monthFormat.format(targetThursday),
      nextSundayStr: monthFormat.format(targetSunday),
      isUrgent,
      isHarvestingWeekend,
    };
  }
}
