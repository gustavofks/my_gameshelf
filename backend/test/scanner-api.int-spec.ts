import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AppModule } from '../src/app.module';
import { ScannerService } from '../src/scanner/scanner.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { PLATFORMS } from '../src/platforms/platform.registry';
import { prisma, resetDatabase, TEST_USER_ID } from './prisma-test-client';

interface ScanJobBody {
  id: string;
  status: string;
  filesFound: number;
  filesProcessed: number;
  issues: unknown[];
}

interface GamesListBody {
  items: Array<{ title: string }>;
}

function scanBody(response: request.Response): ScanJobBody {
  return response.body as ScanJobBody;
}

function gamesBody(response: request.Response): GamesListBody {
  return response.body as GamesListBody;
}

describe('Scan API', () => {
  let app: INestApplication;
  let root: string;

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
    await prisma.platform.createMany({
      data: PLATFORMS.map((p) => ({ slug: p.slug, name: p.name })),
    });
    root = await mkdtemp(join(tmpdir(), 'scan-api-'));
    await mkdir(join(root, 'nes'), { recursive: true });
    await writeFile(join(root, 'nes', 'Contra (USA).nes'), 'rom');
    process.env.ROMS_ROOT_PATH = root;
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  async function waitForCompletion(id: string): Promise<ScanJobBody> {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const response = await request(app.getHttpServer()).get(`/scans/${id}`);
      const status = scanBody(response).status;
      if (status === 'COMPLETED' || status === 'FAILED') {
        return scanBody(response);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error('Scan did not finish in time');
  }

  it('accepts a scan and reports progress until completion', async () => {
    const accepted = await request(app.getHttpServer())
      .post('/scans')
      .expect(202);
    expect(scanBody(accepted).status).toBe('PENDING');

    const finished = await waitForCompletion(scanBody(accepted).id);
    expect(finished.status).toBe('COMPLETED');
    expect(finished.filesFound).toBe(1);
    expect(finished.issues).toEqual([]);

    const games = await request(app.getHttpServer()).get('/games').expect(200);
    expect(gamesBody(games).items[0].title).toBe('Contra');
  });

  it('scans a rootPath from the request body, overriding the env default', async () => {
    // A second folder with a different game; the env still points at `root`.
    const other = await mkdtemp(join(tmpdir(), 'scan-body-'));
    await mkdir(join(other, 'snes'), { recursive: true });
    await writeFile(join(other, 'snes', 'Chrono Trigger (USA).sfc'), 'rom-x');

    try {
      const accepted = await request(app.getHttpServer())
        .post('/scans')
        .send({ rootPath: other })
        .expect(202);

      const finished = await waitForCompletion(scanBody(accepted).id);
      expect(finished.status).toBe('COMPLETED');

      const games = await request(app.getHttpServer())
        .get('/games')
        .expect(200);
      // The body path won: Chrono Trigger, not Contra from the env folder.
      expect(gamesBody(games).items.map((g) => g.title)).toEqual([
        'Chrono Trigger',
      ]);
    } finally {
      await rm(other, { recursive: true, force: true });
    }
  });

  it('rejects an unreadable rootPath from the body with 400', async () => {
    await request(app.getHttpServer())
      .post('/scans')
      .send({ rootPath: join(root, 'nope') })
      .expect(400);
  });

  it('rejects a second scan while one is running', async () => {
    await prisma.scanJob.create({
      data: { userId: TEST_USER_ID, rootPath: root, status: 'RUNNING' },
    });

    await request(app.getHttpServer()).post('/scans').expect(409);
  });

  it('lets the database reject a second active job (race safety net)', async () => {
    // The 409 check-then-create is not atomic; a partial unique index is the
    // backstop so two racing requests cannot both open an active scan.
    await prisma.scanJob.create({
      data: { userId: TEST_USER_ID, rootPath: root, status: 'RUNNING' },
    });

    await expect(
      prisma.scanJob.create({
        data: { userId: TEST_USER_ID, rootPath: root, status: 'PENDING' },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('converts the race-losing insert (P2002) into a 409', async () => {
    // Simulate the race the partial index guards: an active job already exists,
    // but the non-atomic pre-check misses it (findFirst returns null this once).
    // Execution then reaches create(), the DB rejects it with P2002, and start()
    // must translate that into a 409 — the code path the plain constraint test
    // does not exercise.
    await prisma.scanJob.create({
      data: { userId: TEST_USER_ID, rootPath: root, status: 'RUNNING' },
    });

    const prismaService = app.get(PrismaService);
    const spy = jest
      .spyOn(prismaService.scanJob, 'findFirst')
      .mockResolvedValueOnce(null);

    try {
      await request(app.getHttpServer()).post('/scans').expect(409);
    } finally {
      spy.mockRestore();
    }
  });

  it('allows a new scan once the previous one is finished', async () => {
    // A COMPLETED job must not block a new one — the index only covers active
    // states (PENDING/RUNNING).
    await prisma.scanJob.create({
      data: { userId: TEST_USER_ID, rootPath: root, status: 'COMPLETED' },
    });

    const accepted = await request(app.getHttpServer())
      .post('/scans')
      .expect(202);
    await waitForCompletion(scanBody(accepted).id);
  });

  it('rejects an unreadable root path with 400', async () => {
    process.env.ROMS_ROOT_PATH = join(root, 'nope');

    await request(app.getHttpServer()).post('/scans').expect(400);
  });

  it('returns 404 for an unknown scan id', async () => {
    await request(app.getHttpServer())
      .get('/scans/00000000-0000-0000-0000-0000000000ff')
      .expect(404);
  });

  it('marks orphaned RUNNING jobs as FAILED on startup', async () => {
    const orphan = await prisma.scanJob.create({
      data: { userId: TEST_USER_ID, rootPath: root, status: 'RUNNING' },
    });

    await app.get(ScannerService).reconcileOrphanedJobs();

    const reconciled = await prisma.scanJob.findUniqueOrThrow({
      where: { id: orphan.id },
    });
    expect(reconciled.status).toBe('FAILED');
    expect(reconciled.errorMessage).toContain('interrupted');
  });
});
