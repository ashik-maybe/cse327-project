# CampBridge — Plan Fixes Record

Branch: `shared` (our active working branch for implementation. Do not commit
any more work onto `main`.

## Fix 1: Elysia version contract

**Problem:** The `elysiajs` skills reference Elysia v2 (`2.0.0-rc.0+`) patterns,
but the scaffolded backend at `apps/backend/node_modules/elysia` reports
**version `1.4.30`**. Upgrading to v2 RC carries more demo risk (route shape
changes, middleware signature shifts) than it's worth for a university demo.

**Decision:** Stay on installed **Elysia v1.4.30**. Build the `/api/*`
backend within v1 idioms (Zod validation via `define()` + response wrapper,
custom guards instead of v2 `defineRoute`, manual DB layer via Drizzle ORM +
postgres.js rather than `db.transaction` context). This keeps the demo
predictable.

If later on a better score comes along, we can revisit; otherwise this is the
decided baseline for v5.0.

## Fix 2: Zod validation strategy with shared schemas

**Problem:** The spec wants `@campbridge/shared` as the single source of truth
for all Zod schemas, imported by both frontend and backend. But Elysia v1's
built-in Zod adapter validates directly, while v2 expects a separate schema
validation surface.

**Decision:** Define all schemas once in `packages/shared/schemas/` (auth,
case, safety, service-point, AI, common), import them into backend route
modules, and validate each request body with `schema.safeParse()` inline in
the handler with try/catch → standard `VALIDATION_ERROR` envelope. No
extra validation library needed. Re-export inferred types via `z.infer<>`.

This avoids dependency bloat and matches the constraint of "single source of
truth".

## Consequence for the rest of the plan

- Backend services call shared schemas for typing AND validation;
- Frontend uses shared types for API client inference;
- Database stays Drizzle ORM (no Prisma) as mandated.

No files are reverted or changed by these fixes. Work proceeds on `shared`.
