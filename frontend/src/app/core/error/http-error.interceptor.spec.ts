import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { httpErrorInterceptor } from './http-error.interceptor';
import { NotificationService } from '../notification/notification.service';

// TranslocoTestingModule is configured with empty langs, so translate(key)
// echoes the key itself — the assertions below check translation KEYS.
describe('httpErrorInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let notify: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en', 'pt'], defaultLang: 'en' },
        }),
      ],
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    notify = TestBed.inject(NotificationService);
  });

  afterEach(() => controller.verify());

  function request(): { caught: () => HttpErrorResponse | null } {
    let error: HttpErrorResponse | null = null;
    http.get('/x').subscribe({ error: (e: HttpErrorResponse) => (error = e) });
    return { caught: () => error };
  }

  function lastToast() {
    const toasts = notify.toasts();
    return toasts[toasts.length - 1];
  }

  it('toasts errors.apiUnavailable when the API is unreachable (status 0)', () => {
    const { caught } = request();
    controller.expectOne('/x').error(new ProgressEvent('error'), { status: 0 });
    expect(lastToast()).toMatchObject({ severity: 'error', message: 'errors.apiUnavailable' });
    expect(caught()?.status).toBe(0);
  });

  it('toasts errors.scanRunning on 409', () => {
    const { caught } = request();
    controller.expectOne('/x').flush(null, { status: 409, statusText: 'Conflict' });
    expect(lastToast()).toMatchObject({ severity: 'error', message: 'errors.scanRunning' });
    expect(caught()?.status).toBe(409);
  });

  it('shows the raw server message on 400 with a message body', () => {
    const { caught } = request();
    controller
      .expectOne('/x')
      .flush({ message: 'bad path' }, { status: 400, statusText: 'Bad Request' });
    expect(lastToast()).toMatchObject({ severity: 'error', message: 'bad path' });
    expect(caught()?.status).toBe(400);
  });

  it('toasts errors.unexpected on 500', () => {
    const { caught } = request();
    controller.expectOne('/x').flush(null, { status: 500, statusText: 'Server Error' });
    expect(lastToast()).toMatchObject({ severity: 'error', message: 'errors.unexpected' });
    expect(caught()?.status).toBe(500);
  });

  it('toasts errors.requestFailed on 404 without a body message', () => {
    const { caught } = request();
    controller.expectOne('/x').flush(null, { status: 404, statusText: 'Not Found' });
    expect(lastToast()).toMatchObject({ severity: 'error', message: 'errors.requestFailed' });
    expect(caught()?.status).toBe(404);
  });

  it('rethrows the original HttpErrorResponse to the subscriber', () => {
    const { caught } = request();
    controller.expectOne('/x').flush(null, { status: 409, statusText: 'Conflict' });
    expect(caught()).toBeInstanceOf(HttpErrorResponse);
  });
});
