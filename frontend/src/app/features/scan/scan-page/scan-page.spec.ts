import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ScanPage } from './scan-page';

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
});
