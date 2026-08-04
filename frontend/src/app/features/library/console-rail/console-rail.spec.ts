import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ConsoleRail } from './console-rail';
import { PlatformSummary } from '../../../core/api/api.types';

const platforms: PlatformSummary[] = [
  { slug: 'snes', name: 'Super Nintendo', gameCount: 3 },
  { slug: 'nes', name: 'NES', gameCount: 0 },
];

describe('ConsoleRail', () => {
  it('lists only platforms that have games', async () => {
    await TestBed.configureTestingModule({
      imports: [
        ConsoleRail,
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en', 'pt'], defaultLang: 'en' },
        }),
      ],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(ConsoleRail);
    fixture.componentRef.setInput('platforms', platforms);
    fixture.componentRef.setInput('activeSlug', null);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Super Nintendo');
    expect(text).not.toContain('NES');
  });

  it('renders the All entry first, linking to /library with the total count', async () => {
    await TestBed.configureTestingModule({
      imports: [
        ConsoleRail,
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en', 'pt'], defaultLang: 'en' },
        }),
      ],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(ConsoleRail);
    fixture.componentRef.setInput('platforms', platforms);
    fixture.componentRef.setInput('activeSlug', null);
    fixture.detectChanges();
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('a[href]');
    expect(links[0].getAttribute('href')).toBe('/library');
    expect(links[0].textContent).toContain('(3)');
  });
});
