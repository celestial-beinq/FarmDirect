import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Role } from '../../core/accounts';
import { ADMIN_INACTIVITY_LIMIT_MS, AuthService } from '../../core/auth.service';
import { sanitizePhone, sanitizeText } from '../../core/sanitizer';
import { NOTIFY_TOPICS, SettingsService } from '../../core/settings.service';
import { StoreService } from '../../core/store.service';

/**
 * The Settings tab, shared by the customer, farmer and admin dashboards.
 * Sections shown depend on the signed-in user's role.
 */
@Component({
  selector: 'app-dash-settings',
  imports: [RouterLink],
  templateUrl: './settings.html',
})
export class DashSettings {
  private readonly auth = inject(AuthService);
  private readonly store = inject(StoreService);
  private readonly router = inject(Router);
  protected readonly settingsService = inject(SettingsService);

  protected readonly me = this.auth.profile;
  /** The signed-in user's role decides which sections and options show. */
  protected readonly role = computed<Role>(() => this.me()?.role ?? 'customer');
  protected readonly topics = computed(() => NOTIFY_TOPICS[this.role()]);
  protected readonly idleMinutes = ADMIN_INACTIVITY_LIMIT_MS / 60000;

  /* ---- Account details (farmers and admins; customers use Profile & Address) ---- */
  protected readonly accountSaved = signal(false);
  protected readonly accountError = signal('');

  protected async saveAccount(name: string, phone: string): Promise<void> {
    this.accountSaved.set(false);
    const cleanName = sanitizeText(name, 120);
    if (!cleanName) return this.accountError.set('Enter your name.');
    const error = await this.store.updateMyProfile(
      cleanName,
      sanitizePhone(phone),
      this.me()?.address ?? '',
    );
    this.accountError.set(error ?? '');
    this.accountSaved.set(!error);
  }

  /* ---- Notifications & preferences (saved together) ---- */
  protected readonly prefsSaved = signal(false);
  protected readonly prefsError = signal('');
  protected readonly prefsBusy = signal(false);

  protected async setTopic(id: string, on: boolean): Promise<void> {
    const current = this.settingsService.settings();
    await this.savePrefs({ ...current, notify: { ...current.notify, [id]: on } });
  }

  protected async setLowStock(value: string): Promise<void> {
    const threshold = Math.floor(Number(value));
    if (!Number.isFinite(threshold) || threshold < 1 || threshold > 1000) {
      this.prefsSaved.set(false);
      return this.prefsError.set('Low-stock level must be a whole number from 1 to 1000.');
    }
    await this.savePrefs({ ...this.settingsService.settings(), lowStockThreshold: threshold });
  }

  private async savePrefs(next: Parameters<SettingsService['save']>[0]): Promise<void> {
    this.prefsBusy.set(true);
    this.prefsSaved.set(false);
    const error = await this.settingsService.save(next);
    this.prefsBusy.set(false);
    this.prefsError.set(error ? `Saved on this device only: ${error}` : '');
    this.prefsSaved.set(!error);
  }

  /* ---- Security ---- */
  protected readonly passwordSaved = signal(false);
  protected readonly passwordError = signal('');
  protected readonly passwordBusy = signal(false);

  protected async changePassword(form: HTMLFormElement, password: string, confirm: string) {
    this.passwordBusy.set(true);
    this.passwordSaved.set(false);
    const error = await this.auth.changePassword(password, confirm);
    this.passwordBusy.set(false);
    this.passwordError.set(error ?? '');
    this.passwordSaved.set(!error);
    if (!error) form.reset();
  }

  protected readonly confirmingSignOut = signal(false);

  protected async signOutEverywhere(): Promise<void> {
    await this.auth.signOutEverywhere();
    await this.router.navigate(['/login']);
  }
}
