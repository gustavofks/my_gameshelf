import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  template: `
    <div class="relative flex h-screen bg-ink text-fg">
      <div
        class="pointer-events-none absolute inset-0"
        style="background: radial-gradient(80rem 40rem at 50% 0%, #1a1f3a 0%, transparent 70%)"
        aria-hidden="true"
      ></div>
      <app-sidebar class="relative" />
      <main class="relative flex-1 overflow-auto"><router-outlet /></main>
      <div
        class="pointer-events-none fixed inset-0 z-50 opacity-30"
        style="background: repeating-linear-gradient(0deg, #0000 0 2px, #00000026 2px 3px)"
        aria-hidden="true"
      ></div>
    </div>
  `,
})
export class Shell {}
