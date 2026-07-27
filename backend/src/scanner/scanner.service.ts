import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, type ScanJob } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ScannerRunner } from './scanner.runner';
import { FilesystemAdapter } from './infra/filesystem.adapter';

@Injectable()
export class ScannerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ScannerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly runner: ScannerRunner,
    private readonly filesystem: FilesystemAdapter,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.reconcileOrphanedJobs();
  }

  private get userId(): string {
    return this.config.getOrThrow<string>('DEFAULT_USER_ID');
  }

  async reconcileOrphanedJobs(): Promise<void> {
    const { count } = await this.prisma.scanJob.updateMany({
      where: { status: { in: ['PENDING', 'RUNNING'] } },
      data: {
        status: 'FAILED',
        errorMessage: 'Scan was interrupted by a process restart.',
        finishedAt: new Date(),
      },
    });

    if (count > 0) {
      this.logger.warn(`Reconciled ${count} orphaned scan job(s).`);
    }
  }

  async start(rootPathOverride?: string) {
    const active = await this.prisma.scanJob.findFirst({
      where: { userId: this.userId, status: { in: ['PENDING', 'RUNNING'] } },
    });

    if (active) {
      throw new ConflictException('A scan is already running.');
    }

    const rootPath =
      rootPathOverride?.trim() ||
      this.config.getOrThrow<string>('ROMS_ROOT_PATH');
    const readable = await this.filesystem.isReadableDirectory(rootPath);

    if (!readable) {
      throw new BadRequestException(`Root path is not readable: ${rootPath}`);
    }

    let job: ScanJob;
    try {
      job = await this.prisma.scanJob.create({
        data: { userId: this.userId, rootPath },
      });
    } catch (error) {
      // The pre-check above is not atomic; the partial unique index
      // ScanJob_one_active_per_user is the backstop. A racing request that
      // slipped past the pre-check lands here as a P2002 — surface it as 409.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A scan is already running.');
      }
      throw error;
    }

    void this.runner.run(job.id);

    return { id: job.id, status: job.status };
  }

  async status(id: string) {
    const job = await this.prisma.scanJob.findUnique({
      where: { id },
      include: { issues: { orderBy: { createdAt: 'asc' } } },
    });

    if (!job) {
      throw new NotFoundException(`Scan ${id} was not found.`);
    }

    return {
      id: job.id,
      status: job.status,
      filesFound: job.filesFound,
      filesProcessed: job.filesProcessed,
      errorMessage: job.errorMessage,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      issues: job.issues.map((issue) => ({
        severity: issue.severity,
        code: issue.code,
        filePath: issue.filePath,
        message: issue.message,
      })),
    };
  }
}
