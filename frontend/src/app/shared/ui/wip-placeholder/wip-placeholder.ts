import { Component, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-wip-placeholder',
  standalone: true,
  imports: [TranslocoDirective],
  template: `
    <div
      class="flex h-full flex-col items-center justify-center gap-4 text-center"
      *transloco="let t"
    >
      <span class="font-display text-xs tracking-widest text-accent-dim" aria-hidden="true">
        &#9626;&#9626;&#9626;
      </span>
      <h1 class="font-display text-2xl uppercase tracking-widest text-fg-bright">
        {{ t(title()) }}
      </h1>
      <p class="text-sm text-fg/60">
        <span class="font-display text-xs uppercase tracking-widest text-accent">[</span>
        {{ t('wip.label') }}
        <span class="font-display text-xs uppercase tracking-widest text-accent">]</span>
      </p>
    </div>
  `,
})
export class WipPlaceholder {
  /** Transloco key of the page title, e.g. 'nav.backlog'. */
  title = input.required<string>();
}
