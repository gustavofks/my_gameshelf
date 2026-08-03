import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, switchMap, takeWhile, timer } from 'rxjs';
import { ScanApiService } from '../../../core/api/scan-api.service';
import { ScanJob } from '../../../core/api/api.types';
import { TranslocoDirective } from '@jsverse/transloco';
import { ScanProgress } from '../scan-progress/scan-progress';
import { ScanIssues } from '../scan-issues/scan-issues';

@Component({
  selector: 'app-scan-page',
  standalone: true,
  imports: [ScanProgress, ScanIssues, TranslocoDirective],
  template: `
    <div class="mx-auto max-w-3xl p-6" *transloco="let t">
      <h1 class="font-display text-2xl uppercase tracking-widest text-accent">
        {{ t('scan.title') }}
      </h1>
      <p class="mb-6 mt-1 font-sans text-base text-fg/60">
        {{ t('scan.subtitle') }}
      </p>

      <div class="mb-4 flex gap-2">
        <input
          #path
          [placeholder]="t('scan.folder')"
          class="min-w-0 flex-1 rounded border border-line bg-panel px-3 py-2.5 font-sans text-base text-fg placeholder:text-fg/40 focus:border-accent focus-visible:outline focus-visible:outline-accent"
        />
        <button
          (click)="start(path.value)"
          [disabled]="running()"
          class="rounded bg-accent px-5 py-2.5 font-display text-sm uppercase tracking-widest text-ink hover:brightness-110 disabled:opacity-50"
        >
          {{ t('scan.action') }}
        </button>
      </div>

      @if (job(); as j) {
        <app-scan-progress
          [found]="j.filesFound"
          [processed]="j.filesProcessed"
          [status]="j.status"
        />
        @if (j.status === 'FAILED') {
          <p class="mt-3 font-sans text-sm text-danger">{{ j.errorMessage }}</p>
        }
        <app-scan-issues [issues]="j.issues" />
      }
    </div>
  `,
})
export class ScanPage {
  private api = inject(ScanApiService);
  private destroyRef = inject(DestroyRef);
  readonly job = signal<ScanJob | null>(null);
  readonly running = signal(false);
  private poll?: Subscription;

  start(rootPath?: string) {
    if (this.running()) return;
    this.running.set(true);
    this.api.start(rootPath?.trim() || undefined).subscribe((created) => {
      this.pollUntilDone(created.id);
    });
  }

  private pollUntilDone(id: string) {
    this.poll?.unsubscribe();
    this.poll = timer(0, 1000)
      .pipe(
        switchMap(() => this.api.status(id)),
        takeWhile((j) => j.status === 'PENDING' || j.status === 'RUNNING', true),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((j) => {
        this.job.set(j);
        if (j.status === 'COMPLETED' || j.status === 'FAILED') {
          this.running.set(false);
        }
      });
  }
}
