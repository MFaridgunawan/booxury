#!/usr/bin/env bash
# Booxury — one-time bootstrap setup.
# Installs deps, spins up PostgreSQL, writes .env, migrates & seeds the DB.
# After this runs, just use `pnpm dev` on a daily basis.
set -euo pipefail

cd "$(dirname "$0")"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[setup]${NC} $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC} $*"; }

# ---------- 0. Prerequisites ----------
command -v node >/dev/null || { echo "Node.js >=20 required. https://nodejs.org"; exit 1; }
command -v pnpm >/dev/null || { echo "pnpm 9 required. Try: corepack enable pnpm"; exit 1; }

RUNTIME=""
if command -v podman >/dev/null; then RUNTIME=podman
elif command -v docker >/dev/null; then RUNTIME=docker
else warn "Neither podman nor docker found — PostgreSQL must be provided by you (see README)."; fi

PG_CONTAINER="booxury-pg"

# ---------- 1. Install dependencies ----------
info "Installing dependencies..."
pnpm install
info "Generating Prisma client..."
pnpm --filter @booxury/database generate

# ---------- 2. Database container ----------
if [ -n "$RUNTIME" ]; then
  if [ "$($RUNTIME ps -aqf name=^/$PG_CONTAINER$ 2>/dev/null)" = "" ]; then
    info "Creating PostgreSQL 16 container '$PG_CONTAINER' (port 5433)..."
    $RUNTIME run -d --name "$PG_CONTAINER" \
      -e POSTGRES_DB=booxury \
      -e POSTGRES_USER=booxury \
      -e POSTGRES_PASSWORD=booxury_dev \
      -p 5433:5432 \
      docker.io/library/postgres:16-alpine
    info "Waiting for PostgreSQL to accept connections..."
    for i in $(seq 1 30); do
      if $RUNTIME exec "$PG_CONTAINER" pg_isready -U booxury -d booxury >/dev/null 2>&1; then break; fi
      sleep 1
    done
  else
    info "Container '$PG_CONTAINER' already exists — skipping."
    if [ "$($RUNTIME ps -aqf status=running -f name=^/$PG_CONTAINER$ 2>/dev/null)" = "" ]; then
      warn "Container exists but is not running. Start it:"; $RUNTIME start "$PG_CONTAINER" && sleep 2
    fi
  fi
else
  warn "No container runtime — ensure a PostgreSQL 16 is reachable at \$DATABASE_URL."
fi

# ---------- 3. Environment files ----------
SECRET="$(openssl rand -base64 32 2>/dev/null || echo 'change-me-dev-secret')"

if [ ! -f .env ]; then
  info "Creating root .env..."
  cat > .env <<EOF
DATABASE_URL="postgresql://booxury:booxury_dev@localhost:5433/booxury"
AUTH_SECRET="${SECRET}"
NEXTAUTH_SECRET="${SECRET}"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_API_URL="http://localhost:3001"
NEXT_PUBLIC_API_URL="http://localhost:3001"
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="booxury-production"
R2_PUBLIC_URL="http://localhost:3000/production"
NODE_ENV="development"
EOF
else
  warn "Root .env already exists — leaving it untouched."
fi

if [ ! -f apps/web/.env ]; then
  info "Creating apps/web/.env..."
  cat > apps/web/.env <<EOF
AUTH_SECRET="${SECRET}"
NEXTAUTH_SECRET="${SECRET}"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_API_URL="http://localhost:3001"
NEXT_PUBLIC_API_URL="http://localhost:3001"
NODE_ENV="development"
EOF
else
  warn "apps/web/.env already exists — leaving it untouched."
fi

# ---------- 4. Migrate & seed ----------
info "Applying database migrations..."
pnpm db:migrate
info "Seeding base data + demo users..."
pnpm db:seed
info "Seeding demo designs & orders..."
pnpm --filter @booxury/database demo:seed

# ---------- 5. Done ----------
echo
info "Setup complete! 🎉"
echo "  Web:  http://localhost:3000   (Customer: demo@booxury.local / demo123)"
echo "  API:  http://localhost:3001/health"
echo
echo "Start the app anytime with:  pnpm dev"
echo "PDF worker (separate terminal):  pnpm --filter @booxury/api worker"
