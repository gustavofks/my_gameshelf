import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-scan-progress',
  standalone: true,
  template: `
    <div class="mb-2 flex items-center justify-between font-display text-xs uppercase tracking-widest">
      <span
        [class.text-fg]="!done()"
        [class.text-ok]="status() === 'COMPLETED'"
        [class.text-danger]="status() === 'FAILED'"
        >{{ status() }}</span
      >
      <span class="text-fg">{{ processed() }}/{{ found() }}</span>
    </div>
    <div class="h-2 overflow-hidden rounded bg-panel border border-line">
      <div
        data-bar
        class="h-full rounded transition-[width] duration-300"
        [class.bg-accent]="!done()"
        [class.bg-ok]="status() === 'COMPLETED'"
        [class.bg-danger]="status() === 'FAILED'"
        [style.width.%]="percent()"
      ></div>
    </div>
  `,
})
export class ScanProgress {
  found = input.required<number>();
  processed = input.required<number>();
  status = input.required<string>();

  percent = computed(() =>
    this.found() > 0 ? Math.round((this.processed() / this.found()) * 100) : 0,
  );

  done = computed(() => this.status() === 'COMPLETED' || this.status() === 'FAILED');
}
