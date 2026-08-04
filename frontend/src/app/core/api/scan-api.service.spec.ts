import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ScanApiService } from './scan-api.service';

describe('ScanApiService', () => {
  let service: ScanApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ScanApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('POSTs /scans with the root path in the body', () => {
    service.start('C:/roms').subscribe();
    const req = http.expectOne('/scans');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ rootPath: 'C:/roms' });
    req.flush({ id: 'x', status: 'PENDING' });
  });

  it('POSTs an empty body when no root path is given', () => {
    service.start().subscribe();
    const req = http.expectOne('/scans');
    expect(req.request.body).toEqual({});
    req.flush({ id: 'x', status: 'PENDING' });
  });

  it('GETs a scan status by id', () => {
    service.status('abc').subscribe();
    http.expectOne('/scans/abc').flush({});
  });
});
