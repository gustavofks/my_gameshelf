import { Routes } from '@angular/router';
import { LibraryPage } from './library-page/library-page';
import { ConsoleView } from './console-view/console-view';
import { LibraryLanding } from './library-landing/library-landing';

export const routes: Routes = [
  {
    path: '',
    component: LibraryPage,
    children: [
      { path: '', component: LibraryLanding },
      { path: ':platformSlug', component: ConsoleView },
    ],
  },
];
