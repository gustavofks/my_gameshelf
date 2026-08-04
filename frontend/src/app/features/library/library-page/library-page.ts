import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { LibraryStore } from '../library.store';
import { ConsoleRail } from '../console-rail/console-rail';

@Component({
  selector: 'app-library-page',
  standalone: true,
  imports: [RouterLink, RouterOutlet, TranslocoDirective, ConsoleRail],
  providers: [LibraryStore],
  template: `
    <div class="flex h-full">
      @if (store.platforms.value(); as platforms) {
        <app-console-rail [platforms]="platforms" [activeSlug]="store.platform()" />
      }
      <div class="flex min-w-0 flex-1 flex-col">
        <header
          *transloco="let t"
          class="flex items-center justify-between border-b border-line px-6 py-4"
        >
          <h1 class="font-display text-xl uppercase tracking-widest text-fg-bright">
            {{ t('nav.library') }}
          </h1>
          <a
            routerLink="/scan"
            class="rounded bg-accent px-5 py-2.5 font-display text-sm uppercase
              tracking-widest text-ink transition-colors duration-150 ease-out
              hover:brightness-110"
          >
            {{ t('scan.action') }}
          </a>
        </header>
        <div class="min-h-0 flex-1 overflow-auto"><router-outlet /></div>
      </div>
    </div>
  `,
})
export class LibraryPage {
  store = inject(LibraryStore);
}
