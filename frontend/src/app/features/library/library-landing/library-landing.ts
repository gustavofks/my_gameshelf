import { Component, computed, inject } from '@angular/core';
import { LibraryStore } from '../library.store';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-library-landing',
  standalone: true,
  imports: [EmptyState],
  template: `
    @if (hasGames()) {
      <app-empty-state message="Pick a console from the left" />
    } @else {
      <app-empty-state message="Your library is empty" actionLabel="Scan now" actionLink="/scan" />
    }
  `,
})
export class LibraryLanding {
  store = inject(LibraryStore);

  readonly hasGames = computed(
    () => (this.store.platforms.value()?.filter((p) => p.gameCount > 0).length ?? 0) > 0,
  );
}
