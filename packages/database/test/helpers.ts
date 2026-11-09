import { resolve } from 'node:path';
import { config } from 'dotenv';
import { createPrismaClient } from '../src/index.js';

config({ path: resolve(import.meta.dirname, '../../../.env') });

const databaseUrl = process.env.TEST_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('TEST_DATABASE_URL is required to run database tests');
}

export const prisma = createPrismaClient(databaseUrl);

export async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE audit_logs, loans, equipment, students, center_users, users, centers RESTART IDENTITY CASCADE',
  );
}

export interface Fixtures {
  centerA: { id: number };
  centerB: { id: number };
  userA: { id: number };
  userB: { id: number };
  studentA: { id: number };
  studentB: { id: number };
  equipmentA: { id: number };
  equipmentB: { id: number };
}

export async function createFixtures(): Promise<Fixtures> {
  const centerA = await prisma.center.create({
    data: { name: 'Center A', slug: 'center-a' },
  });
  const centerB = await prisma.center.create({
    data: { name: 'Center B', slug: 'center-b' },
  });

  const userA = await prisma.user.create({
    data: { name: 'User A', email: 'a@example.com', passwordHash: 'hash' },
  });
  const userB = await prisma.user.create({
    data: { name: 'User B', email: 'b@example.com', passwordHash: 'hash' },
  });

  await prisma.centerUser.createMany({
    data: [
      { centerId: centerA.id, userId: userA.id, role: 'operator' },
      { centerId: centerB.id, userId: userB.id, role: 'operator' },
    ],
  });

  const studentA = await prisma.student.create({
    data: {
      centerId: centerA.id,
      firstName: 'Ana',
      lastName: 'Alvarez',
      dni: '12345678',
      studentNumber: 'A-1',
      phoneE164: '+5491111111111',
    },
  });
  const studentB = await prisma.student.create({
    data: {
      centerId: centerB.id,
      firstName: 'Beto',
      lastName: 'Benitez',
      dni: '87654321',
      studentNumber: 'B-1',
      phoneE164: '+5491122222222',
    },
  });

  const equipmentA = await prisma.equipment.create({
    data: { centerId: centerA.id, code: 'M-001' },
  });
  const equipmentB = await prisma.equipment.create({
    data: { centerId: centerB.id, code: 'M-002' },
  });

  return {
    centerA,
    centerB,
    userA,
    userB,
    studentA,
    studentB,
    equipmentA,
    equipmentB,
  };
}
