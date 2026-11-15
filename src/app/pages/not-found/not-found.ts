import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="section">
      <div class="container">
        <div class="empty">
          <h2>Page not found</h2>
          <p class="muted">That page doesn't exist or has moved.</p>
          <a routerLink="/" class="btn btn--primary">Back to Home</a>
        </div>
      </div>
    </section>
  `,
})
export class NotFound {}
