# CampBridge

Volunteer coordination app for CSE 327. Bun workspace with a Next.js
frontend, Elysia backend, PostgreSQL, and shared TypeScript contracts.

## Local setup

```bash
bun install
cp .env.example .env
podman compose -f podman-compose.yml up -d db
bun run db:migrate
bun run db:seed
```

Start the backend and frontend in separate terminals:

```bash
bun run backend:dev
bun run frontend:dev
```

For a temporary demo session, use the convenience launcher:

```bash
chmod +x ./dev.sh
./dev.sh
```

It starts PostgreSQL, applies migrations, seeds demo data, and runs both apps.
Press `Ctrl+C` to stop them and PostgreSQL; the database volume is preserved.

Open <http://localhost:3000>. The API runs at
<http://localhost:4000>.
