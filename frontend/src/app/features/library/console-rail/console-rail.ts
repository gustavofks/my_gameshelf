import { Component, computed, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { PlatformSummary } from '../../../core/api/api.types';

@Component({
  selector: 'app-console-rail',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslocoDirective],
  template: `
    <nav
      *transloco="let t"
      class="flex h-full w-56 shrink-0 flex-col gap-1 overflow-y-auto border-r border-line py-4"
    >
      <a
        routerLink="/library"
        routerLinkActive="border-accent bg-panel text-accent"
        [routerLinkActiveOptions]="{ exact: true }"
        class="border-l-2 border-transparent px-4 py-2.5 font-display text-sm uppercase
          tracking-widest text-fg/70 transition-colors duration-150 ease-out
          hover:bg-panel hover:text-fg-bright"
      >
        {{ t('library.all') }} <span class="text-fg/40">({{ totalGames() }})</span>
      </a>
      @for (p of withGames(); track p.slug) {
        <a
          [routerLink]="['/library', p.slug]"
          routerLinkActive="border-accent bg-panel text-accent"
          class="border-l-2 border-transparent px-4 py-2.5 font-display text-sm uppercase
            tracking-widest text-fg/70 transition-colors duration-150 ease-out
            hover:bg-panel hover:text-fg-bright"
        >
          {{ p.name }} <span class="text-fg/40">({{ p.gameCount }})</span>
        </a>
      }
    </nav>
  `,
})
export class ConsoleRail {
  platforms = input.required<PlatformSummary[]>();
  activeSlug = input<string | null>(null);
  readonly withGames = computed(() => this.platforms().filter((p) => p.gameCount > 0));
  readonly totalGames = computed(() =>
    this.platforms().reduce((sum, p) => sum + p.gameCount, 0),
  );
}
