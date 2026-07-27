import { PrismaClient } from '@prisma/client';
import { PLATFORMS } from '../src/platforms/platform.registry';

const prisma = new PrismaClient();

const DEFAULT_USER_ID =
  process.env.DEFAULT_USER_ID ?? '00000000-0000-0000-0000-000000000001';

async function main() {
  await prisma.user.upsert({
    where: { id: DEFAULT_USER_ID },
    update: {},
    create: { id: DEFAULT_USER_ID },
  });

  for (const platform of PLATFORMS) {
    await prisma.platform.upsert({
      where: { slug: platform.slug },
      update: { name: platform.name },
      create: { slug: platform.slug, name: platform.name },
    });
  }

  console.log(`Seeded 1 user and ${PLATFORMS.length} platforms.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
