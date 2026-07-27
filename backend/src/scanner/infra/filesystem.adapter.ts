import { Injectable } from '@nestjs/common';
import { readdir, stat, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join, relative, extname, posix, sep } from 'node:path';

export interface DiscoveredFile {
  relativePath: string;
  absolutePath: string;
  filename: string;
  extension: string;
  size: number;
}

@Injectable()
export class FilesystemAdapter {
  async isReadableDirectory(absolutePath: string): Promise<boolean> {
    try {
      await access(absolutePath, constants.R_OK);
      const stats = await stat(absolutePath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Returns every file under `rootPath` at any depth, including files that sit
   * directly in `rootPath`. The platform is decided later from each file's
   * extension, so the folder structure carries no meaning here.
   */
  async walk(rootPath: string): Promise<DiscoveredFile[]> {
    const entries = await readdir(rootPath, {
      withFileTypes: true,
      recursive: true,
    });
    const files: DiscoveredFile[] = [];

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      const absolutePath = join(entry.parentPath, entry.name);
      const relativePath = relative(rootPath, absolutePath);
      const stats = await stat(absolutePath);

      files.push({
        relativePath: relativePath.split(sep).join(posix.sep),
        absolutePath,
        filename: entry.name,
        extension: extname(entry.name).toLowerCase(),
        size: stats.size,
      });
    }

    return files;
  }
}
