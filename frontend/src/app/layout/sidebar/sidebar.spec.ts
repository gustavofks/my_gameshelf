import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  it('renders a link for each section', async () => {
    await TestBed.configureTestingModule({
      imports: [
        Sidebar,
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en', 'pt'], defaultLang: 'en' },
        }),
      ],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(Sidebar);
    fixture.detectChanges();
    // RouterLink is a property binding (no DOM attribute); it reflects as href.
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('a[href]');
    expect(links.length).toBe(4);
  });
});
