import { Component, computed, input } from '@angular/core';

/** Stroke icons on a 24×24 grid. Each entry is a list of SVG path strings. */
const ICONS = {
  search: ['M11 4a7 7 0 1 0 0 14a7 7 0 0 0 0-14z', 'M21 21l-4.3-4.3'],
  basket: ['M3 9h18l-1.7 9.2a2 2 0 0 1-2 1.8H6.7a2 2 0 0 1-2-1.8L3 9z', 'M8 9l4-6l4 6'],
  'arrow-right': ['M5 12h14', 'M13 6l6 6l-6 6'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  plus: ['M12 5v14', 'M5 12h14'],
  minus: ['M5 12h14'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  truck: [
    'M2 6h11v10H2z',
    'M13 9h4.5L21 12.5V16h-8z',
    'M6.5 19.5a1.8 1.8 0 1 0 0-3.6a1.8 1.8 0 0 0 0 3.6z',
    'M17 19.5a1.8 1.8 0 1 0 0-3.6a1.8 1.8 0 0 0 0 3.6z',
  ],
  users: [
    'M9 11a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7z',
    'M2.5 20a6.5 6.5 0 0 1 13 0',
    'M16 4.3a3.5 3.5 0 0 1 0 6.4',
    'M18 14.2a6.5 6.5 0 0 1 3.500 5.800',
  ],
  leaf: ['M5 19c0-8 5-13 15-14c-1 10-6 15-14 14z', 'M5 19l7-7'],
  shield: [
    'M12 3l7 3v5.5c0 4.500-3 8-7 9.500c-4-1.500-7-5-7-9.500V6l7-3z',
    'M9 12l2.200 2.200L15 10',
  ],
  info: ['M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18z', 'M12 11v5', 'M12 8h.01'],
  copy: ['M9 9h11v11H9z', 'M5 15H4V4h11v1'],
  link: [
    'M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1',
    'M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1',
  ],
  pin: [
    'M12 21s7-6.200 7-11.500a7 7 0 1 0-14 0C5 14.800 12 21 12 21z',
    'M12 12a2.500 2.500 0 1 0 0-5a2.500 2.500 0 0 0 0 5z',
  ],
  eye: [
    'M2 12s3.600-7 10-7s10 7 10 7s-3.600 7-10 7S2 12 2 12z',
    'M12 15a3 3 0 1 0 0-6a3 3 0 0 0 0 6z',
  ],
  tag: ['M3 12V3h9l9 9l-9 9l-9-9z', 'M7.500 7.500h.01'],
  box: ['M3 7.500L12 3l9 4.500v9L12 21l-9-4.500z', 'M3 7.500L12 12l9-4.500', 'M12 12v9'],
  'chevron-left': ['M15 6l-6 6l6 6'],
  'chevron-right': ['M9 6l6 6l-6 6'],
  trash: ['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 13h10l1-13'],
  user: ['M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8z', 'M4 21a8 8 0 0 1 16 0'],
  clock: ['M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18z', 'M12 7v5l3 2'],
} satisfies Record<string, string[]>;

export type IconName = keyof typeof ICONS;

@Component({
  selector: 'app-icon',
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.width]="size()"
      [attr.height]="size()"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @for (d of paths(); track d) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
  protected readonly paths = computed(() => ICONS[this.name()]);
}
