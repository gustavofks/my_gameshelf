import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { FsApiService } from './fs-api.service';

describe('FsApiService', () => {
  let service: FsApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FsApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('GETs /fs/directories without params when no path is given', () => {
    service.directories().subscribe();
    const req = http.expectOne('/fs/directories');
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ path: null, parent: null, dirs: [] });
  });

  it('passes the path as a query param', () => {
    service.directories('C:/roms').subscribe();
    const req = http.expectOne(
      (r) => r.url === '/fs/directories' && r.params.get('path') === 'C:/roms',
    );
    req.flush({ path: 'C:/roms', parent: 'C:/', dirs: [] });
  });
});
