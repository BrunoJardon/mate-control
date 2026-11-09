import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  createFixtures,
  prisma,
  resetDatabase,
  type Fixtures,
} from './helpers.js';

let fixtures: Fixtures;

beforeEach(async () => {
  await resetDatabase();
  fixtures = await createFixtures();
});

afterAll(async () => {
  await prisma.$disconnect();
});

function loanData() {
  return {
    centerId: fixtures.centerA.id,
    studentId: fixtures.studentA.id,
    equipmentId: fixtures.equipmentA.id,
    createdByUserId: fixtures.userA.id,
  };
}

describe('loans', () => {
  it('rejects a second active loan for the same equipment', async () => {
    await prisma.loan.create({ data: loanData() });

    await expect(
      prisma.loan.create({ data: loanData() }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('allows a new loan after the previous one is returned', async () => {
    const first = await prisma.loan.create({ data: loanData() });

    await prisma.loan.update({
      where: { id: first.id },
      data: {
        returnedAt: new Date(),
        returnedByUserId: fixtures.userA.id,
      },
    });

    await expect(
      prisma.loan.create({ data: loanData() }),
    ).resolves.toBeDefined();
  });

  it('rejects a student from another center', async () => {
    await expect(
      prisma.$executeRaw`INSERT INTO loans (center_id, student_id, equipment_id, created_by_user_id) VALUES (${fixtures.centerA.id}, ${fixtures.studentB.id}, ${fixtures.equipmentA.id}, ${fixtures.userA.id})`,
    ).rejects.toThrow(/loans_center_id_student_id_fkey/);
  });

  it('rejects equipment from another center', async () => {
    await expect(
      prisma.$executeRaw`INSERT INTO loans (center_id, student_id, equipment_id, created_by_user_id) VALUES (${fixtures.centerA.id}, ${fixtures.studentA.id}, ${fixtures.equipmentB.id}, ${fixtures.userA.id})`,
    ).rejects.toThrow(/loans_center_id_equipment_id_fkey/);
  });

  it('rejects an operator from another center', async () => {
    await expect(
      prisma.$executeRaw`INSERT INTO loans (center_id, student_id, equipment_id, created_by_user_id) VALUES (${fixtures.centerA.id}, ${fixtures.studentA.id}, ${fixtures.equipmentA.id}, ${fixtures.userB.id})`,
    ).rejects.toThrow(/loans_center_id_created_by_user_id_fkey/);
  });

  it('requires a return operator when returned_at is set', async () => {
    const loan = await prisma.loan.create({ data: loanData() });

    await expect(
      prisma.$executeRaw`UPDATE loans SET returned_at = now() WHERE id = ${loan.id}`,
    ).rejects.toThrow(/loans_returned_fields_consistent/);
  });

  it('requires returned_at when a return operator is set', async () => {
    const loan = await prisma.loan.create({ data: loanData() });

    await expect(
      prisma.$executeRaw`UPDATE loans SET returned_by_user_id = ${fixtures.userA.id} WHERE id = ${loan.id}`,
    ).rejects.toThrow(/loans_returned_fields_consistent/);
  });

  it('rejects a return before the loan', async () => {
    const loan = await prisma.loan.create({ data: loanData() });

    await expect(
      prisma.$executeRaw`UPDATE loans SET returned_at = ${new Date('2020-01-01T00:00:00Z')}, returned_by_user_id = ${fixtures.userA.id} WHERE id = ${loan.id}`,
    ).rejects.toThrow(/loans_returned_after_loaned/);
  });

  it('allows exactly one of two concurrent active loans', async () => {
    const results = await Promise.allSettled([
      prisma.loan.create({ data: loanData() }),
      prisma.loan.create({ data: loanData() }),
    ]);

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]).toMatchObject({
      status: 'rejected',
      reason: { code: 'P2002' },
    });
  });

  it('returns a loan idempotently', async () => {
    const loan = await prisma.loan.create({ data: loanData() });

    const first = await prisma.loan.updateMany({
      where: { id: loan.id, returnedAt: null },
      data: {
        returnedAt: new Date(),
        returnedByUserId: fixtures.userA.id,
      },
    });
    const second = await prisma.loan.updateMany({
      where: { id: loan.id, returnedAt: null },
      data: {
        returnedAt: new Date(),
        returnedByUserId: fixtures.userA.id,
      },
    });

    expect(first.count).toBe(1);
    expect(second.count).toBe(0);
  });
});

describe('students', () => {
  it('rejects duplicate DNI, legajo, and phone within a center', async () => {
    await expect(
      prisma.student.create({
        data: {
          centerId: fixtures.centerA.id,
          firstName: 'Other',
          lastName: 'Student',
          dni: '12345678',
          studentNumber: 'A-2',
          phoneE164: '+5491133333333',
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });

    await expect(
      prisma.student.create({
        data: {
          centerId: fixtures.centerA.id,
          firstName: 'Other',
          lastName: 'Student',
          dni: '11111111',
          studentNumber: 'A-1',
          phoneE164: '+5491133333333',
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });

    await expect(
      prisma.student.create({
        data: {
          centerId: fixtures.centerA.id,
          firstName: 'Other',
          lastName: 'Student',
          dni: '11111111',
          studentNumber: 'A-2',
          phoneE164: '+5491111111111',
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('allows the same DNI in different centers', async () => {
    await expect(
      prisma.student.create({
        data: {
          centerId: fixtures.centerB.id,
          firstName: 'Ana',
          lastName: 'Alvarez',
          dni: '12345678',
          studentNumber: 'B-2',
          phoneE164: '+5491144444444',
        },
      }),
    ).resolves.toBeDefined();
  });

  it('enforces the E.164 phone format', async () => {
    await expect(
      prisma.student.create({
        data: {
          centerId: fixtures.centerA.id,
          firstName: 'Bad',
          lastName: 'Phone',
          dni: '22222222',
          studentNumber: 'A-3',
          phoneE164: '123',
        },
      }),
    ).rejects.toThrow(/students_phone_e164_format/);
  });

  it('enforces the DNI format', async () => {
    await expect(
      prisma.student.create({
        data: {
          centerId: fixtures.centerA.id,
          firstName: 'Bad',
          lastName: 'Dni',
          dni: 'abc',
          studentNumber: 'A-4',
          phoneE164: '+5491155555555',
        },
      }),
    ).rejects.toThrow(/students_dni_format/);
  });
});

describe('users and centers', () => {
  it('rejects uppercase emails', async () => {
    await expect(
      prisma.user.create({
        data: {
          name: 'Uppercase',
          email: 'Uppercase@Example.com',
          passwordHash: 'hash',
        },
      }),
    ).rejects.toThrow(/users_email_lowercase/);
  });

  it('rejects uppercase center slugs', async () => {
    await expect(
      prisma.center.create({
        data: { name: 'Uppercase', slug: 'Uppercase-Slug' },
      }),
    ).rejects.toThrow(/centers_slug_lowercase/);
  });
});
