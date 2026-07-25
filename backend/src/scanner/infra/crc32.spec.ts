import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crc32File } from './crc32';

describe('crc32File', () => {
  let directory: string;

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'crc32-'));
  });

  afterAll(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('computes the checksum of a small file', async () => {
    const file = join(directory, 'small.bin');
    await writeFile(file, 'abc');
    await expect(crc32File(file)).resolves.toBe('352441c2');
  });

  it('pads the checksum to eight hex characters', async () => {
    const file = join(directory, 'padded.bin');
    await writeFile(file, Buffer.from([0x00]));
    const checksum = await crc32File(file);
    expect(checksum).toHaveLength(8);
  });

  it('produces the same checksum across chunk boundaries', async () => {
    const file = join(directory, 'large.bin');
    await writeFile(file, Buffer.alloc(3 * 1024 * 1024, 0x41));
    const first = await crc32File(file);
    const second = await crc32File(file);
    expect(first).toBe(second);
  });
});
