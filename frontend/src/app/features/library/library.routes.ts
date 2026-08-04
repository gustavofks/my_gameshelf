import { Routes } from '@angular/router';
import { LibraryPage } from './library-page/library-page';
import { ConsoleView } from './console-view/console-view';

export const routes: Routes = [
  {
    path: '',
    component: LibraryPage,
    children: [
      { path: '', component: ConsoleView },
      { path: ':platformSlug', component: ConsoleView },
    ],
  },
];
