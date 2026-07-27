import { Injectable, Logger } from '@nestjs/common';
import { IssueSeverity } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FilesystemAdapter, DiscoveredFile } from './infra/filesystem.adapter';
import { crc32File } from './infra/crc32';
import { parseRomFilename } from './domain/rom-parser';
import { detectPlatform } from './domain/platform-detector';
import {
  PLATFORMS,
  ALL_KNOWN_EXTENSIONS,
} from '../platforms/platform.registry';

const BATCH_SIZE = 200;

@Injectable()
export class ScannerRunner {
  private readonly logger = new Logger(ScannerRunner.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly filesystem: FilesystemAdapter,
  ) {}

  async run(scanJobId: string): Promise<void> {
    const startedAt = new Date();

    try {
      const job = await this.prisma.scanJob.update({
        where: { id: scanJobId },
        data: { status: 'RUNNING', startedAt },
      });

      const readable = await this.filesystem.isReadableDirectory(job.rootPath);
      if (!readable) {
        throw new Error(`Root path is not readable: ${job.rootPath}`);
      }

      const discovered = await this.filesystem.walk(job.rootPath);
      const candidates = this.selectCandidates(discovered);

      await this.prisma.scanJob.update({
        where: { id: scanJobId },
        data: { filesFound: candidates.length },
      });

      let processed = 0;
      for (let index = 0; index < candidates.length; index += BATCH_SIZE) {
        const batch = candidates.slice(index, index + BATCH_SIZE);
        for (const candidate of batch) {
          await this.persist(scanJobId, job.userId, candidate);
          processed += 1;
        }
        await this.prisma.scanJob.update({
          where: { id: scanJobId },
          data: { filesProcessed: processed },
        });
      }

      await this.prisma.game.updateMany({
        where: { userId: job.userId, lastSeenAt: { lt: startedAt } },
        data: { isMissing: true },
      });

      await this.prisma.scanJob.update({
        where: { id: scanJobId },
        data: { status: 'COMPLETED', finishedAt: new Date() },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Scan ${scanJobId} failed: ${message}`);
      await this.prisma.scanJob.update({
        where: { id: scanJobId },
        data: {
          status: 'FAILED',
          errorMessage: message,
          finishedAt: new Date(),
        },
      });
    }
  }

  private selectCandidates(
    discovered: DiscoveredFile[],
  ): Array<DiscoveredFile & { platformSlug: string }> {
    const candidates: Array<DiscoveredFile & { platformSlug: string }> = [];

    for (const file of discovered) {
      const detection = detectPlatform(file.extension, PLATFORMS);

      // Files whose extension no platform owns (cover art, saves, docs) are
      // simply ignored — there is no folder concept to flag them against.
      if (detection.kind === 'match') {
        candidates.push({ ...file, platformSlug: detection.platform.slug });
      }
    }

    return candidates;
  }

  private async persist(
    scanJobId: string,
    userId: string,
    file: DiscoveredFile & { platformSlug: string },
  ): Promise<void> {
    let checksum: string | null = null;
    try {
      checksum = await crc32File(file.absolutePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.addIssue(
        scanJobId,
        'ERROR',
        'UNREADABLE_FILE',
        file.relativePath,
        message,
      );
      return;
    }

    const parsed = parseRomFilename(file.filename, ALL_KNOWN_EXTENSIONS);

    if (parsed.fallbackUsed) {
      await this.addIssue(
        scanJobId,
        'WARNING',
        'PARSE_FAILED',
        file.relativePath,
        `Could not derive a title from "${file.filename}"; used the raw name.`,
      );
    }

    const platform = await this.prisma.platform.findUniqueOrThrow({
      where: { slug: file.platformSlug },
    });

    const data = {
      platformId: platform.id,
      title: parsed.title,
      region: parsed.region,
      fileSize: BigInt(file.size),
      crc32: checksum,
      discNumber: parsed.discNumber,
      revision: parsed.revision,
      lastSeenAt: new Date(),
      isMissing: false,
    };

    const byPath = await this.prisma.game.findUnique({
      where: { userId_filePath: { userId, filePath: file.relativePath } },
    });

    if (byPath) {
      await this.prisma.game.update({ where: { id: byPath.id }, data });
      return;
    }

    const byChecksum = await this.prisma.game.findFirst({
      where: { userId, crc32: checksum },
      orderBy: { createdAt: 'asc' },
    });

    if (byChecksum) {
      await this.prisma.game.update({
        where: { id: byChecksum.id },
        data: { ...data, filePath: file.relativePath },
      });
      return;
    }

    await this.prisma.game.create({
      data: { ...data, userId, filePath: file.relativePath },
    });
  }

  private async addIssue(
    scanJobId: string,
    severity: IssueSeverity,
    code: string,
    filePath: string | null,
    message: string,
  ): Promise<void> {
    await this.prisma.scanIssue.create({
      data: { scanJobId, severity, code, filePath, message },
    });
  }
}
