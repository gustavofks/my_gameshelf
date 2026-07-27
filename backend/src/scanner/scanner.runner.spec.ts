import { ScannerRunner } from './scanner.runner';
import type { PrismaService } from '../prisma/prisma.service';
import type { FilesystemAdapter } from './infra/filesystem.adapter';

describe('ScannerRunner error containment', () => {
  it('never rejects, even when writing the FAILED status itself fails', async () => {
    // Every scanJob write rejects — including the one in the catch block that
    // records failure. run() is dispatched with `void`, so a rejection here
    // would become an unhandled promise rejection and crash the process.
    const prisma = {
      scanJob: {
        update: jest.fn().mockRejectedValue(new Error('database is down')),
      },
    } as unknown as PrismaService;

    const filesystem = {
      isReadableDirectory: jest.fn(),
      walk: jest.fn(),
    } as unknown as FilesystemAdapter;

    const runner = new ScannerRunner(prisma, filesystem);

    // Must resolve, not reject.
    await expect(runner.run('any-id')).resolves.toBeUndefined();
  });
});
