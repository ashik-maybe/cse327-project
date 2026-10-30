#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$ROOT_DIR/podman-compose.yml"
BACKEND_PID=""
FRONTEND_PID=""
CLEANED_UP=0

die() {
  printf 'dev.sh: %s\n' "$*" >&2
  exit 1
}

cleanup() {
  local exit_code=$?
  (( CLEANED_UP )) && return "$exit_code"
  CLEANED_UP=1

  trap - INT TERM EXIT
  printf '\nStopping CampBridge...\n'

  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill -TERM "$FRONTEND_PID" 2>/dev/null || true
  fi
  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill -TERM "$BACKEND_PID" 2>/dev/null || true
  fi

  wait "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" 2>/dev/null || true
  podman compose -f "$COMPOSE_FILE" down
  printf 'CampBridge stopped. Database volume preserved.\n'

  return "$exit_code"
}

trap cleanup INT TERM EXIT

command -v podman >/dev/null 2>&1 || die "Podman is required."
command -v bun >/dev/null 2>&1 || die "Bun is required."
[[ -f "$COMPOSE_FILE" ]] || die "Missing $COMPOSE_FILE."

cd "$ROOT_DIR"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

export NODE_ENV="${NODE_ENV:-development}"
export PORT="${PORT:-4000}"
export DATABASE_URL="${DATABASE_URL:-postgres://campbridge:campbridge@localhost:5432/campbridge}"
export CORS_ORIGIN="${CORS_ORIGIN:-http://localhost:3000}"
export SESSION_SECRET="${SESSION_SECRET:-campbridge-local-demo-secret}"
export AUTH_COOKIE_NAME="${AUTH_COOKIE_NAME:-campbridge_session}"
export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-/api}"
export NEXT_PUBLIC_USE_MOCKS="${NEXT_PUBLIC_USE_MOCKS:-false}"

printf 'Starting PostgreSQL...\n'
podman compose -f "$COMPOSE_FILE" up -d db

printf 'Waiting for PostgreSQL...\n'
for _ in {1..30}; do
  if podman compose -f "$COMPOSE_FILE" exec -T db pg_isready -U campbridge -d campbridge >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

podman compose -f "$COMPOSE_FILE" exec -T db pg_isready -U campbridge -d campbridge >/dev/null 2>&1 ||
  die "PostgreSQL did not become ready."

printf 'Applying migrations and seed...\n'
bun run db:migrate
bun run db:seed

printf 'Starting backend at http://localhost:4000...\n'
(cd apps/backend && exec bun src/index.ts) &
BACKEND_PID=$!

printf 'Starting frontend at http://localhost:3000...\n'
(cd apps/frontend && PORT=3000 exec bun run dev) &
FRONTEND_PID=$!

printf '\nCampBridge is ready. Press Ctrl+C to stop all services.\n\n'
wait -n "$BACKEND_PID" "$FRONTEND_PID"
