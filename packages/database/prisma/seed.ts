import { resolve } from 'node:path';
import { config } from 'dotenv';
import { createPrismaClient } from '../src/index.js';

config({ path: resolve(import.meta.dirname, '../../../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to seed the database');
}

const prisma = createPrismaClient(connectionString);

const slug = process.env.SEED_CENTER_SLUG ?? 'centro-principal';
const name = process.env.SEED_CENTER_NAME ?? 'Centro de Estudiantes';

async function main(): Promise<void> {
  const center = await prisma.center.upsert({
    where: { slug },
    update: { name },
    create: { slug, name },
  });

  console.log(`Seeded center ${center.slug} (id ${center.id})`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
