import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { GameCard } from './game-card';
import { Game } from '../../../core/api/api.types';

const game: Game = {
  id: '1',
  title: 'Chrono Trigger',
  region: 'USA',
  filePath: 'snes/ct.sfc',
  fileSize: '1',
  crc32: 'abc',
  discNumber: null,
  revision: null,
  isMissing: false,
  platform: { slug: 'snes', name: 'Super Nintendo' },
};

describe('GameCard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        GameCard,
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en', 'pt'], defaultLang: 'en' },
        }),
      ],
    }).compileComponents();
  });

  it('shows the title as the cover placeholder and the region', () => {
    const fixture = TestBed.createComponent(GameCard);
    fixture.componentRef.setInput('game', game);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Chrono Trigger');
    expect(text).toContain('USA');
  });

  it('marks a missing game', () => {
    const fixture = TestBed.createComponent(GameCard);
    fixture.componentRef.setInput('game', { ...game, isMissing: true });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const badge = el.querySelector('[data-missing]');
    expect(badge).not.toBeNull();
    // Empty test langs echo the key back, proving the label is translated.
    expect(badge?.textContent?.trim()).toBe('game.missing');
  });
});
