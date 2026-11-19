import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { StoreService } from '../../core/store.service';
import { Icon, IconName } from '../../shared/icon';

export interface DashTab {
  id: string;
  label: string;
  icon: IconName;
  /** Heading the tab sits under in the menu, e.g. "Workspace". */
  group: string;
  /** Optional number shown beside the label, e.g. items waiting for action. */
  count?: number;
}

/**
 * The frame shared by all three dashboards: a full-height side menu of tabs
 * plus the page content, filling the whole screen (the shop's header and
 * footer are hidden on these routes). The open tab is kept in the URL as
 * "?tab=...". Its styles live in the global styles.css under "Dashboards".
 */
@Component({
  selector: 'app-dash-shell',
  imports: [RouterLink, Icon],
  template: `
    <section class="dash" [class.dash--side-open]="sidebarOpen()">
      <!-- Mobile Sticky Top Bar (shows on smaller screens) -->
      <header class="dash__mobile-bar">
        <button
          type="button"
          class="dash__menu-btn"
          [attr.aria-label]="sidebarOpen() ? 'Close sidebar' : 'Open sidebar'"
          [attr.aria-expanded]="sidebarOpen()"
          (click)="toggleSidebar()"
        >
          <app-icon [name]="sidebarOpen() ? 'close' : 'menu'" [size]="20" />
        </button>

        <a routerLink="/" class="dash__mobile-brand" aria-label="FarmDirect home">
          <span class="dash__mark">
            <svg viewBox="0 0 32 20" width="22" height="14" aria-hidden="true">
              <path d="M16 20C16 9 9 3 0 2c1 9 6 15 16 18z" fill="#cfe86e" />
              <path d="M16 20c0-9 6-16 16-20c0 10-6 17-16 20z" fill="#a9cc3c" />
            </svg>
          </span>
          <span class="dash__mobile-title">{{ activeLabel() }}</span>
        </a>

        <div class="dash__mobile-user">
          <span class="dash__avatar dash__avatar--sm" aria-hidden="true">{{ initials() }}</span>
        </div>
      </header>

      <!-- Mobile Backdrop Overlay -->
      @if (sidebarOpen()) {
        <div
          class="dash__backdrop"
          aria-hidden="true"
          (click)="closeSidebar()"
        ></div>
      }

      <aside class="dash__side" [class.is-open]="sidebarOpen()">
        <div class="dash__side-head">
          <a routerLink="/" class="dash__brand" aria-label="FarmDirect home" (click)="closeSidebar()">
            <span class="dash__mark">
              <svg viewBox="0 0 32 20" width="22" height="14" aria-hidden="true">
                <path d="M16 20C16 9 9 3 0 2c1 9 6 15 16 18z" fill="#cfe86e" />
                <path d="M16 20c0-9 6-16 16-20c0 10-6 17-16 20z" fill="#a9cc3c" />
              </svg>
            </span>
            <span>
              <strong>FarmDirect</strong>
              <small>{{ role() }} workspace</small>
            </span>
          </a>
          <button
            type="button"
            class="dash__close-btn"
            aria-label="Close sidebar"
            (click)="closeSidebar()"
          >
            <app-icon name="close" [size]="18" />
          </button>
        </div>

        <nav aria-label="Dashboard sections">
          @for (tab of tabs(); track tab.id; let i = $index) {
            @if (tab.group !== tabs()[i - 1]?.group) {
              <p class="dash__group">{{ tab.group }}</p>
            }
            <a
              [routerLink]="[]"
              [queryParams]="{ tab: tab.id }"
              [class.is-current]="tab.id === active()"
              [attr.aria-current]="tab.id === active() ? 'page' : null"
              (click)="closeSidebar()"
            >
              <app-icon [name]="tab.icon" [size]="18" />
              {{ tab.label }}
              @if (tab.count) {
                <span>{{ tab.count }}</span>
              }
            </a>
          }
        </nav>

        <div class="dash__foot">
          <button type="button" (click)="signOut()">
            <app-icon name="logout" [size]="18" /> Sign out
          </button>
        </div>
        <div class="dash__user">
          <span class="dash__avatar" aria-hidden="true">{{ initials() }}</span>
          <span>
            <strong>{{ name() }}</strong>
            <small>{{ role() }}</small>
          </span>
        </div>
      </aside>

      <div class="dash__main">
        @if (store.error()) {
          <div class="notice notice--bad" role="alert" style="display: flex; justify-content: space-between; align-items: center;">
            <span>{{ store.error() }}</span>
            <button type="button" class="btn btn--ghost btn--sm" style="padding: 2px 8px; min-height: unset; color: inherit; font-size: 1.1rem; border: none;" (click)="store.error.set('')" aria-label="Dismiss error">✕</button>
          </div>
        }
        @if (store.loaded()) {
          <ng-content />
        } @else {
          <p class="muted">Loading…</p>
        }
      </div>
    </section>
  `,
})
export class DashShell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly store = inject(StoreService);

  readonly role = input.required<string>();
  readonly name = input.required<string>();
  readonly tabs = input.required<DashTab[]>();
  readonly active = input.required<string>();

  protected readonly activeLabel = computed(
    () => this.tabs().find((tab) => tab.id === this.active())?.label ?? 'Overview',
  );
  /** "Ada Obi" → "AO", for the round badge beside the name. */
  protected readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join(''),
  );

  protected readonly sidebarOpen = signal(false);

  protected toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  constructor() {
    // Keep the numbers and charts up to date for as long as a dashboard is open.
    inject(DestroyRef).onDestroy(this.store.watch());
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigate(['/']);
  }
}
