import { Injectable } from '@nestjs/common';
import { readdir, stat, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join, relative, extname, posix, sep } from 'node:path';

export interface DiscoveredFile {
  relativePath: string;
  absolutePath: string;
  folder: string;
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

  async walk(rootPath: string): Promise<DiscoveredFile[]> {
    const folders = await readdir(rootPath, { withFileTypes: true });
    const files: DiscoveredFile[] = [];

    for (const folder of folders) {
      if (!folder.isDirectory()) {
        continue;
      }

      const folderPath = join(rootPath, folder.name);
      const entries = await readdir(folderPath, {
        withFileTypes: true,
        recursive: true,
      });

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
          folder: folder.name,
          filename: entry.name,
          extension: extname(entry.name).toLowerCase(),
          size: stats.size,
        });
      }
    }

    return files;
  }
}
