import { Test } from '@nestjs/testing';
import { mkdtemp, mkdir, writeFile, rm, rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AppModule } from '../src/app.module';
import { ScannerRunner } from '../src/scanner/scanner.runner';
import { PLATFORMS } from '../src/platforms/platform.registry';
import { prisma, resetDatabase, TEST_USER_ID } from './prisma-test-client';
import { INestApplication } from '@nestjs/common';

describe('ScannerRunner', () => {
  let app: INestApplication;
  let runner: ScannerRunner;
  let root: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    runner = app.get(ScannerRunner);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetDatabase();
    await prisma.platform.createMany({
      data: PLATFORMS.map((platform) => ({
        slug: platform.slug,
        name: platform.name,
      })),
    });

    root = await mkdtemp(join(tmpdir(), 'scan-'));
    await mkdir(join(root, 'snes'), { recursive: true });
    await writeFile(join(root, 'snes', 'Chrono Trigger (USA).sfc'), 'rom-a');
    await writeFile(join(root, 'snes', 'Super Metroid (J).sfc'), 'rom-b');
    await writeFile(join(root, 'snes', 'cover.jpg'), 'not a rom');
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  async function runScan(): Promise<string> {
    const job = await prisma.scanJob.create({
      data: { userId: TEST_USER_ID, rootPath: root },
    });
    await runner.run(job.id);
    return job.id;
  }

  it('persists the games it finds and ignores non-ROM files', async () => {
    const jobId = await runScan();

    const games = await prisma.game.findMany({ orderBy: { title: 'asc' } });
    expect(games.map((game) => game.title)).toEqual([
      'Chrono Trigger',
      'Super Metroid',
    ]);

    const job = await prisma.scanJob.findUniqueOrThrow({
      where: { id: jobId },
    });
    expect(job.status).toBe('COMPLETED');
    expect(job.filesFound).toBe(2);
    expect(job.filesProcessed).toBe(2);
  });

  it('is idempotent across repeated scans', async () => {
    await runScan();
    await runScan();

    await expect(prisma.game.count()).resolves.toBe(2);
  });

  it('relinks a renamed file instead of duplicating it', async () => {
    await runScan();
    const before = await prisma.game.findFirstOrThrow({
      where: { title: 'Chrono Trigger' },
    });

    await rename(
      join(root, 'snes', 'Chrono Trigger (USA).sfc'),
      join(root, 'snes', 'Chrono Trigger (U).sfc'),
    );
    await runScan();

    await expect(prisma.game.count()).resolves.toBe(2);
    const after = await prisma.game.findUniqueOrThrow({
      where: { id: before.id },
    });
    expect(after.filePath).toBe('snes/Chrono Trigger (U).sfc');
    expect(after.isMissing).toBe(false);
  });

  it('flags a deleted file as missing without removing the record', async () => {
    await runScan();
    await rm(join(root, 'snes', 'Super Metroid (J).sfc'));
    await runScan();

    await expect(prisma.game.count()).resolves.toBe(2);
    const missing = await prisma.game.findFirstOrThrow({
      where: { title: 'Super Metroid' },
    });
    expect(missing.isMissing).toBe(true);
  });

  it('classifies each file by its extension, ignoring the folder', async () => {
    // A .gba and a .nds dropped inside the snes/ folder: the folder name is
    // irrelevant, each file is catalogued under the platform of its extension.
    await writeFile(join(root, 'snes', 'Metroid Fusion (USA).gba'), 'rom-gba');
    await writeFile(join(root, 'snes', 'Mario Kart DS (USA).nds'), 'rom-nds');

    await runScan();

    const games = await prisma.game.findMany({
      include: { platform: true },
      orderBy: { title: 'asc' },
    });
    const byTitle = Object.fromEntries(
      games.map((g) => [g.title, g.platform.slug]),
    );
    expect(byTitle['Metroid Fusion']).toBe('gba');
    expect(byTitle['Mario Kart DS']).toBe('ds');
    expect(byTitle['Chrono Trigger']).toBe('snes');
    // Two real snes ROMs + the gba + the nds = 4.
    await expect(prisma.game.count()).resolves.toBe(4);
  });

  it('ignores an unknown extension without recording an issue', async () => {
    // .cdi belongs to no platform in the registry; it is clutter, not a warning.
    await writeFile(join(root, 'snes', 'Shenmue (USA).cdi'), 'rom-cdi');

    const jobId = await runScan();

    const issues = await prisma.scanIssue.findMany({
      where: { scanJobId: jobId },
    });
    expect(issues).toHaveLength(0);
    // Only the two real snes ROMs are catalogued.
    await expect(prisma.game.count()).resolves.toBe(2);
  });

  it('stays silent for non-ROM clutter', async () => {
    // cover.jpg is created in beforeEach inside snes/. Its extension belongs to
    // no platform, so it is ignored without any issue.
    const jobId = await runScan();

    const issues = await prisma.scanIssue.findMany({
      where: { scanJobId: jobId },
    });
    expect(issues).toHaveLength(0);
  });

  it('records a warning when no title can be derived', async () => {
    await writeFile(join(root, 'snes', '(USA).sfc'), 'rom-d');

    const jobId = await runScan();

    const issues = await prisma.scanIssue.findMany({
      where: { scanJobId: jobId, code: 'PARSE_FAILED' },
    });
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('WARNING');

    const game = await prisma.game.findFirstOrThrow({
      where: { filePath: 'snes/(USA).sfc' },
    });
    expect(game.title).toBe('(USA)');
  });

  it('fails the job when the root path is unreadable', async () => {
    const job = await prisma.scanJob.create({
      data: { userId: TEST_USER_ID, rootPath: join(root, 'missing-folder') },
    });

    await runner.run(job.id);

    const failed = await prisma.scanJob.findUniqueOrThrow({
      where: { id: job.id },
    });
    expect(failed.status).toBe('FAILED');
    expect(failed.errorMessage).toContain('not readable');
  });
});
