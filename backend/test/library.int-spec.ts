import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { prisma, resetDatabase, TEST_USER_ID } from './prisma-test-client';

interface GameListResponseBody {
  total: number;
  items: Array<{ title: string; fileSize: string }>;
}

function body(response: request.Response): GameListResponseBody {
  return response.body as GameListResponseBody;
}

describe('GET /games', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetDatabase();
    const platform = await prisma.platform.create({
      data: { slug: 'snes', name: 'Super Nintendo' },
    });
    await prisma.game.createMany({
      data: [
        {
          userId: TEST_USER_ID,
          platformId: platform.id,
          title: 'Chrono Trigger',
          region: 'USA',
          filePath: 'snes/Chrono Trigger (USA).sfc',
          fileSize: BigInt(4194304),
          lastSeenAt: new Date(),
        },
        {
          userId: TEST_USER_ID,
          platformId: platform.id,
          title: 'Super Metroid',
          region: 'JPN',
          filePath: 'snes/Super Metroid (J).sfc',
          fileSize: BigInt(3145728),
          lastSeenAt: new Date(),
        },
      ],
    });
  });

  it('returns the catalog sorted by title', async () => {
    const response = await request(app.getHttpServer())
      .get('/games')
      .expect(200);

    expect(body(response).total).toBe(2);
    expect(body(response).items.map((item) => item.title)).toEqual([
      'Chrono Trigger',
      'Super Metroid',
    ]);
  });

  it('filters by platform slug', async () => {
    const response = await request(app.getHttpServer())
      .get('/games?platform=nes')
      .expect(200);

    expect(body(response).total).toBe(0);
  });

  it('filters by search term, case insensitively', async () => {
    const response = await request(app.getHttpServer())
      .get('/games?search=metroid')
      .expect(200);

    expect(body(response).total).toBe(1);
    expect(body(response).items[0].title).toBe('Super Metroid');
  });

  it('serializes fileSize as a string', async () => {
    const response = await request(app.getHttpServer())
      .get('/games')
      .expect(200);
    expect(typeof body(response).items[0].fileSize).toBe('string');
  });

  it('falls back to defaults for non-numeric pagination instead of crashing', async () => {
    // Number('abc') is NaN; it must not reach Prisma as skip/take (a 500).
    const response = await request(app.getHttpServer())
      .get('/games?page=abc&pageSize=xyz')
      .expect(200);
    expect(body(response).total).toBe(2);
    expect(body(response).items).toHaveLength(2);
  });
});

describe('GET /platforms', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase();
    const snes = await prisma.platform.create({
      data: { slug: 'snes', name: 'Super Nintendo' },
    });
    await prisma.platform.create({ data: { slug: 'nes', name: 'NES' } });
    await prisma.game.create({
      data: {
        userId: TEST_USER_ID,
        platformId: snes.id,
        title: 'Chrono Trigger',
        filePath: 'snes/ct.sfc',
        fileSize: BigInt(1),
        lastSeenAt: new Date(),
      },
    });
  });

  it('lists platforms with the per-user game count', async () => {
    const res = await request(app.getHttpServer())
      .get('/platforms')
      .expect(200);
    const body = res.body as Array<{
      slug: string;
      name: string;
      gameCount: number;
    }>;
    expect(body.find((p) => p.slug === 'snes')).toMatchObject({
      name: 'Super Nintendo',
      gameCount: 1,
    });
    expect(body.find((p) => p.slug === 'nes')).toMatchObject({ gameCount: 0 });
  });
});
