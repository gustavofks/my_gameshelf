import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { routes as libraryRoutes } from './library.routes';
import { LibraryPage } from './library-page/library-page';
import { LibraryStore } from './library.store';

const emptyGameList = { total: 0, page: 1, pageSize: 50, items: [] };

// The store is provided by LibraryPage (the harness's routed component) and
// exposed publicly, so real navigation through the actual library routes
// exercises the store end to end.
describe('LibraryStore', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en', 'pt'], defaultLang: 'en' },
        }),
      ],
      providers: [
        provideRouter([{ path: 'library', children: libraryRoutes }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  async function navigate(url: string): Promise<LibraryStore> {
    const page = await harness.navigateByUrl(url, LibraryPage);
    TestBed.tick();
    return page.store;
  }

  it('derives a null platform at /library and requests games without a platform param', async () => {
    const store = await navigate('/library');

    expect(store.platform()).toBeNull();
    http.expectOne('/platforms').flush([]);
    const games = http.expectOne((r) => r.url === '/games');
    expect(games.request.params.has('platform')).toBe(false);
    games.flush(emptyGameList);
  });

  it('re-derives the platform when the child route swaps to /library/snes', async () => {
    const store = await navigate('/library');
    http.expectOne('/platforms').flush([]);
    http.expectOne((r) => r.url === '/games').flush(emptyGameList);

    await harness.navigateByUrl('/library/snes');
    TestBed.tick();

    expect(store.platform()).toBe('snes');
    const games = http.expectOne(
      (r) => r.url === '/games' && r.params.get('platform') === 'snes',
    );
    games.flush(emptyGameList);
  });

  it('derives search from the query params and sends both filters', async () => {
    const store = await navigate('/library/snes?search=metroid');

    expect(store.platform()).toBe('snes');
    expect(store.search()).toBe('metroid');
    http.expectOne('/platforms').flush([]);
    const games = http.expectOne(
      (r) =>
        r.url === '/games' &&
        r.params.get('platform') === 'snes' &&
        r.params.get('search') === 'metroid',
    );
    games.flush(emptyGameList);
  });
});
