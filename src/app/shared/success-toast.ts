import { Component, DestroyRef, effect, inject, input, signal, untracked } from '@angular/core';

/**
 * A short "it worked" popup: a green circle draws itself, a tick appears, and
 * the message shows for about two seconds before sliding away.
 *
 * Usage: keep a counter and bump it after each successful save.
 *   <app-success-toast [pulse]="savedPulse()" message="Profile saved" />
 *   this.savedPulse.update((n) => n + 1);
 * Each new number plays the animation again (even for the same message).
 */
@Component({
  selector: 'app-success-toast',
  template: `
    @if (visible()) {
      <div class="toast" role="status" aria-live="polite">
        <svg class="toast__mark" viewBox="0 0 52 52" aria-hidden="true">
          <circle class="toast__circle" cx="26" cy="26" r="23" />
          <path class="toast__tick" d="M15 27l7 7 15-16" />
        </svg>
        <span class="toast__text">
          <strong>{{ message() }}</strong>
          @if (detail()) {
            <small>{{ detail() }}</small>
          }
        </span>
      </div>
    }
  `,
  styles: `
    .toast {
      position: fixed;
      left: 50%;
      bottom: 28px;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 220px;
      max-width: calc(100vw - 32px);
      padding: 12px 18px 12px 12px;
      border-radius: 14px;
      background: #12281a;
      color: #ffffff;
      box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.45);
      transform: translateX(-50%);
      animation:
        toast-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both,
        toast-out 0.3s ease-in 1.9s forwards;
    }

    .toast__mark {
      flex: none;
      width: 38px;
      height: 38px;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .toast__circle {
      fill: #22a447;
      stroke: #4ade80;
      stroke-width: 3;
      stroke-dasharray: 145;
      stroke-dashoffset: 145;
      animation: toast-draw 0.5s 0.1s ease-out forwards;
    }

    .toast__tick {
      stroke: #ffffff;
      stroke-width: 4.5;
      stroke-dasharray: 36;
      stroke-dashoffset: 36;
      animation: toast-draw 0.3s 0.45s ease-out forwards;
    }

    .toast__text {
      display: grid;
      gap: 1px;
    }

    .toast__text strong {
      font-size: 0.92rem;
      font-weight: 700;
    }

    .toast__text small {
      font-size: 0.78rem;
      color: rgba(255, 255, 255, 0.72);
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translate(-50%, 16px) scale(0.96);
      }
    }

    @keyframes toast-out {
      to {
        opacity: 0;
        transform: translate(-50%, 10px);
      }
    }

    @keyframes toast-draw {
      to {
        stroke-dashoffset: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .toast {
        animation: toast-out 0.01s 2.2s forwards;
      }

      .toast__circle,
      .toast__tick {
        animation: none;
        stroke-dashoffset: 0;
      }
    }
  `,
})
export class SuccessToast {
  /** Bump this number to show the toast. 0 means "never shown yet". */
  readonly pulse = input(0);
  readonly message = input('Saved');
  readonly detail = input('');

  protected readonly visible = signal(false);
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const pulse = this.pulse();
      untracked(() => {
        if (!pulse) return;
        if (this.timer) clearTimeout(this.timer);
        // Remove then re-add so the animation replays on back-to-back saves.
        this.visible.set(false);
        setTimeout(() => {
          this.visible.set(true);
          this.timer = setTimeout(() => this.visible.set(false), 2300);
        });
      });
    });
    inject(DestroyRef).onDestroy(() => {
      if (this.timer) clearTimeout(this.timer);
    });
  }
}
