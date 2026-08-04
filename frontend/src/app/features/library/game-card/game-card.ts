import { Component, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { Game } from '../../../core/api/api.types';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [TranslocoDirective],
  template: `
    <article
      *transloco="let t"
      class="group overflow-hidden rounded-lg border border-line bg-panel
        transition duration-150 ease-out hover:-translate-y-0.5 hover:border-accent/60
        hover:shadow-[0_0_0_1px_var(--color-accent),0_8px_24px_#00000066]"
    >
      <div
        class="flex aspect-[3/4] items-center justify-center p-4 text-center"
        [class.opacity-40]="game().isMissing"
      >
        <span
          class="break-words font-display text-base uppercase leading-relaxed tracking-widest
            text-fg-bright"
        >
          {{ game().title }}
        </span>
      </div>
      <footer
        class="flex items-center gap-2 border-t border-line px-2.5 py-1.5 text-sm
          text-fg/60"
      >
        <span>{{ game().region ?? '—' }}</span>
        @if (game().discNumber) {
          <span>{{ t('game.disc') }} {{ game().discNumber }}</span>
        }
        @if (game().isMissing) {
          <span
            data-missing
            class="ml-auto font-display text-[0.6rem] uppercase tracking-widest text-danger"
          >
            {{ t('game.missing') }}
          </span>
        }
      </footer>
    </article>
  `,
})
export class GameCard {
  game = input.required<Game>();
}
