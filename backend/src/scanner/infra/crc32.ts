import { createReadStream } from 'node:fs';
import { crc32 } from 'node:zlib';

const CHUNK_SIZE = 1024 * 1024;

export async function crc32File(absolutePath: string): Promise<string> {
  let checksum = 0;
  const stream = createReadStream(absolutePath, { highWaterMark: CHUNK_SIZE });

  for await (const chunk of stream) {
    checksum = crc32(chunk as Buffer, checksum);
  }

  return checksum.toString(16).padStart(8, '0');
}
