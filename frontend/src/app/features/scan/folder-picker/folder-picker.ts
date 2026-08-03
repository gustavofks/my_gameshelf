import { Component, inject, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { FsApiService } from '../../../core/api/fs-api.service';
import { DirectoryListing } from '../../../core/api/api.types';
import { FolderPickerService } from './folder-picker.service';

@Component({
  selector: 'app-folder-picker',
  standalone: true,
  imports: [TranslocoDirective],
  template: `
    <div
      *transloco="let t"
      class="mt-2 rounded border border-line bg-panel/60 p-4"
    >
      @if (listing(); as l) {
        <div class="flex items-center justify-between gap-3">
          <span class="truncate font-sans text-sm text-fg-bright">{{ l.path ?? '—' }}</span>
          <div class="flex shrink-0 gap-2">
            @if (l.parent) {
              <button
                type="button"
                data-up
                (click)="open(l.parent)"
                class="rounded border border-line px-3 py-1.5 font-display text-sm uppercase tracking-widest text-fg transition-colors duration-150 hover:bg-panel"
              >{{ t('scan.up') }}</button>
            }
            @if (l.path) {
              <button
                type="button"
                data-select
                (click)="picker.resolve(l.path)"
                class="rounded bg-accent px-3 py-1.5 font-display text-sm uppercase tracking-widest text-ink hover:brightness-110"
              >{{ t('scan.select') }}</button>
            }
          </div>
        </div>
        <ul class="mt-3 max-h-64 overflow-auto">
          @for (dir of l.dirs; track dir.path) {
            <li>
              <button
                type="button"
                data-dir
                (click)="open(dir.path)"
                class="w-full rounded px-3 py-2 text-left font-sans text-base text-fg transition-colors duration-150 hover:bg-panel hover:text-fg-bright"
              >{{ dir.name }}</button>
            </li>
          }
        </ul>
      } @else {
        <span class="font-sans text-sm text-fg/60">…</span>
      }
    </div>
  `,
})
export class FolderPicker {
  private api = inject(FsApiService);
  protected readonly picker = inject(FolderPickerService);
  readonly listing = signal<DirectoryListing | null>(null);

  constructor() {
    this.open();
  }

  open(path?: string) {
    this.api.directories(path).subscribe((l) => this.listing.set(l));
  }
}
