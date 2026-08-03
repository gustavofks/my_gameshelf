import { Component, input } from '@angular/core';
import { Game } from '../../../core/api/api.types';
import { GameCard } from '../game-card/game-card';

@Component({
  selector: 'app-game-grid',
  standalone: true,
  imports: [GameCard],
  template: `
    <div class="grid gap-4 p-6" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))">
      @for (game of games(); track game.id) {
        <div class="card-enter" [style.--i]="$index">
          <app-game-card [game]="game" />
        </div>
      }
    </div>
  `,
})
export class GameGrid {
  games = input.required<Game[]>();
}
