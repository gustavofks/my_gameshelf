import { Component, computed, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { LibraryStore } from '../library.store';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-library-landing',
  standalone: true,
  imports: [EmptyState, TranslocoDirective],
  template: `
    <ng-container *transloco="let t">
      @if (hasGames()) {
        <app-empty-state [message]="t('library.pick')" />
      } @else {
        <app-empty-state
          [message]="t('library.empty')"
          [actionLabel]="t('library.scan')"
          actionLink="/scan"
        />
      }
    </ng-container>
  `,
})
export class LibraryLanding {
  store = inject(LibraryStore);

  readonly hasGames = computed(
    () => (this.store.platforms.value()?.filter((p) => p.gameCount > 0).length ?? 0) > 0,
  );
}
