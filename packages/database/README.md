# @mate-control/database

Prisma 7 data layer for MateControl.

- Schema: `prisma/schema.prisma`
- Config: `prisma.config.ts` (loads `DATABASE_URL` from the root `.env`)
- Generated client: `src/generated/prisma` (gitignored)
- Public API: `createPrismaClient(connectionString)` and generated Prisma types

Commands (or use the root `db:*` scripts):

- `pnpm --filter @mate-control/database build`
- `pnpm --filter @mate-control/database db:generate`
- `pnpm --filter @mate-control/database db:migrate`
- `pnpm --filter @mate-control/database db:studio`
