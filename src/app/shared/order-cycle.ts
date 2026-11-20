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
  imports: [RouterLink, Icon],
  template: `
    <div class="cycle-banner" [class.cycle-banner--urgent]="cycle().isUrgent">
      <div class="container cycle-inner">
        <div class="cycle-status">
          @if (cycle().isHarvestingWeekend) {
            <span class="cycle-badge cycle-badge--weekend">
              <span class="dot dot--weekend"></span> Farm Harvest & Packing Weekend
            </span>
            <p class="cycle-msg">
              Farmers are actively harvesting this week's orders! Now accepting orders for <strong>Sunday, {{ cycle().nextSundayStr }}</strong>.
            </p>
          } @else if (cycle().isUrgent) {
            <span class="cycle-badge cycle-badge--urgent">
              <span class="dot dot--urgent"></span> Orders Closing Soon
            </span>
            <p class="cycle-msg">
              Order cut-off is <strong>Thursday midnight</strong>! Only
              <strong class="timer">{{ cycle().hours }}h {{ cycle().minutes }}m {{ cycle().seconds }}s</strong> left for this Sunday's delivery ({{ cycle().nextSundayStr }}).
            </p>
          } @else {
            <span class="cycle-badge">
              <span class="dot"></span> Sunday Batch Open
            </span>
            <p class="cycle-msg">
              Order by <strong>Thursday ({{ cycle().days }}d {{ cycle().hours }}h left)</strong> for farm-fresh delivery on <strong>Sunday, {{ cycle().nextSundayStr }}</strong>.
            </p>
          }
        </div>
        <div class="cycle-actions">
          <a routerLink="/crops" class="cycle-link">
            Shop Harvest <app-icon name="arrow-right" [size]="14" />
          </a>
        </div>
      </div>
    </div>
  `,
  styles: `
    .cycle-banner {
      background: #193821;
      color: #f3f6ea;
      padding: 8px 16px;
      font-size: 0.84rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .cycle-banner--urgent {
      background: #451a03;
      color: #fef3c7;
      border-bottom-color: #f59e0b;
    }

    .cycle-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .cycle-status {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
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
      letter-spacing: 0.05em;
    }

    .cycle-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #cfe86e;
      font-weight: 600;
      font-size: 0.8rem;
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    .cycle-link:hover {
      color: #ffffff;
    }

    .cycle-banner--urgent .cycle-link {
      color: #fde047;
    }

    @media (max-width: 640px) {
      .cycle-inner {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
      }
    }
  `,
})
export class OrderCycle implements OnInit, OnDestroy {
  protected readonly cycle = signal<CycleInfo>(this.computeCycle());
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
    let targetThursday = new Date(now);
    let targetSunday = new Date(now);

    let daysUntilThursday = (4 - day + 7) % 7;
    // If today is Thursday and past 23:59:59 (handled by time check), jump to next week
    targetThursday.setDate(now.getDate() + daysUntilThursday);
    targetThursday.setHours(23, 59, 59, 999);

    const isHarvestingWeekend = day === 5 || day === 6; // Friday or Saturday
    if (isHarvestingWeekend || (day === 4 && now.getTime() > targetThursday.getTime())) {
      // Current cycle closed, targeting next week
      daysUntilThursday += 7;
      targetThursday.setDate(now.getDate() + daysUntilThursday);
      targetThursday.setHours(23, 59, 59, 999);
    }

    // Delivery Sunday is 3 days after targetThursday
    targetSunday = new Date(targetThursday);
    targetSunday.setDate(targetThursday.getDate() + 3);

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
