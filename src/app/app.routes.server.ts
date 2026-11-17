import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Pages with no live data are built once, ahead of time.
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'how-it-works', renderMode: RenderMode.Prerender },
  { path: 'contact', renderMode: RenderMode.Prerender },
  // Everything else shows data from Supabase that depends on the moment and
  // on who is signed in, so it is rendered in the visitor's browser.
  { path: '**', renderMode: RenderMode.Client },
];
