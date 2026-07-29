import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { GamesApiService } from './games-api.service';

describe('GamesApiService', () => {
  let service: GamesApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GamesApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('builds the query string from platform and search', () => {
    service.list({ platform: 'snes', search: 'metroid' }).subscribe();
    const req = http.expectOne((r) => r.url === '/games' && r.params.get('platform') === 'snes');
    expect(req.request.params.get('search')).toBe('metroid');
    req.flush({ total: 0, page: 1, pageSize: 50, items: [] });
  });

  it('omits absent params', () => {
    service.list({}).subscribe();
    const req = http.expectOne('/games');
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ total: 0, page: 1, pageSize: 50, items: [] });
  });
});
