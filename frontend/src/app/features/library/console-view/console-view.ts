import { Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { LibraryStore } from '../library.store';
import { GameGrid } from '../game-grid/game-grid';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { Spinner } from '../../../shared/ui/spinner/spinner';

@Component({
  selector: 'app-console-view',
  standalone: true,
  imports: [GameGrid, EmptyState, Spinner, TranslocoDirective],
  template: `
    <ng-container *transloco="let t">
      @if (store.games.isLoading()) {
        <app-spinner />
      } @else if (store.games.error()) {
        <app-empty-state [message]="t('library.failed')" />
      } @else if (store.games.value(); as list) {
        @if (list.items.length > 0) {
          <app-game-grid [games]="list.items" />
        } @else {
          <app-empty-state
            [message]="t('library.noGames')"
            [actionLabel]="t('library.scan')"
            actionLink="/scan"
          />
        }
      }
    </ng-container>
  `,
})
export class ConsoleView {
  store = inject(LibraryStore);
}
