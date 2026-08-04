import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <p class="text-lg text-fg">{{ message() }}</p>
      @if (actionLabel()) {
        <a
          [routerLink]="actionLink()"
          class="rounded bg-accent px-5 py-2.5 font-display text-sm uppercase tracking-widest
            text-ink transition duration-150 ease-out hover:brightness-110"
        >
          {{ actionLabel() }}
        </a>
      }
    </div>
  `,
})
export class EmptyState {
  message = input.required<string>();
  actionLabel = input<string | null>(null);
  actionLink = input<string | null>(null);
}
