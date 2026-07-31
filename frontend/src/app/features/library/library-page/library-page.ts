import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LibraryStore } from '../library.store';
import { ConsoleRail } from '../console-rail/console-rail';

@Component({
  selector: 'app-library-page',
  standalone: true,
  imports: [RouterOutlet, ConsoleRail],
  providers: [LibraryStore],
  template: `
    <div class="flex h-full">
      @if (store.platforms.value(); as platforms) {
        <app-console-rail [platforms]="platforms" [activeSlug]="store.platform()" />
      }
      <div class="flex-1 overflow-auto"><router-outlet /></div>
    </div>
  `,
})
export class LibraryPage {
  store = inject(LibraryStore);
}
