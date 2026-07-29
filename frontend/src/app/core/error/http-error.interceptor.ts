import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../notification/notification.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      notify.error(messageFor(error));
      return throwError(() => error);
    }),
  );
};

function messageFor(error: HttpErrorResponse): string {
  if (error.status === 0) return 'API unavailable';
  if (error.status === 409) return 'A scan is already running';
  const serverMessage =
    typeof error.error === 'object' && error.error && 'message' in error.error
      ? String((error.error as { message: unknown }).message)
      : null;
  if (error.status === 400 && serverMessage) return serverMessage;
  if (error.status >= 500) return 'Unexpected error';
  return serverMessage ?? 'Request failed';
}
