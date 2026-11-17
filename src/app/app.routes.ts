import { Routes } from '@angular/router';
import { roleGuard } from './core/auth.service';

export const routes: Routes = [
  {
    path: '',
    title: 'FarmDirect: Fresh farm produce, straight to your door',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'crops',
    title: 'Crops: FarmDirect',
    loadComponent: () => import('./pages/crops/crops').then((m) => m.Crops),
  },
  {
    path: 'crops/:id',
    title: 'Crops: FarmDirect',
    loadComponent: () => import('./pages/crop-detail/crop-detail').then((m) => m.CropDetail),
  },
  {
    path: 'livestock',
    title: 'Livestock: FarmDirect',
    loadComponent: () => import('./pages/livestock/livestock').then((m) => m.Livestock),
  },
  {
    path: 'livestock/:id',
    title: 'Livestock: FarmDirect',
    loadComponent: () =>
      import('./pages/livestock-detail/livestock-detail').then((m) => m.LivestockDetail),
  },
  {
    path: 'basket',
    title: 'Your Basket: FarmDirect',
    loadComponent: () => import('./pages/basket/basket').then((m) => m.Basket),
  },
  {
    path: 'about',
    title: 'About Us: FarmDirect',
    loadComponent: () => import('./pages/about/about').then((m) => m.About),
  },
  {
    path: 'how-it-works',
    title: 'How It Works: FarmDirect',
    loadComponent: () => import('./pages/how-it-works/how-it-works').then((m) => m.HowItWorks),
  },
  // The blog was replaced by "How It Works"; keep old links working.
  { path: 'blog', redirectTo: 'how-it-works', pathMatch: 'full' },
  {
    path: 'contact',
    title: 'Contact Us: FarmDirect',
    loadComponent: () => import('./pages/contact/contact').then((m) => m.Contact),
  },
  {
    path: 'login',
    title: 'Sign in: FarmDirect',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'signup',
    title: 'Create an account: FarmDirect',
    data: { start: 'up' },
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'payment/callback',
    title: 'Payment: FarmDirect',
    loadComponent: () => import('./pages/payment/payment-callback').then((m) => m.PaymentCallback),
  },
  {
    path: 'account',
    title: 'My Account: FarmDirect',
    // "bare" hides the shop's header and footer: dashboards fill the screen (see app.ts).
    data: { bare: true },
    canActivate: [roleGuard('customer')],
    loadComponent: () => import('./pages/dashboard/customer').then((m) => m.CustomerDashboard),
  },
  {
    path: 'farmer',
    title: 'Farmer Dashboard: FarmDirect',
    data: { bare: true },
    canActivate: [roleGuard('farmer')],
    loadComponent: () => import('./pages/dashboard/farmer').then((m) => m.FarmerDashboard),
  },
  {
    path: 'admin',
    title: 'Admin Dashboard: FarmDirect',
    data: { bare: true },
    canActivate: [roleGuard('admin')],
    loadComponent: () => import('./pages/dashboard/admin').then((m) => m.AdminDashboard),
  },
  {
    path: '**',
    title: 'Page not found: FarmDirect',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
  },
];
