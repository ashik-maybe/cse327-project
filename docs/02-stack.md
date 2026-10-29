# Stack (Caveman)

Frontend: Next.js 16 App Router (React 19, TypeScript strict, Tailwind v4, shadcn/ui, TanStack Query, RHF, Dexie, Leaflet, lucide-react).
Backend: Elysia (v1.4.30), Bun, TypeScript strict, Zod, Drizzle ORM, postgres.js, bcryptjs, cookie session.
Shared: @campbridge/shared (Bun workspace). Enums, Zod schemas, inferred types. No duplication.
DB: PostgreSQL 16. Drizzle-kit for migrations/seed.
Deployment: Podman (db, api, web). Backend bun image. Frontend node:20-alpine.
