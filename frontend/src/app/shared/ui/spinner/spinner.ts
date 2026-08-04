import { Component } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: true,
  template: `
    <div
      class="flex h-full items-center justify-center gap-2 p-8 font-display text-xs uppercase
        tracking-widest text-fg/50"
      role="status"
    >
      <span>Loading</span>
      <span class="animate-pulse" aria-hidden="true">&#9646;</span>
    </div>
  `,
})
export class Spinner {}
