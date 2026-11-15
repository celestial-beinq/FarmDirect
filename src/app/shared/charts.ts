import { Component, computed, input, signal } from '@angular/core';
import { axisTicks } from '../core/analytics';

/**
 * The dashboard charts, drawn with plain HTML and SVG (no chart library).
 * Colours come from the --chart-* tokens in styles.css.
 */

export interface ChartPoint {
  label: string;
  value: number;
}

export interface ChartSlice {
  label: string;
  value: number;
  /** Any CSS colour. Keep one colour per label so it never changes between charts. */
  color: string;
}

/* ------------------------------------------------------------------ */
/* Values over time: a line with a soft fill, or columns.              */
/* ------------------------------------------------------------------ */

@Component({
  selector: 'app-time-chart',
  template: `
    <div class="wrap">
      <div
        class="plot"
        tabindex="0"
        role="img"
        [attr.aria-label]="summary()"
        (pointermove)="onMove($event)"
        (pointerleave)="hover.set(null)"
        (keydown)="onKey($event)"
        (blur)="hover.set(null)"
      >
        @for (tick of ticks(); track tick.value) {
          <div class="grid" [class.grid--base]="tick.value === 0" [style.bottom.%]="tick.y">
            <span>{{ tick.text }}</span>
          </div>
        }

        @if (type() === 'line') {
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path class="area" [attr.d]="areaPath()" />
            <path class="line" [attr.d]="linePath()" />
          </svg>
          @if (last(); as end) {
            <i class="dot" [style.left.%]="end.x" [style.bottom.%]="end.y"></i>
          }
        } @else {
          <div class="cols">
            @for (point of points(); track $index) {
              <span [class.is-hover]="$index === hover()">
                <i [style.height.%]="y(point.value)"></i>
              </span>
            }
          </div>
        }

        @if (hovered(); as h) {
          <div class="cross" [style.left.%]="h.x"></div>
          @if (type() === 'line') {
            <i class="dot" [style.left.%]="h.x" [style.bottom.%]="h.y"></i>
          }
          <div class="tip" [class.tip--flip]="h.x > 55" [style.left.%]="h.x">
            <strong>{{ h.text }}</strong>
            <span>{{ series() }} · {{ h.label }}</span>
          </div>
        }
      </div>

      <div class="x" aria-hidden="true">
        @for (tick of xTicks(); track tick.x) {
          <span [style.left.%]="tick.x" [class]="tick.align">{{ tick.label }}</span>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .wrap {
      padding: 8px 4px 0 52px;
    }
    .plot {
      position: relative;
      height: 220px;
      border-radius: 4px;
      touch-action: pan-y;
    }
    .grid {
      position: absolute;
      left: 0;
      right: 0;
      height: 0;
      border-top: 1px solid var(--line);
    }
    .grid--base {
      border-color: #c5c9bd;
    }
    .grid span {
      position: absolute;
      top: 0;
      right: 100%;
      padding-right: 8px;
      transform: translateY(-50%);
      font-size: 0.7rem;
      font-variant-numeric: tabular-nums;
      color: var(--muted);
      white-space: nowrap;
    }
    svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .line {
      fill: none;
      stroke: var(--chart-accent);
      stroke-width: 2;
      stroke-linejoin: round;
      stroke-linecap: round;
      vector-effect: non-scaling-stroke;
    }
    .area {
      fill: var(--chart-accent);
      opacity: 0.1;
    }
    .dot {
      position: absolute;
      width: 12px;
      height: 12px;
      margin: 0 0 -6px -6px;
      border: 2px solid var(--white);
      border-radius: 50%;
      background: var(--chart-accent);
      pointer-events: none;
    }
    .cols {
      position: absolute;
      inset: 0;
      display: flex;
    }
    .cols span {
      flex: 1;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      min-width: 0;
    }
    .cols i {
      width: min(24px, calc(100% - 2px));
      border-radius: 4px 4px 0 0;
      background: var(--chart-accent);
    }
    .cols .is-hover i {
      background: var(--green-900);
    }
    .cross {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background: #9aa193;
      pointer-events: none;
    }
    .tip {
      position: absolute;
      top: 4px;
      z-index: 2;
      margin-left: 10px;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      background: var(--green-900);
      color: var(--white);
      box-shadow: var(--shadow);
      white-space: nowrap;
      pointer-events: none;
    }
    .tip--flip {
      margin-left: -10px;
      transform: translateX(-100%);
    }
    .tip strong {
      display: block;
      font-family: var(--font-display);
      font-size: 0.95rem;
    }
    .tip span {
      font-size: 0.72rem;
      opacity: 0.8;
    }
    .x {
      position: relative;
      height: 26px;
    }
    .x span {
      position: absolute;
      top: 8px;
      transform: translateX(-50%);
      font-size: 0.7rem;
      color: var(--muted);
      white-space: nowrap;
    }
    .x .start {
      transform: none;
    }
    .x .end {
      transform: translateX(-100%);
    }
  `,
})
export class TimeChart {
  readonly points = input.required<ChartPoint[]>();
  readonly type = input<'line' | 'columns'>('line');
  /** What is being measured, e.g. "Revenue". Shown in the tooltip. */
  readonly series = input.required<string>();
  /** Turns a value into text for the tooltip. */
  readonly format = input<(value: number) => string>(String);
  /** Turns a value into (shorter) text for the axis. */
  readonly axisFormat = input<(value: number) => string>(String);

