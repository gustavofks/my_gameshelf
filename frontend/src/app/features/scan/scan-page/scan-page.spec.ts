import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ScanPage } from './scan-page';
import { NotificationService } from '../../../core/notification/notification.service';
import {
  FolderPickerService,
  WebFolderPickerService,
} from '../folder-picker/folder-picker.service';

describe('ScanPage', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ScanPage,
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en', 'pt'], defaultLang: 'en' },
        }),
      ],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: FolderPickerService, useClass: WebFolderPickerService },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('starts a scan and polls until COMPLETED', async () => {
    const fixture = TestBed.createComponent(ScanPage);
    fixture.detectChanges();
    fixture.componentInstance.start();

    http.expectOne('/scans').flush({ id: 'j1', status: 'PENDING' });
    // timer(0) schedules the first poll on a macrotask; wait one tick for it
    await new Promise((resolve) => setTimeout(resolve, 0));
    // first poll
    http.expectOne('/scans/j1').flush({
      id: 'j1',
      status: 'COMPLETED',
      filesFound: 1,
      filesProcessed: 1,
      errorMessage: null,
      issues: [],
    });

    expect(fixture.componentInstance.job()?.status).toBe('COMPLETED');
  });

  it('re-enables the scan button when starting the scan fails', () => {
    const fixture = TestBed.createComponent(ScanPage);
    fixture.detectChanges();
    fixture.componentInstance.start();
    expect(fixture.componentInstance.running()).toBe(true);

    http
      .expectOne('/scans')
      .flush(
        { message: 'bad path' },
        { status: 400, statusText: 'Bad Request' },
      );

    expect(fixture.componentInstance.running()).toBe(false);
  });

  it('raises a warning toast when the scan completes with issues', async () => {
    const fixture = TestBed.createComponent(ScanPage);
    fixture.detectChanges();
    fixture.componentInstance.start();

    http.expectOne('/scans').flush({ id: 'j1', status: 'PENDING' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    http.expectOne('/scans/j1').flush({
      id: 'j1',
      status: 'COMPLETED',
      filesFound: 2,
      filesProcessed: 2,
      errorMessage: null,
      issues: [
        {
          severity: 'WARNING',
          code: 'UNKNOWN_EXTENSION',
          filePath: 'roms/x.xyz',
          message: 'Unknown file extension',
        },
      ],
    });

    const toasts = TestBed.inject(NotificationService).toasts();
    expect(
      toasts.some(
        (t) =>
          t.severity === 'warning' && t.message === 'scan.completedIssues',
      ),
    ).toBe(true);
  });

  it('raises an error toast when the scan fails', async () => {
    const fixture = TestBed.createComponent(ScanPage);
    fixture.detectChanges();
    fixture.componentInstance.start();

    http.expectOne('/scans').flush({ id: 'j1', status: 'PENDING' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    http.expectOne('/scans/j1').flush({
      id: 'j1',
      status: 'FAILED',
      filesFound: 0,
      filesProcessed: 0,
      errorMessage: 'boom',
      issues: [],
    });

    const toasts = TestBed.inject(NotificationService).toasts();
    expect(
      toasts.some((t) => t.severity === 'error' && t.message === 'scan.failed'),
    ).toBe(true);
  });
});
