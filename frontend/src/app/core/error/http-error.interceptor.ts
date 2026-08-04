import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../notification/notification.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);
  const transloco = inject(TranslocoService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      notify.error(messageFor(error, transloco));
      return throwError(() => error);
    }),
  );
};

function messageFor(error: HttpErrorResponse, transloco: TranslocoService): string {
  if (error.status === 0) return transloco.translate('errors.apiUnavailable');
  if (error.status === 409) return transloco.translate('errors.scanRunning');
  const serverMessage =
    typeof error.error === 'object' && error.error && 'message' in error.error
      ? String((error.error as { message: unknown }).message)
      : null;
  // Server-provided messages are backend text and intentionally not translated.
  if (error.status === 400 && serverMessage) return serverMessage;
  if (error.status >= 500) return transloco.translate('errors.unexpected');
  return serverMessage ?? transloco.translate('errors.requestFailed');
}
