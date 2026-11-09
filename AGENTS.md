# AGENTS.md

MateControl: pnpm monorepo for a mate-kit loan system for university student centers.
`SPEC.md` is the Spanish product spec and is intentionally local — never commit it.
Domain work is still in SPEC.md Phase 1 (design); only infrastructure and scaffolding exist.

## Layout

- `apps/api` — NestJS 12 backend (TypeScript 6, ESM, Vitest, oxlint). Entry: `src/main.ts`; health at `GET /health`.
- `apps/web` — Next.js 16 App Router frontend (React 19, Tailwind v4). Read `apps/web/AGENTS.md` before touching web code.
- `packages/database` — `@mate-control/database`: Prisma 7 schema, migrations, generated client, and `createPrismaClient()`.
- `compose.yaml` — Postgres 17 on host port 5433 (avoids common local 5432 conflicts).

## Commands (from repo root)

- `pnpm install` — installs the workspace and Husky hooks.
- `pnpm dev` — builds `@mate-control/database`, then runs API (`:3100`) and web (`:3000`) in parallel.
- `pnpm build` — database → api (`nest build`) → web (`next build`).
- `pnpm lint` — api `oxlint src/ test/` + web `eslint`.
- `pnpm --filter api test` — Vitest units; specs are colocated as `src/**/*.spec.ts`.
- Single test: `pnpm --filter api test -- src/health/health.controller.spec.ts`.
- E2E: `pnpm --filter api test:e2e` (`test/**/*.e2e-spec.ts`); requires `pnpm db:up`.
- `pnpm typecheck` — real per-package typechecks (web runs `next typegen` first).
- `pnpm format` / `pnpm format:check` — root Prettier (single quotes, trailing commas).
- `pnpm db:up` / `db:down` / `db:logs` — Docker Compose Postgres.
- `pnpm db:generate` / `db:migrate` / `db:studio` — Prisma via `@mate-control/database`.

## Gotchas

- API is ESM (`"type": "module"`, NodeNext). Relative imports in TS must end in `.js` (`./app.module.js`).
- API tests use Vitest, not Jest; don't add Jest config or Jest setup for `@nestjs/testing`.
- The API loads the root `.env` via `@nestjs/config` (`envFilePath: ['../../.env', '.env']`); `DATABASE_URL` and `PORT` live there.
- Prisma 7: the datasource URL is supplied by `packages/database/prisma.config.ts`, not `schema.prisma`; generated client goes to `packages/database/src/generated` (gitignored). Run `pnpm db:generate` after schema changes.
- `packages/database` must be built before API dev/test; root scripts handle this, but direct `pnpm --filter api dev` requires a prior `pnpm --filter @mate-control/database build`.
- `apps/web/AGENTS.md` is rewritten by `next dev`. Keep the generated block in commits; deleting it just recreates the change.
- Next 16.4.5 differs from training data and has `cacheComponents` + `partialPrefetching` enabled. Consult `apps/web/node_modules/next/dist/docs/` before writing Next code.
- Tailwind v4 is CSS-first (`@import "tailwindcss"` in `app/globals.css`, `@tailwindcss/turbopack` loader in `next.config.ts`). No `tailwind.config.*` or PostCSS config; don't add one.
- `GET /health` is the only endpoint; keep the e2e test passing when changing app wiring.
- Git: commits use Conventional Commits (`feat(scope): ...`), enforced by commitlint; pre-commit runs lint-staged. Never push or open PRs unless asked.

## Environment

Copy `.env.example` to `.env` (already gitignored). Defaults: API `PORT=3100`, Postgres host port `5433`, database `mate_control`.
