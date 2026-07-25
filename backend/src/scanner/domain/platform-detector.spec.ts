import { detectPlatform } from './platform-detector';
import { PLATFORMS } from '../../platforms/platform.registry';

describe('detectPlatform', () => {
  it('matches a known folder with a matching extension', () => {
    const result = detectPlatform('snes', '.sfc', PLATFORMS);
    expect(result).toEqual({
      kind: 'match',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- @types/jest types objectContaining() as `any`
      platform: expect.objectContaining({ slug: 'snes' }),
    });
  });

  it('is case insensitive on folder and extension', () => {
    const result = detectPlatform('SNES', '.SFC', PLATFORMS);
    expect(result).toEqual({
      kind: 'match',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- @types/jest types objectContaining() as `any`
      platform: expect.objectContaining({ slug: 'snes' }),
    });
  });

  it('reports an unknown platform folder', () => {
    expect(detectPlatform('dreamcast', '.cdi', PLATFORMS)).toEqual({
      kind: 'unknown-platform',
    });
  });

  it('reports an extension that does not belong to the folder', () => {
    expect(detectPlatform('snes', '.jpg', PLATFORMS)).toEqual({
      kind: 'ignored-extension',
    });
  });
});
