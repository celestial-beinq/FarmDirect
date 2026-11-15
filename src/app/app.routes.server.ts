import { RenderMode, ServerRoute } from '@angular/ssr';
import { ANIMALS, CROPS } from './core/data';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'crops/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => CROPS.map((c) => ({ id: c.id })),
  },
  {
    path: 'livestock/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => ANIMALS.map((a) => ({ id: a.id })),
  },
  // The basket depends on what is saved in this visitor's browser.
  { path: 'basket', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Prerender },
];
