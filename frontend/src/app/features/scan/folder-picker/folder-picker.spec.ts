import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { FolderPicker } from './folder-picker';
import {
  FolderPickerService,
  WebFolderPickerService,
} from './folder-picker.service';

const transloco = () =>
  TranslocoTestingModule.forRoot({
    langs: { en: {} },
    translocoConfig: { availableLangs: ['en', 'pt'], defaultLang: 'en' },
  });

describe('FolderPicker', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolderPicker, transloco()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: FolderPickerService, useClass: WebFolderPickerService },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the default listing on init and renders the directories', () => {
    const fixture = TestBed.createComponent(FolderPicker);
    fixture.detectChanges();
    http.expectOne('/fs/directories').flush({
      path: 'C:\\roms',
      parent: 'C:\\',
      dirs: [{ name: 'snes', path: 'C:\\roms\\snes' }],
    });
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('C:\\roms');
    expect(text).toContain('snes');
  });

  it('navigates into a directory on click', () => {
    const fixture = TestBed.createComponent(FolderPicker);
    fixture.detectChanges();
    http.expectOne('/fs/directories').flush({
      path: 'C:\\roms',
      parent: 'C:\\',
      dirs: [{ name: 'snes', path: 'C:\\roms\\snes' }],
    });
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-dir]')!
      .click();
    http
      .expectOne(
        (r) => r.url === '/fs/directories' && r.params.get('path') === 'C:\\roms\\snes',
      )
      .flush({ path: 'C:\\roms\\snes', parent: 'C:\\roms', dirs: [] });
  });

  it('reports the selected path through the picker service', () => {
    const service = TestBed.inject(FolderPickerService);
    const pending = service.pick();
    const fixture = TestBed.createComponent(FolderPicker);
    fixture.detectChanges();
    http.expectOne('/fs/directories').flush({
      path: 'C:\\roms',
      parent: 'C:\\',
      dirs: [],
    });
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-select]')!
      .click();
    return expect(pending).resolves.toBe('C:\\roms');
  });
});
