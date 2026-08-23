# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Booxury** — Custom Hardcover Notebook Web-to-Print (W2P) platform.
> Konteks: Project-based learning (Politeknik Manufaktur Bandung) + potensi produk komersial.
> Sprint 1 (7 hari) goal: MVP demo-ready untuk review dosen (target: 30 Agt 2026).

Stack: Next.js 15 + Fastify + PostgreSQL + Prisma + Konva.js + pnpm workspaces + Turborepo.
Single deploy (modular monolith) — 6 domain modules, 1 database, 1 language (TypeScript).

---

## Architecture

### Monorepo Structure

```
booxury/
├── apps/
│   ├── web/          # Next.js 15 frontend (BFF proxy → Fastify API)
│   └── api/         # Fastify backend (6 domain modules)
├── packages/
│   ├── database/    # Prisma schema + seed
│   ├── pricing-engine/   # Pure pricing functions (shared)
│   ├── spine-calc/       # Hardcover spine formula (shared)
│   ├── pdf-engine/       # PDFKit + Sharp + archiver
│   ├── design-types/     # Zod schemas + Konva types
│   └── tsconfig/    # Shared TypeScript config
```

### 6 Backend Domain Modules (`apps/api/src/modules/`)

| Module | Tables/Concern |
|---|---|
| `catalog/` | GET /store/materials, /store/sizes, /store/cover-finishes, /store/accessories |
| `configurator/` | Design CRUD (POST/GET/PUT/DELETE /api/designs) |
| `pricing/` | POST /api/price-quote |
| `commerce/` | Cart + checkout (POST/GET/DELETE /api/cart/items, POST /api/checkout) |
| `production/` | (placeholder — PDF worker in sprint 2) |
| `materials/` | (read-only via catalog for MVP) |

### Spine Formula (source of truth: `packages/spine-calc/src/index.ts`)

```
spineWidthMm =
    (pages / 2) * paperCaliperMm    // text block (sheets, not pages)
  + boardThicknessMm * 2             // front + back board
  + endpaperThicknessMm * 2          // 2 endpapers
  + hingeAllowanceMm                 // 2.0mm for PUR
```

All spine calculations MUST go through `@booxury/spine-calc` — never duplicate the formula.
All pricing MUST go through `@booxury/pricing-engine` — server-authoritative, client prices ignored.

---

## Commands

```bash
cd booxury

# Install (use pnpm only — this is a pnpm workspace)
pnpm install

# Development (run both apps concurrently)
pnpm dev

# Individual apps
pnpm --filter @booxury/web dev      # Next.js on :3000
pnpm --filter @booxury/api dev      # Fastify on :3001

# Database
pnpm db:migrate    # Run Prisma migrations
pnpm db:seed       # Seed materials, sizes, demo users
pnpm db:studio     # Open Prisma Studio

# PDF test (standalone, no DB needed)
pnpm pdf:test

# Build
pnpm build
```

### Environment Variables

```bash
# booxury/.env (ask project owner for actual values)
DATABASE_URL="postgresql://booxury:booxury_dev@localhost:5433/booxury"
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
# R2 vars are optional for MVP (local filesystem fallback)
```

### Database (Podman)

```bash
# PostgreSQL 16 on port 5433
podman run -d --name booxury-pg \
  -e POSTGRES_DB=booxury \
  -e POSTGRES_USER=booxury \
  -e POSTGRES_PASSWORD=booxury_dev \
  -p 5433:5432 \
  docker.io/library/postgres:16-alpine
```

---

## Key Conventions

- **Workspace packages** are referenced as `workspace:*` in `package.json` — no version numbers needed.
- **Path aliases**: `@/*` → `./src/*`, `@modules/*` → `./src/modules/*`, `@lib/*` → `./src/lib/*`.
- **Error codes**: Use `AppError` from `apps/api/src/lib/errors.ts`. Codes: `UNAUTHORIZED`, `VALIDATION_FAILED`, `MATERIAL_DISABLED`, `NOT_FOUND`, etc.
- **Snapshot pattern**: `order_items` freeze `design_snapshot`, `finish_snapshot` at order time — immutable after payment.
- **PDF worker**: Runs as a separate process (`worker.ts`) polling `job_queue` table every 5s. API never blocks on PDF generation.
- **Database polling queue**: `job_queue` with `FOR UPDATE SKIP LOCKED` — no Redis needed for MVP.

---

## Wizard Flow

User navigates through 4 phases via Zustand store (`apps/web/lib/stores/configurator.ts`):

1. `/customize/base` — size, pages, paper, board, layout → real-time spine preview
2. `/customize/cover` — Konva editor (image + text + foil/emboss) → save design
3. `/customize/finish` — cover finish, strap, ribbon → real-time price
4. `/customize/review` — 2D composite, pre-flight checklist → add to cart

Each phase sets `phase` in Zustand → `WizardProgress` component reads it to show steps.

---

## Demo Credentials

```
Customer: demo@booxury.local / demo123
Admin:    admin@booxury.local / admin123
```

---

## Anti-Patterns (do not do)

- Do NOT import `prisma` directly in route handlers — import from `../server.js` (`fastify.prisma`)
- Do NOT calculate spine width or price in the frontend — call the API or use shared packages
- Do NOT write Konva code in a non-`'use client'` file — SSR will crash
- Do NOT commit with magic numbers — extract to named constants
- Do NOT leave TODOs in committed code
- Do NOT import backend modules from frontend (no cross-boundary imports)