  /** Index of the point under the pointer or keyboard cursor. */
  protected readonly hover = signal<number | null>(null);

  private readonly scale = computed(() =>
    axisTicks(Math.max(0, ...this.points().map((p) => p.value))),
  );
  private readonly top = computed(() => this.scale().at(-1) || 1);

  protected readonly ticks = computed(() =>
    this.scale().map((value) => ({
      value,
      y: (value / this.top()) * 100,
      text: this.axisFormat()(value),
    })),
  );

  /** How far across the plot point `i` sits, as a percentage. */
  private x(i: number): number {
    const count = this.points().length;
    if (this.type() === 'columns') return ((i + 0.5) / count) * 100;
    return count > 1 ? (i / (count - 1)) * 100 : 50;
  }

  protected y(value: number): number {
    return (value / this.top()) * 100;
  }

  protected readonly linePath = computed(() =>
    this.points()
      .map(
        (p, i) => `${i ? 'L' : 'M'}${this.x(i).toFixed(2)} ${(100 - this.y(p.value)).toFixed(2)}`,
      )
      .join(''),
  );
  protected readonly areaPath = computed(() =>
    this.points().length
      ? `${this.linePath()}L${this.x(this.points().length - 1)} 100L${this.x(0)} 100Z`
      : '',
  );

  private at(i: number) {
    const point = this.points()[i];
    return point
      ? {
          x: this.x(i),
          y: this.y(point.value),
          label: point.label,
          text: this.format()(point.value),
        }
      : null;
  }
  protected readonly last = computed(() => this.at(this.points().length - 1));
  protected readonly hovered = computed(() => {
    const i = this.hover();
    return i === null ? null : this.at(i);
  });

  /** A handful of evenly spaced date labels under the plot. */
  protected readonly xTicks = computed(() => {
    const points = this.points();
    const count = Math.min(points.length, points.length <= 7 ? 7 : 6);
    const line = this.type() === 'line';
    return Array.from({ length: count }, (_, k) => {
      const i = count > 1 ? Math.round((k * (points.length - 1)) / (count - 1)) : 0;
      const align = !line || count < 2 ? '' : k === 0 ? 'start' : k === count - 1 ? 'end' : '';
      return { x: this.x(i), label: points[i].label, align };
    });
  });

  /** Read out by screen readers in place of the picture. */
  protected readonly summary = computed(() => {
    const points = this.points();
    if (!points.length) return `${this.series()}: no data`;
    const total = points.reduce((sum, p) => sum + p.value, 0);
    return `${this.series()} per day from ${points[0].label} to ${points.at(-1)!.label}. Total ${this.format()(total)}. Use the arrow keys to read each day.`;
  });

  protected onMove(event: PointerEvent): void {
    const count = this.points().length;
    if (!count) return;
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const across = (event.clientX - box.left) / box.width;
    const i =
      this.type() === 'columns' ? Math.floor(across * count) : Math.round(across * (count - 1));
    this.hover.set(Math.min(count - 1, Math.max(0, i)));
  }

  protected onKey(event: KeyboardEvent): void {
    const step = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
    const count = this.points().length;
    if (!step || !count) return;
    event.preventDefault();
    const from = this.hover() ?? (step > 0 ? -1 : count);
    this.hover.set(Math.min(count - 1, Math.max(0, from + step)));
  }
}

/* ------------------------------------------------------------------ */
/* Parts of a whole: a ring ("pie") chart with a legend.               */
/* ------------------------------------------------------------------ */

