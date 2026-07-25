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
    await mkdir(join(root, 'nes'), { recursive: true });
    await writeFile(join(root, 'snes', 'Chrono Trigger (USA).sfc'), 'rom');
    await writeFile(join(root, 'snes', 'cover.jpg'), 'image');
    await writeFile(join(root, 'nes', 'Contra (USA).nes'), 'rom');
    await writeFile(join(root, 'readme.txt'), 'loose file at root');
  });

  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('lists every file inside platform folders', async () => {
    const files = await adapter.walk(root);
    const paths = files.map((file) => file.relativePath).sort();
    expect(paths).toEqual([
      'nes/Contra (USA).nes',
      'snes/Chrono Trigger (USA).sfc',
      'snes/cover.jpg',
    ]);
  });

  it('reports folder, filename, extension and size', async () => {
    const files = await adapter.walk(root);
    const rom = files.find((file) => file.filename === 'Contra (USA).nes');
    expect(rom).toMatchObject({
      folder: 'nes',
      filename: 'Contra (USA).nes',
      extension: '.nes',
      size: 3,
    });
  });

  it('reports whether a path exists and is readable', async () => {
    await expect(adapter.isReadableDirectory(root)).resolves.toBe(true);
    await expect(
      adapter.isReadableDirectory(join(root, 'does-not-exist')),
    ).resolves.toBe(false);
  });
});
