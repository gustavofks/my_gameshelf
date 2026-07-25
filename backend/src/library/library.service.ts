import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface GameListQuery {
  platform?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class LibraryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get userId(): string {
    return this.config.getOrThrow<string>('DEFAULT_USER_ID');
  }

  async list(query: GameListQuery) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(200, Math.max(1, query.pageSize ?? 50));

    const where: Prisma.GameWhereInput = {
      userId: this.userId,
      ...(query.platform ? { platform: { slug: query.platform } } : {}),
      ...(query.search
        ? { title: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [total, games] = await this.prisma.$transaction([
      this.prisma.game.count({ where }),
      this.prisma.game.findMany({
        where,
        orderBy: { title: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { platform: true },
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      items: games.map((game) => ({
        id: game.id,
        title: game.title,
        region: game.region,
        filePath: game.filePath,
        fileSize: game.fileSize.toString(),
        crc32: game.crc32,
        discNumber: game.discNumber,
        revision: game.revision,
        isMissing: game.isMissing,
        platform: { slug: game.platform.slug, name: game.platform.name },
      })),
    };
  }
}
