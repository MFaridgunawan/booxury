# Booxury — Sprint 1 (MVP)

> **Custom Hardcover Notebook Web-to-Print** — Politeknik Manufaktur Bandung project-based learning
> Sprint: 7 hari (Minggu 23 Agt – Minggu 30 Agt 2026) | Demo target: 30 Agt 2026
> **Build status**: ✅ @booxury/web 13/13 pages clean · @booxury/api tsc clean

---

## ⚡ Quick Start (untuk agent baru, esp. Sonnet 4.6)

```bash
cd booxury

# 1. Install
pnpm install

# 2. Database (Podman PostgreSQL 16 on port 5433)
podman run -d --name booxury-pg \
  -e POSTGRES_DB=booxury -e POSTGRES_USER=booxury \
  -e POSTGRES_PASSWORD=booxury_dev -p 5433:5432 \
  docker.io/library/postgres:16-alpine

# 3. Prisma setup
cd packages/database
pnpm prisma migrate dev --name init
pnpm prisma db seed       # materials, sizes, demo users
pnpm demo:seed            # 3 demo designs + 5 demo orders
cd ../..

# 4. Run
pnpm dev                  # Next.js :3000 + Fastify :3001 concurrently

# 5. PDF worker (separate terminal)
pnpm --filter @booxury/api worker
```

**Demo login**:
- Customer: `demo@booxury.local / demo123`
- Admin: `admin@booxury.local / admin123`

**Build verification**:
```bash
pnpm build                 # full monorepo — both packages must be clean
curl http://localhost:3001/health   # API liveness
```

---

## 🎯 Untuk Sonnet 4.6 (Tepat Sasaran)

**Sebelum mulai kerja**, baca:
1. `../progress/README.md` — sprint summary + 3D decision + agent guidance
2. `../progress/ERRORS.md` — 7 errors history (jangan ulang!)
3. `../progress/Hari-N.md` — hari ini (PLAN + LOG + CHECKPOINT)
4. `CLAUDE.md` (root ini) — konvensi stack

**Prinsip kerja Sonnet**:
- Eksekusi 1 task → update LOG di `Hari-N.md` dengan format `HH:MM — [Task N] — ✅/⚠️/❌`
- Append error baru ke `ERRORS.md` dengan format `E[NNN]`
- Build verify setelah task fungsional (`pnpm --filter @booxury/web build`)
- **Jangan pilih library baru** — pakai yang sudah ada di package.json
- **Jangan import dari backend ke frontend** atau sebaliknya
- **Server-authoritative**: hitung price di API, frontend cuma display
- **Snapshot pattern**: order_items freeze design/finish config saat order

**Escalate ke Opus kalau**:
- Build gagal 2x berturut-turut dengan error yang sama
- TypeScript error recursive (>5 level)
- Keputusan desain affect > 3 file
- Butuh input user (data percetakan, dll)

---

## 🏗️ Stack & Architecture

**Monorepo**: pnpm workspaces + Turborepo at `booxury/`

| Layer | Tech | Port |
|---|---|---|
| Web (BFF proxy) | Next.js 15 App Router + Zustand + Konva.js + Tailwind | 3000 |
| API | Fastify + Prisma | 3001 |
| DB | PostgreSQL 16 (via podman) | 5433 |
| Auth | NextAuth v5 (credentials → Fastify JWT) | — |

**6 backend modules** di `apps/api/src/modules/`:
- `catalog/` — `/store/materials`, `/store/sizes`, `/store/accessories`
- `configurator/` — `/api/designs` CRUD
- `pricing/` — `/api/price-quote`
- `commerce/` — `/api/cart/items`, `/api/checkout`
- `admin/` — `/admin/*` (orders, materials)
- `auth/` (plugin) — `/api/auth/login`

**Shared packages**:
- `@booxury/pricing-engine` — pure pricing functions + 13 tests
- `@booxury/spine-calc` — hardcover spine formula + 6 tests
- `@booxury/design-types` — Zod schemas + Konva types
- `@booxury/database` — Prisma schema + seed
- `@booxury/three` — 3D scene helpers (Hari 5)

---

## 📂 Folder Layout

```
booxury/
├── apps/
│   ├── web/                    # Next.js 15
│   │   ├── app/                # routes (login, customize/*, checkout/*, admin/*)
│   │   ├── components/
│   │   │   └── configurator/
│   │   │       ├── CanvasEditor/  # Konva editor (Hari 3)
│   │   │       └── SpinePreview.tsx
│   │   ├── lib/
│   │   │   ├── auth.ts         # NextAuth v5
│   │   │   └── stores/configurator.ts  # Zustand
│   │   └── middleware.ts       # route protection
│   └── api/                    # Fastify
│       ├── src/
│       │   ├── server.ts
│       │   ├── types.ts        # Fastify augmentations
│       │   ├── plugins/auth.ts
│       │   └── modules/
│       └── tsconfig.json
├── packages/
│   ├── database/               # Prisma schema + seed
│   ├── pricing-engine/         # pure TS + tests
│   ├── spine-calc/             # pure TS + tests
│   ├── design-types/           # Zod schemas
│   └── three/                  # 3D helpers
└── pnpm-workspace.yaml
```

---

## 🚫 Anti-Patterns

- ❌ Import `prisma` langsung di route handler → pakai `fastify.prisma`
- ❌ Hitung spine/price di frontend → pakai shared packages atau API
- ❌ Konva code di non-`'use client'` file → SSR crash
- ❌ Magic numbers → extract ke named constants
- ❌ TODOs di committed code
- ❌ Import backend module dari frontend (cross-boundary)
- ❌ Download external 3D assets (procedural only — see `progress/README.md` 3D Decision)

---

## 📋 Daily Status

Lihat `../progress/README.md` untuk sprint summary atau `progress/Hari-N.md` per hari.

Current: **Hari 4 in progress** (5/5 DoD complete; restore design carry-over).

---

## 🔗 Key References

- Sprint roadmap: `../planning/roadmap-sprint1.md`
- Domain specs: `../planning/README.md` (§1–8)
- Demo flow (26 steps): `../planning/roadmap-sprint1.md` Hari 7
- Error history: `../progress/ERRORS.md`
