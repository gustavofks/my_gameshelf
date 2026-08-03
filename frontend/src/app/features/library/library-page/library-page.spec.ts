import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { LibraryPage } from './library-page';

describe('LibraryPage', () => {
  it('renders a toolbar with a Scan action', async () => {
    await TestBed.configureTestingModule({
      imports: [
        LibraryPage,
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en', 'pt'], defaultLang: 'en' },
        }),
      ],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(LibraryPage);
    fixture.detectChanges();
    const scanLink = (fixture.nativeElement as HTMLElement).querySelector('a[href="/scan"]');
    expect(scanLink).not.toBeNull();
  });
});
