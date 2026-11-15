import { Routes } from '@angular/router';
import { roleGuard } from './core/auth.service';

export const routes: Routes = [
  {
    path: '',
    title: 'FarmDirect — Fresh farm produce, straight to your door',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'crops',
    title: 'Crops — FarmDirect',
    loadComponent: () => import('./pages/crops/crops').then((m) => m.Crops),
  },
  {
    path: 'crops/:id',
    title: 'Crops — FarmDirect',
    loadComponent: () => import('./pages/crop-detail/crop-detail').then((m) => m.CropDetail),
  },
  {
    path: 'livestock',
    title: 'Livestock — FarmDirect',
    loadComponent: () => import('./pages/livestock/livestock').then((m) => m.Livestock),
  },
  {
    path: 'livestock/:id',
    title: 'Livestock — FarmDirect',
    loadComponent: () =>
      import('./pages/livestock-detail/livestock-detail').then((m) => m.LivestockDetail),
  },
  {
    path: 'basket',
    title: 'Your Basket — FarmDirect',
    loadComponent: () => import('./pages/basket/basket').then((m) => m.Basket),
  },
  {
    path: 'about',
    title: 'About Us — FarmDirect',
    loadComponent: () => import('./pages/about/about').then((m) => m.About),
  },
  {
    path: 'blog',
    title: 'Blog — FarmDirect',
    loadComponent: () => import('./pages/blog/blog').then((m) => m.Blog),
  },
  {
    path: 'login',
    title: 'Sign in — FarmDirect',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'account',
    title: 'My Account — FarmDirect',
    canActivate: [roleGuard('customer')],
    loadComponent: () => import('./pages/dashboard/customer').then((m) => m.CustomerDashboard),
  },
  {
    path: 'farmer',
    title: 'Farmer Dashboard — FarmDirect',
    canActivate: [roleGuard('farmer')],
    loadComponent: () => import('./pages/dashboard/farmer').then((m) => m.FarmerDashboard),
  },
  {
    path: 'admin',
    title: 'Admin Dashboard — FarmDirect',
    canActivate: [roleGuard('admin')],
    loadComponent: () => import('./pages/dashboard/admin').then((m) => m.AdminDashboard),
  },
  {
    path: '**',
    title: 'Page not found — FarmDirect',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
  },
];
