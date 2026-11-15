import { Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

export interface DashTab {
  id: string;
  label: string;
  /** Optional number shown beside the label, e.g. items waiting for action. */
  count?: number;
}

/**
 * The frame shared by all three dashboards: a side menu of tabs plus the
 * page content. The open tab is kept in the URL as "?tab=...".
 * Its styles live in the global styles.css under "Dashboards".
 */
@Component({
  selector: 'app-dash-shell',
  imports: [RouterLink],
  template: `
    <section class="container dash">
      <aside class="dash__side">
        <p class="dash__role">{{ role() }}</p>
        <p class="dash__name">{{ name() }}</p>
        <nav aria-label="Dashboard sections">
          @for (tab of tabs(); track tab.id) {
            <a
              [routerLink]="[]"
              [queryParams]="{ tab: tab.id }"
              [class.is-current]="tab.id === active()"
              [attr.aria-current]="tab.id === active() ? 'page' : null"
            >
              {{ tab.label }}
              @if (tab.count) {
                <span>{{ tab.count }}</span>
              }
            </a>
          }
        </nav>
        <button type="button" class="dash__out" (click)="signOut()">Sign out</button>
      </aside>
      <div class="dash__main">
        <ng-content />
      </div>
    </section>
  `,
})
export class DashShell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly role = input.required<string>();
  readonly name = input.required<string>();
  readonly tabs = input.required<DashTab[]>();
  readonly active = input.required<string>();

  protected signOut(): void {
    this.auth.signOut();
    this.router.navigate(['/']);
  }
}
