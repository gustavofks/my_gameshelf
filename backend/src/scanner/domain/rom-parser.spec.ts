import { parseRomFilename } from './rom-parser';

const EXTENSIONS = ['.nes', '.sfc', '.smc', '.bin', '.iso'];

describe('parseRomFilename', () => {
  it('extracts title and region', () => {
    expect(parseRomFilename('Chrono Trigger (USA).sfc', EXTENSIONS)).toEqual({
      title: 'Chrono Trigger',
      region: 'USA',
      discNumber: null,
      revision: null,
      fallbackUsed: false,
    });
  });

  it('extracts the disc number', () => {
    expect(
      parseRomFilename('Final Fantasy VII (USA) (Disc 1).bin', EXTENSIONS),
    ).toEqual({
      title: 'Final Fantasy VII',
      region: 'USA',
      discNumber: 1,
      revision: null,
      fallbackUsed: false,
    });
  });

  it('ignores language tags and keeps apostrophes', () => {
    expect(
      parseRomFilename("Kirby's Fun Pak (Europe) (En,Fr,De).sfc", EXTENSIONS),
    ).toEqual({
      title: "Kirby's Fun Pak",
      region: 'EUR',
      discNumber: null,
      revision: null,
      fallbackUsed: false,
    });
  });

  it('extracts the revision and preserves a trailing article', () => {
    expect(
      parseRomFilename('Legend of Zelda, The (USA) (Rev A).nes', EXTENSIONS),
    ).toEqual({
      title: 'Legend of Zelda, The',
      region: 'USA',
      discNumber: null,
      revision: 'A',
      fallbackUsed: false,
    });
  });

  it('does not treat a dot inside the title as an extension', () => {
    expect(
      parseRomFilename('Super Mario Bros. 3 (USA).nes', EXTENSIONS),
    ).toEqual({
      title: 'Super Mario Bros. 3',
      region: 'USA',
      discNumber: null,
      revision: null,
      fallbackUsed: false,
    });
  });

  it('accepts short region codes', () => {
    expect(parseRomFilename('Super Metroid (J).sfc', EXTENSIONS)).toEqual({
      title: 'Super Metroid',
      region: 'JPN',
      discNumber: null,
      revision: null,
      fallbackUsed: false,
    });
  });

  it('handles bracket tags', () => {
    expect(parseRomFilename('Contra (USA) [!].nes', EXTENSIONS)).toEqual({
      title: 'Contra',
      region: 'USA',
      discNumber: null,
      revision: null,
      fallbackUsed: false,
    });
  });

  it('returns a null region when none is present', () => {
    expect(parseRomFilename('Unknown Homebrew.nes', EXTENSIONS)).toEqual({
      title: 'Unknown Homebrew',
      region: null,
      discNumber: null,
      revision: null,
      fallbackUsed: false,
    });
  });

  it('flags a fallback when the title would be empty', () => {
    expect(parseRomFilename('(USA).nes', EXTENSIONS)).toEqual({
      title: '(USA)',
      region: 'USA',
      discNumber: null,
      revision: null,
      fallbackUsed: true,
    });
  });

  // Cases taken verbatim from the real collection in C:/roms/ds.
  describe('real Nintendo DS filenames', () => {
    const DS = ['.nds'];

    it('strips a scene catalogue number and reads the short region code', () => {
      expect(
        parseRomFilename(
          '0102 - Nintendogs - Labrador & Friends (E)(Squirrels).nds',
          DS,
        ),
      ).toEqual({
        title: 'Nintendogs - Labrador & Friends',
        region: 'EUR',
        discNumber: null,
        revision: null,
        fallbackUsed: false,
      });
    });

    it('reads the EU region code and drops language and group tags', () => {
      expect(
        parseRomFilename(
          '3538 - Grand Theft Auto - Chinatown Wars (EU)(M5)(XenoPhobia).nds',
          DS,
        ),
      ).toEqual({
        title: 'Grand Theft Auto - Chinatown Wars',
        region: 'EUR',
        discNumber: null,
        revision: null,
        fallbackUsed: false,
      });
    });

    it('reads the US region code', () => {
      expect(
        parseRomFilename(
          '4273 - Pokemon Mystery Dungeon - Explorers of Sky (US)(XenoPhobia).nds',
          DS,
        ),
      ).toEqual({
        title: 'Pokemon Mystery Dungeon - Explorers of Sky',
        region: 'USA',
        discNumber: null,
        revision: null,
        fallbackUsed: false,
      });
    });

    it('takes the first region from a multi-region tag', () => {
      expect(
        parseRomFilename(
          'Pokemon - White Version (USA, Europe) (NDSi Enhanced).nds',
          DS,
        ),
      ).toEqual({
        title: 'Pokemon - White Version',
        region: 'USA',
        discNumber: null,
        revision: null,
        fallbackUsed: false,
      });
    });

    it('reads a numeric revision', () => {
      expect(
        parseRomFilename('Animal Crossing - Wild World (USA) (Rev 1).nds', DS),
      ).toEqual({
        title: 'Animal Crossing - Wild World',
        region: 'USA',
        discNumber: null,
        revision: '1',
        fallbackUsed: false,
      });
    });

    it('keeps a dot that belongs to the title', () => {
      expect(parseRomFilename('New Super Mario Bros. (USA).nds', DS)).toEqual({
        title: 'New Super Mario Bros.',
        region: 'USA',
        discNumber: null,
        revision: null,
        fallbackUsed: false,
      });
    });

    it('does not strip digits that are part of the title', () => {
      expect(parseRomFilename('Metal Slug 7 (USA).nds', DS)).toEqual({
        title: 'Metal Slug 7',
        region: 'USA',
        discNumber: null,
        revision: null,
        fallbackUsed: false,
      });
    });
  });
});