@Component({
  selector: 'app-donut-chart',
  template: `
    @if (total() > 0) {
      <div class="donut">
        <div class="ring">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            @for (part of parts(); track part.label) {
              <circle
                cx="60"
                cy="60"
                r="46"
                pathLength="100"
                fill="none"
                transform="rotate(-90 60 60)"
                [attr.stroke]="part.color"
                [attr.stroke-width]="part.label === hover() ? 20 : 16"
                [attr.stroke-dasharray]="part.dash"
                [attr.stroke-dashoffset]="part.offset"
                (pointerenter)="hover.set(part.label)"
                (pointerleave)="hover.set(null)"
              />
            }
          </svg>
          <div class="centre">
            <strong>{{ centre().value }}</strong>
            <span>{{ centre().label }}</span>
          </div>
        </div>

        <ul>
          @for (part of parts(); track part.label) {
            <li
              tabindex="0"
              [class.is-hover]="part.label === hover()"
              (pointerenter)="hover.set(part.label)"
              (pointerleave)="hover.set(null)"
              (focus)="hover.set(part.label)"
              (blur)="hover.set(null)"
            >
              <i [style.background]="part.color"></i>
              <span>{{ part.label }}</span>
              <b>{{ format()(part.value) }}</b>
              <small>{{ part.percent }}</small>
            </li>
          }
        </ul>
      </div>
    } @else {
      <p class="none">{{ empty() }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .donut {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 20px 28px;
    }
    .ring {
      position: relative;
      flex: none;
      width: 176px;
      height: 176px;
    }
    svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    circle {
      transition: stroke-width 0.12s;
    }
    .centre {
      position: absolute;
      inset: 0;
      display: grid;
      place-content: center;
      padding: 0 34px;
      text-align: center;
      pointer-events: none;
    }
    .centre strong {
      font-family: var(--font-display);
      font-size: 1.15rem;
      font-weight: 800;
      line-height: 1.2;
    }
    .centre span {
      font-size: 0.72rem;
      color: var(--muted);
    }
    ul {
      flex: 1;
      min-width: 190px;
      display: grid;
      gap: 2px;
    }
    li {
      display: grid;
      grid-template-columns: 10px minmax(0, 1fr) auto 38px;
      align-items: center;
      gap: 10px;
      padding: 6px 8px;
      border-radius: 6px;
      font-size: 0.85rem;
    }
    li.is-hover {
      background: var(--cream);
    }
    li i {
      width: 10px;
      height: 10px;
      border-radius: 3px;
    }
    li b {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    li small {
      text-align: right;
      font-size: 0.75rem;
      font-variant-numeric: tabular-nums;
      color: var(--muted);
    }
    .none {
      padding: 12px 0;
      color: var(--muted);
      font-size: 0.9rem;
    }
  `,
})
export class DonutChart {
  readonly slices = input.required<ChartSlice[]>();
  /** Caption under the total in the middle of the ring. */
  readonly caption = input('Total');
  readonly format = input<(value: number) => string>(String);
  readonly empty = input('Nothing to show yet.');

  /** Label of the slice being pointed at. */
  protected readonly hover = signal<string | null>(null);

  protected readonly total = computed(() => this.slices().reduce((sum, s) => sum + s.value, 0));

  protected readonly parts = computed(() => {
    const slices = this.slices().filter((s) => s.value > 0);
    // A sliver of the background between slices keeps neighbours apart.
    const gap = slices.length > 1 ? 0.8 : 0;
    let start = 0;
    return slices.map((slice) => {
      const share = (slice.value / this.total()) * 100;
      const part = {
        ...slice,
        percent: share < 1 ? '<1%' : `${Math.round(share)}%`,
        dash: `${Math.max(share - gap, 0.2)} 100`,
        offset: -start,
      };
      start += share;
      return part;
    });
  });

  protected readonly centre = computed(() => {
    const part = this.parts().find((p) => p.label === this.hover());
    return part
      ? { value: this.format()(part.value), label: `${part.label} · ${part.percent}` }
      : { value: this.format()(this.total()), label: this.caption() };
  });
}

/* ------------------------------------------------------------------ */
/* A ranked list with a bar behind each value.                         */
/* ------------------------------------------------------------------ */

@Component({
  selector: 'app-bar-list',
  template: `
    @for (row of rows(); track row.label) {
      <div class="row">
        <span>{{ row.label }}</span>
        <b>{{ format()(row.value) }}</b>
        <div><i [style.width.%]="(row.value / max()) * 100"></i></div>
      </div>
    } @empty {
      <p class="none">{{ empty() }}</p>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 14px;
    }
    .row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 6px 12px;
      font-size: 0.86rem;
    }
    .row span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .row b {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    .row div {
      grid-column: 1 / -1;
      height: 8px;
    }
    .row i {
      display: block;
      min-width: 2px;
      height: 100%;
      border-radius: 0 4px 4px 0;
      background: var(--chart-accent);
    }
    .none {
      padding: 12px 0;
      color: var(--muted);
      font-size: 0.9rem;
    }
  `,
})
export class BarList {
  readonly rows = input.required<ChartPoint[]>();
  readonly format = input<(value: number) => string>(String);
  readonly empty = input('Nothing to show yet.');

  protected readonly max = computed(() => Math.max(1, ...this.rows().map((r) => r.value)));
}
