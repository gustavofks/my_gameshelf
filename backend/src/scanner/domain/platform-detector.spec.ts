import { detectPlatform } from './platform-detector';
import { PLATFORMS } from '../../platforms/platform.registry';

describe('detectPlatform', () => {
  it('matches a known extension to its platform', () => {
    const result = detectPlatform('.nds', PLATFORMS);
    expect(result).toEqual({
      kind: 'match',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- @types/jest types objectContaining() as `any`
      platform: expect.objectContaining({ slug: 'ds' }),
    });
  });

  it('is case insensitive on the extension', () => {
    const result = detectPlatform('.SFC', PLATFORMS);
    expect(result).toEqual({
      kind: 'match',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- @types/jest types objectContaining() as `any`
      platform: expect.objectContaining({ slug: 'snes' }),
    });
  });

  it('resolves a platform regardless of the folder a file sits in', () => {
    // The folder plays no part; a .gba is gba wherever it lives.
    expect(detectPlatform('.gba', PLATFORMS)).toEqual({
      kind: 'match',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- @types/jest types objectContaining() as `any`
      platform: expect.objectContaining({ slug: 'gba' }),
    });
  });

  it('reports an extension no platform owns', () => {
    expect(detectPlatform('.jpg', PLATFORMS)).toEqual({
      kind: 'unknown-extension',
    });
  });

  it('treats an empty extension as unknown', () => {
    expect(detectPlatform('', PLATFORMS)).toEqual({
      kind: 'unknown-extension',
    });
  });
});
