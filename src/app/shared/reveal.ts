import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';
import { animate, inView } from 'motion';

/**
 * How an element arrives on screen. `group` animates the element's
 * `[reveal-item]` children one after another instead of the element itself;
 * each child can name its own variant, e.g. `reveal-item="scale"`.
 */
type Variant = '' | 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade' | 'group';

const FROM: Record<Exclude<Variant, 'group'>, Record<string, [number, number]>> = {
  '': { y: [32, 0] },
  up: { y: [32, 0] },
  down: { y: [-24, 0] },
  left: { x: [-48, 0] },
  right: { x: [48, 0] },
  scale: { scale: [0.9, 1] },
  fade: {},
};

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Scroll-triggered entrance animation powered by Motion (the framework-free
 * build of Framer Motion). Elements start hidden through the `motion-ready`
 * class that index.html adds before first paint, so nothing flashes; visitors
 * who prefer reduced motion never get that class and see the page as is.
 *
 * Only use `group` on lists that are rendered from static data: items added
 * after the page loads would stay hidden. Give dynamic items their own
 * `reveal` instead.
 */
@Directive({ selector: '[reveal]' })
export class Reveal {
  readonly reveal = input<Variant>('');
  /** Seconds to wait before the animation starts. */
  readonly revealDelay = input(0);
  /** Seconds between each item of a group. */
  readonly revealStagger = input(0.09);

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const root = document.documentElement;
      root.dataset['motion'] = 'on';
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      // Re-added for visits that reach this page later through in-app navigation.
      root.classList.add('motion-ready');

      const group = this.reveal() === 'group';
      const targets = group ? Array.from(el.querySelectorAll<HTMLElement>('[reveal-item]')) : [el];

      const stop = inView(
        el,
        () => {
          targets.forEach((target, i) => {
            const variant = (group ? target.getAttribute('reveal-item') : this.reveal()) as Variant;
            animate(
              target,
              { opacity: [0, 1], ...FROM[variant === 'group' ? '' : (variant ?? '')] },
              {
                duration: 0.8,
                ease: EASE,
                delay: this.revealDelay() + (group ? i * this.revealStagger() : 0),
              },
            );
          });
        },
        { amount: 0.15 },
      );
      destroyRef.onDestroy(stop);
    });
  }
}
