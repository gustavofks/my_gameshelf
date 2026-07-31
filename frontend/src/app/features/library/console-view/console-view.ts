import { Component, inject } from '@angular/core';
import { LibraryStore } from '../library.store';
import { GameGrid } from '../game-grid/game-grid';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { Spinner } from '../../../shared/ui/spinner/spinner';

@Component({
  selector: 'app-console-view',
  standalone: true,
  imports: [GameGrid, EmptyState, Spinner],
  template: `
    @if (store.games.isLoading()) {
      <app-spinner />
    } @else if (store.games.error()) {
      <app-empty-state message="Failed to load games" />
    } @else if (store.games.value(); as list) {
      @if (list.items.length > 0) {
        <app-game-grid [games]="list.items" />
      } @else {
        <app-empty-state message="No games here yet" actionLabel="Scan now" actionLink="/scan" />
      }
    }
  `,
})
export class ConsoleView {
  store = inject(LibraryStore);
}
