import { Component, inject } from '@angular/core';
import { NotificationService, ToastSeverity } from '../../core/notification/notification.service';

const SEVERITY_CLASS: Record<ToastSeverity, string> = {
  success: 'border-l-ok',
  warning: 'border-l-warn',
  error: 'border-l-danger',
};

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="fixed bottom-4 right-4 z-60 flex flex-col gap-2" aria-live="polite">
      @for (toast of notify.toasts(); track toast.id) {
        <button
          type="button"
          role="status"
          (click)="notify.dismiss(toast.id)"
          class="card-enter max-w-xs cursor-pointer rounded border border-line border-l-3 bg-panel px-4 py-3 text-left font-sans text-sm text-fg-bright shadow-lg hover:brightness-125"
          [class]="severityClass[toast.severity]"
        >
          {{ toast.message }}
        </button>
      }
    </div>
  `,
})
export class ToastContainer {
  notify = inject(NotificationService);
  protected readonly severityClass = SEVERITY_CLASS;
}
