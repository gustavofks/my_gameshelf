import { Component, input } from '@angular/core';

@Component({
  selector: 'app-wip-placeholder',
  standalone: true,
  template: `
    <div class="flex h-full flex-col items-center justify-center gap-4 text-center">
      <span class="font-display text-xs tracking-widest text-accent-dim" aria-hidden="true">
        &#9626;&#9626;&#9626;
      </span>
      <h1 class="font-display text-2xl uppercase tracking-widest text-fg-bright">
        {{ title() }}
      </h1>
      <p class="text-sm text-fg/60">
        <span class="font-display text-xs uppercase tracking-widest text-accent">[</span>
        Work in progress
        <span class="font-display text-xs uppercase tracking-widest text-accent">]</span>
      </p>
    </div>
  `,
})
export class WipPlaceholder {
  title = input.required<string>();
}
