# Deployment

Podman: root podman-compose.yml.
Services: db (postgres:16-alpine), api (backend Containerfile with bun), web (frontend Containerfile node:20-alpine).
Ports: frontend 3000, backend 4000, db internal.
Backend Containerfile: FROM oven/bun, COPY package.json, install frozen, expose 4000, CMD ["bun", "run", "dev"].
Frontend Containerfile: FROM node:20-alpine.
Local dev: start db, migrations, seed, backend, frontend.
