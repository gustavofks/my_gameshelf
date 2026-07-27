import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FilesystemAdapter } from './filesystem.adapter';

describe('FilesystemAdapter', () => {
  let root: string;
  const adapter = new FilesystemAdapter();

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'roms-'));
    await mkdir(join(root, 'snes'), { recursive: true });
    await mkdir(join(root, 'handhelds', 'gba'), { recursive: true });
    await writeFile(join(root, 'snes', 'Chrono Trigger (USA).sfc'), 'rom');
    await writeFile(join(root, 'snes', 'cover.jpg'), 'image');
    await writeFile(join(root, 'handhelds', 'gba', 'Metroid (USA).gba'), 'rom');
    await writeFile(join(root, 'loose (USA).nds'), 'a rom at the root');
    await writeFile(join(root, 'readme.txt'), 'loose non-rom at root');
  });

  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('returns every file at any depth, including the root level', async () => {
    const files = await adapter.walk(root);
    const paths = files.map((file) => file.relativePath).sort();
    expect(paths).toEqual([
      'handhelds/gba/Metroid (USA).gba',
      'loose (USA).nds',
      'readme.txt',
      'snes/Chrono Trigger (USA).sfc',
      'snes/cover.jpg',
    ]);
  });

  it('reports filename, extension and size for each file', async () => {
    const files = await adapter.walk(root);
    const rom = files.find((file) => file.filename === 'Metroid (USA).gba');
    expect(rom).toMatchObject({
      relativePath: 'handhelds/gba/Metroid (USA).gba',
      filename: 'Metroid (USA).gba',
      extension: '.gba',
      size: 3,
    });
  });

  it('normalizes the relative path with forward slashes', async () => {
    const files = await adapter.walk(root);
    const nested = files.find((file) => file.filename === 'Metroid (USA).gba');
    expect(nested?.relativePath).not.toContain('\\');
  });

  it('reports whether a path exists and is readable', async () => {
    await expect(adapter.isReadableDirectory(root)).resolves.toBe(true);
    await expect(
      adapter.isReadableDirectory(join(root, 'does-not-exist')),
    ).resolves.toBe(false);
  });
});
