import { Injectable, signal } from '@angular/core';

export type ToastSeverity = 'success' | 'warning' | 'error';

export interface Toast {
  id: number;
  severity: ToastSeverity;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 1;
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(message: string) {
    this.push('success', message, 4000);
  }

  warning(message: string) {
    this.push('warning', message, 6000);
  }

  error(message: string) {
    this.push('error', message, 8000);
  }

  dismiss(id: number) {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(severity: ToastSeverity, message: string, ttl: number) {
    const id = this.nextId++;
    this._toasts.update((list) => [...list, { id, severity, message }]);
    setTimeout(() => this.dismiss(id), ttl);
  }
}
