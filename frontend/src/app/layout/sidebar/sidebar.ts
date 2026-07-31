import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="flex h-full w-52 shrink-0 flex-col border-r border-line bg-ink">
      <div class="px-5 pb-4 pt-6">
        <span class="font-display text-sm uppercase tracking-widest text-accent">
          Gameshelf
        </span>
      </div>
      <nav class="flex flex-col gap-1">
        @for (item of items; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="border-accent bg-panel text-accent"
            class="border-l-2 border-transparent px-5 py-2.5 font-display text-xs uppercase
              tracking-widest text-fg/70 transition-colors duration-150 ease-out
              hover:bg-panel hover:text-fg-bright"
          >
            {{ item.label }}
          </a>
        }
      </nav>
    </aside>
  `,
})
export class Sidebar {
  readonly items = [
    { path: '/library', label: 'Library' },
    { path: '/backlog', label: 'Backlog' },
    { path: '/organizer', label: 'Organizer' },
    { path: '/settings', label: 'Settings' },
  ];
}
