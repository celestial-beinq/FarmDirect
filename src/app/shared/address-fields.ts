import { Component, computed, input, model } from '@angular/core';
import { AddressParts, NIGERIAN_STATES, formatAddress } from '../core/accounts';
import { LGAS_BY_STATE } from '../core/nigeria-lgas';

/**
 * State → local government → city/town → street → landmark, for any Nigerian
 * address. Use inside a `.form` (it relies on the dashboard form styles):
 *
 *   <app-address-fields [(parts)]="homeAddress" idPrefix="home" />
 *
 * Choosing a new state clears the LGA, and the LGA list only shows that
 * state's LGAs. A one-line preview shows how the address will read.
 */
@Component({
  selector: 'app-address-fields',
  template: `
    <div class="address-grid">
      <label [attr.for]="idPrefix() + '-state'">
        State
        <select
          [id]="idPrefix() + '-state'"
          required
          autocomplete="address-level1"
          (change)="set('state', $any($event.target).value)"
        >
          <option value="" [selected]="!parts().state">Select state</option>
          @for (state of states; track state) {
            <option [value]="state" [selected]="state === parts().state">{{ state }}</option>
          }
        </select>
      </label>

      <label [attr.for]="idPrefix() + '-lga'">
        Local government area
        <select
          [id]="idPrefix() + '-lga'"
          required
          [disabled]="!parts().state"
          (change)="set('lga', $any($event.target).value)"
        >
          <option value="" [selected]="!parts().lga">
            {{ parts().state ? 'Select LGA' : 'Choose a state first' }}
          </option>
          @for (lga of lgas(); track lga) {
            <option [value]="lga" [selected]="lga === parts().lga">{{ lga }}</option>
          }
        </select>
      </label>

      <label [attr.for]="idPrefix() + '-city'">
        City / town
        <input
          [id]="idPrefix() + '-city'"
          maxlength="50"
          required
          autocomplete="address-level2"
          [placeholder]="cityPlaceholder()"
          [value]="parts().city"
          (input)="set('city', $any($event.target).value)"
        />
      </label>

      <label [attr.for]="idPrefix() + '-landmark'">
        <span>Nearest landmark <small class="optional">(optional)</small></span>
        <input
          [id]="idPrefix() + '-landmark'"
          maxlength="60"
          [placeholder]="landmarkPlaceholder()"
          [value]="parts().landmark"
          (input)="set('landmark', $any($event.target).value)"
        />
      </label>

      <label class="address-grid__wide" [attr.for]="idPrefix() + '-street'">
        {{ streetLabel() }}
        <input
          [id]="idPrefix() + '-street'"
          maxlength="115"
          required
          autocomplete="street-address"
          [placeholder]="streetPlaceholder()"
          [value]="parts().street"
          (input)="set('street', $any($event.target).value)"
        />
      </label>

      @if (preview()) {
        <div class="address-grid__wide address-preview" aria-live="polite">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21z" />
            <path d="M12 12a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5z" />
          </svg>
          <div>
            <small>{{ previewLabel() }}</small>
            <strong>{{ preview() }}</strong>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    .address-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .address-grid__wide {
      grid-column: 1 / -1;
    }

    select:disabled {
      background: #f8fafc;
      color: #94a3b8;
      cursor: not-allowed;
    }

    .optional {
      font-weight: 400;
      color: #94a3b8;
    }

    @media (max-width: 640px) {
      .address-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class AddressFields {
  readonly parts = model.required<AddressParts>();
  /** Makes field ids unique when two address blocks share a page. */
  readonly idPrefix = input('address');
  readonly streetLabel = input('Street address');
  readonly streetPlaceholder = input('House number and street, e.g. 12 Admiralty Way');
  readonly cityPlaceholder = input('e.g. Lekki');
  readonly landmarkPlaceholder = input('e.g. Opposite Mega Plaza');
  readonly previewLabel = input('Address');

  protected readonly states = NIGERIAN_STATES;
  protected readonly lgas = computed(() => LGAS_BY_STATE[this.parts().state] ?? []);
  protected readonly preview = computed(() => formatAddress(this.parts()));

  protected set(field: keyof AddressParts, value: string): void {
    const current = this.parts();
    this.parts.set({
      ...current,
      [field]: value,
      // A different state means the old LGA no longer applies.
      ...(field === 'state' && value !== current.state ? { lga: '' } : {}),
    });
  }
}
