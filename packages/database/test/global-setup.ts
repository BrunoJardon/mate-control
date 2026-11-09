import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { config } from 'dotenv';

export default function setup(): void {
  config({ path: resolve(import.meta.dirname, '../../../.env') });

  const databaseUrl = process.env.TEST_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('TEST_DATABASE_URL is required to run database tests');
  }

  try {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      cwd: resolve(import.meta.dirname, '..'),
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'inherit',
    });
  } catch {
    throw new Error(
      'Could not migrate the test database. Run `pnpm db:test:setup` first.',
    );
  }
}
