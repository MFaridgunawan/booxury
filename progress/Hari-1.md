# Hari 1 — Foundation + PDF Engine Core

**Tanggal**: Senin, 24 Agustus 2026
**Agent**: Opus 4.6 (PLAN) + Sonnet 4.6 (EXEC)
**Status**: 🔄 in-progress
**Detail roadmap**: [`../planning/roadmap-sprint1.md`](../planning/roadmap-sprint1.md#hari-1--foundation--pdf-engine-core)

---

## PLAN (Opus 4.6 — pagi)

### Tasks (8 jam)
1. Setup monorepo (`pnpm-workspace.yaml`, `turbo.json`, root `package.json`)
2. Prisma schema + initial migration (§3 README)
3. Seed script (materials, sizes, finishes, accessories, demo users)
4. PDF engine package (`packages/pdf-engine/`)
5. Cover PDF generator (3-panel: back | spine | front, dengan turn-in + bleed)
6. Interior PDF generator (lined/plain layout)
7. Spec sheet PDF generator (tabel ukuran, kertas, finish, aksesoris)
8. ZIP archiver + smoke test: `pnpm pdf:test` menghasilkan 3 PDF + ZIP valid

### Risks
- Prisma migration fail → fallback: reset DB, ulang dari schema
- Ghostscript issue → skip CMYK untuk MVP, RGB cukup

### Definition of Done
- [ ] `pnpm dev` bisa start minimal apps/api
- [ ] `prisma studio` bisa dibuka dan ada data
- [ ] `pnpm pdf:test` menghasilkan 3 PDF + ZIP, semua bisa dibuka di PDF reader
- [ ] Git history ada commit per task besar

---

## LOG (Sonnet 4.6 — eksekusi)

> Format: HH:MM — [Task N] — ✅/⚠️/❌ — `[hash]` [type]: [message]

- 17:30 — [1] API Fixes — ✅ — `72732d7` fix: DATABASE_URL env, Prisma types
  - Add DATABASE_URL to turbo.json env passthrough
  - Add Fastify type augmentation (apps/api/src/types.ts)
  - Create packages/database/src/index.ts
  - Add tsconfig.json to packages/database + apps/web
- 01:00 — [2] Full Customization System — ✅ — `f7ffeea` feat: semua aspek kustomisasi hardcover
  - design-types: add CornerShape, EdgeFinish, hasDustJacket, headbandCode, ribbonCodes to FinishConfig
  - configurator store: fix BaseConfig field names (paper→paperCode, board→boardCode), add endpaperCode
  - Finish page: full rewrite — cover finish (4), corner shape (square/round), edge finish (6), dust jacket toggle, headband colors (4), ribbon markers (max 2)
  - Base page: add endpaper selector (ENDFLAT/ENDPLAIN/ENDPAT), fix field names to match schema
  - Review page: full config summary, real-time price with all finish modifiers, spine validation
  - Pricing engine: edge finish modifiers (plain/gilded/sprayed/stenciled), dust jacket, headband/ribbon pricing, volume discounts 5%/8%
  - Catalog routes: new static endpoints /corner-shapes, /edge-finishes, /headbands, /ribbons
  - API pricing route: accepts all new fields, signature binding validation (min 80 hal, kelipatan 4)
  - GitHub push: `f7ffeea` ✅
- 17:40 — [2] Dev Server Verify — ✅
  - API: GET /store/sizes ✅ → 3 size presets
  - API: GET /store/materials?type=paper ✅ → 4 paper materials
  - API: POST /price-quote ✅ → spine=11.49mm, total=Rp85.000
  - Web: http://localhost:3000 ✅ → HTTP 200, title correct

---

## CHECKPOINT (Opus 4.6 — EOD)

### DoD Status
- [x] Monorepo scaffold ✅ — pnpm workspaces + turbo, Next.js + Fastify (Hari 0)
- [x] Prisma schema + migration ✅ — 10 tables, seeded (Hari 0)
- [x] PDF engine ✅ — 3 PDFs + ZIP generated (Hari 0)
- [x] `pnpm dev` bisa start ✅ — API :3001, Web :3000
- [x] API endpoints: GET /store/sizes ✅, GET /store/materials ✅, POST /price-quote ✅
- [x] Database seeded with materials/sizes/accessories/demo users ✅

### Carried Over
- (none — Hari 0 + 1 deliverables complete)

### Besok's Focus (Hari 2)
- NextAuth credentials setup + JWT
- Wizard Fase 1 page complete (spine preview + price)
- API: POST /api/designs (auth protected)
- API: GET /store/accessories, /store/cover-finishes

---

## CHECKPOINT (Opus 4.6 — EOD)

### DoD Status
- [ ] (di-update EOD)

### Carried Over
- (diisi jika ada)

### Besok's Focus (Hari 2)
- Pricing engine package + spine-calc package
- Backend Fastify + 6 modules standup
- NextAuth credentials + seed users
- Wizard Fase 1 page

---

## Catatan
- Lihat [ERRORS.md](./ERRORS.md) untuk error E001+
