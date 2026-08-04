import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Dirent } from 'node:fs';
import { access, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

export interface DirectoryListing {
  path: string | null;
  parent: string | null;
  dirs: Array<{ name: string; path: string }>;
}

@Injectable()
export class FsService {
  constructor(private readonly config: ConfigService) {}

  async listDirectories(rawPath?: string): Promise<DirectoryListing> {
    if (!rawPath) {
      const configured = this.config.get<string>('ROMS_ROOT_PATH');
      if (configured && (await this.isReadable(configured))) {
        return this.listing(configured);
      }
      return { path: null, parent: null, dirs: await this.driveRoots() };
    }
    return this.listing(rawPath);
  }

  private async listing(dir: string): Promise<DirectoryListing> {
    const abs = resolve(dir);
    let entries: Dirent[];
    try {
      entries = await readdir(abs, { withFileTypes: true });
    } catch {
      throw new BadRequestException(`Cannot read directory: ${abs}`);
    }
    const dirs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({ name: entry.name, path: join(abs, entry.name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const parent = dirname(abs);
    return { path: abs, parent: parent === abs ? null : parent, dirs };
  }

  private async isReadable(dir: string): Promise<boolean> {
    try {
      await access(dir);
      return true;
    } catch {
      return false;
    }
  }

  private async driveRoots(): Promise<Array<{ name: string; path: string }>> {
    if (process.platform !== 'win32') {
      return [{ name: '/', path: '/' }];
    }
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const checks = await Promise.all(
      letters.map(async (letter) => {
        const drive = `${letter}:\\`;
        return (await this.isReadable(drive))
          ? { name: drive, path: drive }
          : null;
      }),
    );
    return checks.filter(
      (drive): drive is { name: string; path: string } => drive !== null,
    );
  }
}
