# @mate-control/database

Prisma 7 data layer for MateControl. PostgreSQL schema for centers, users,
students, equipment, loans, and audit logs.

- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations`
- Config: `prisma.config.ts` (loads `DATABASE_URL` from the root `.env`)
- Seed: `prisma/seed.ts`
- Generated client: `src/generated/prisma` (gitignored)
- Public API: `createPrismaClient(connectionString)` and generated Prisma types
- Design and invariants: `docs/database.md`

## Schema overview

| Table          | Purpose                                                                   |
| -------------- | ------------------------------------------------------------------------- |
| `centers`      | One row per student center.                                               |
| `users`        | Operator accounts. A user can belong to several centers.                  |
| `center_users` | Membership and role (`admin` / `operator`) inside a center.               |
| `students`     | Personal data, scoped to one center (unique DNI/legajo/phone per center). |
| `equipment`    | One row per physical mate kit.                                            |
| `loans`        | Loan history; `returned_at IS NULL` means active.                         |
| `audit_logs`   | Relevant operations without PII.                                          |

Key constraints:

- Composite foreign keys keep students, equipment, and operators in the loan's
  center.
- A partial unique index (`uq_loans_active_equipment`) allows one active loan per
  equipment, even under concurrent inserts.
- CHECK constraints enforce lowercase email/slug, DNI/phone formats, and return
  consistency. They live only in the migration SQL; Prisma cannot express them.

## Commands

Use the root scripts, or run these inside the package:

| Command                  | Root script              | Purpose                                          |
| ------------------------ | ------------------------ | ------------------------------------------------ |
| `pnpm build`             | `pnpm build`             | Generate the client and compile.                 |
| `pnpm db:generate`       | `pnpm db:generate`       | Regenerate the Prisma client.                    |
| `pnpm db:migrate`        | `pnpm db:migrate`        | Create and apply a migration (dev).              |
| `pnpm db:migrate:deploy` | `pnpm db:migrate:deploy` | Apply existing migrations.                       |
| `pnpm db:seed`           | `pnpm db:seed`           | Seed the default center (idempotent).            |
| `pnpm db:reset`          | `pnpm db:reset`          | Drop, recreate, migrate, and seed (destructive). |
| `pnpm db:studio`         | `pnpm db:studio`         | Open Prisma Studio.                              |
| `pnpm test`              | `pnpm test`              | Run the database invariant tests.                |
| `pnpm typecheck`         | `pnpm typecheck`         | Typecheck source, tests, and seed.               |

## Migration workflow

```bash
pnpm db:up                        # start Postgres
pnpm db:migrate -- --name <name>  # create + apply a migration
```

To add SQL that Prisma cannot generate (CHECK constraints, custom indexes):

```bash
pnpm --filter @mate-control/database exec prisma migrate dev --name <name> --create-only
# edit prisma/migrations/<timestamp>_<name>/migration.sql
pnpm db:migrate
```

Rules:

- Partial indexes use the `partialIndexes` preview feature
  (`generator client { previewFeatures = ["partialIndexes"] }`).
- Do not use `prisma db pull` as the source of truth; it drops hand-written CHECK
  constraints. Update `schema.prisma` and the migration SQL instead.
- Re-check `pg_indexes` and `pg_constraint` after changing the schema.
- `prisma migrate reset` destroys data. Only run it against a local development
  database.

## Seed

`prisma/seed.ts` upserts the default center from `SEED_CENTER_SLUG` /
`SEED_CENTER_NAME`. It is safe to run repeatedly:

```bash
pnpm db:seed
```

Admin user seeding is deferred to the auth work.

## Tests

The tests run against a separate database so they never touch development data.

```bash
pnpm db:up
pnpm db:test:setup   # create mate_control_test
pnpm test
```

`TEST_DATABASE_URL` in the root `.env` points at `mate_control_test`. The test
setup applies migrations with `prisma migrate deploy`, tests truncate between
cases, and files run serially. Coverage includes active-loan uniqueness (including
a concurrent insert race), cross-center foreign keys, return consistency, formats,
and case normalization.
