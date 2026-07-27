import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function resetDatabase(): Promise<void> {
  await prisma.scanIssue.deleteMany();
  await prisma.scanJob.deleteMany();
  await prisma.game.deleteMany();
  await prisma.platform.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({ data: { id: TEST_USER_ID } });
}
