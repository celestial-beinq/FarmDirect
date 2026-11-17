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
  grid: ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'],
  chart: ['M4 20h16', 'M7 20v-6', 'M12 20V6', 'M17 20v-9'],
  file: ['M6 3h8l4 4v14H6z', 'M14 3v4h4', 'M9 13h6', 'M9 17h6'],
  star: ['M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z'],
  home: ['M4 11l8-7l8 7', 'M6 10v10h12V10'],
  logout: ['M10 4H5v16h5', 'M15 8l4 4l-4 4', 'M19 12H9'],
  clock: ['M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18z', 'M12 7v5l3 2'],
  mail: ['M3 6h18v12H3z', 'M3 7l9 6l9-6'],
  lock: ['M5 11h14v10H5z', 'M8 11V7a4 4 0 0 1 8 0v4'],
  phone: [
    'M5 4h4l2 5l-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  ],
  chat: ['M4 5h16v11H9l-5 4z', 'M8 10h8', 'M8 13h5'],
  'eye-off': [
    'M3 3l18 18',
    'M10.600 5.100A10 10 0 0 1 12 5c6.400 0 10 7 10 7a17 17 0 0 1-3.200 4.100',
    'M6.600 6.600C3.700 8.500 2 12 2 12s3.600 7 10 7a9.700 9.700 0 0 0 5.400-1.600',
    'M9.900 9.900a3 3 0 0 0 4.200 4.200',
  ],
  'arrow-left': ['M19 12H5', 'M11 6l-6 6l6 6'],
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
