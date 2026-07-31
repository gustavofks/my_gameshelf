import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'library' },
  {
    path: 'library',
    loadChildren: () =>
      import('./features/library/library.routes').then((m) => m.routes),
  },
  {
    path: 'scan',
    loadComponent: () =>
      import('./features/scan/scan-page/scan-page').then((m) => m.ScanPage),
  },
  {
    path: 'backlog',
    loadComponent: () =>
      import('./features/backlog/backlog-page/backlog-page').then(
        (m) => m.BacklogPage,
      ),
  },
  {
    path: 'organizer',
    loadComponent: () =>
      import('./features/organizer/organizer-page/organizer-page').then(
        (m) => m.OrganizerPage,
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings-page/settings-page').then(
        (m) => m.SettingsPage,
      ),
  },
  { path: '**', redirectTo: 'library' },
];
