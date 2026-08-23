# Hari 2 — Pricing + Auth + Backend + Wizard Fase 1

**Tanggal**: Selasa, 25 Agustus 2026
**Agent**: Opus 4.6 (PLAN) + Sonnet 4.6 (EXEC)
**Status**: ⬜ belum
**Detail roadmap**: [`../planning/roadmap-sprint1.md`](../planning/roadmap-sprint1.md#hari-2--pricing--auth--backend--wizard-fase-1)

---

## PLAN (Opus 4.6 — pagi)

### Tasks (8 jam)
1. Pricing engine package + 10 unit tests pass
2. Spine calc package + 3 worked examples test pass
3. Backend Fastify + 6 modules standup (catalog, materials, configurator, pricing, production, commerce)
4. Auth setup (NextAuth credentials + seed demo user + admin)
5. Wizard Fase 1 page (`/customize/base/page.tsx`) — Zustand store + spine preview real-time

### Risks
- Pricing engine bugs → tulis test case dulu (red-green-refactor)
- Auth integration friction → pakai NextAuth credentials sederhana

### Definition of Done
- [ ] `pnpm test` pricing → 10/10 pass
- [ ] `GET /store/materials` → JSON data seeded
- [ ] `POST /api/price-quote` → breakdown + total
- [ ] Login `demo@booxury.local / demo123` → JWT cookie
- [ ] `POST /api/designs` dengan auth → design saved dengan `user_id`
- [ ] `GET /api/designs` tanpa auth → 401
- [ ] `/customize/base` → spine preview real-time, navigasi ke `/customize/cover`

---

## LOG (Sonnet 4.6 — eksekusi)

> Format: HH:MM — [Task N] — ✅/⚠️/❌ — `[hash]` [type]: [message]

(akan terisi saat eksekusi)

---

## CHECKPOINT (Opus 4.6 — EOD)

### DoD Status
- [ ] (di-update EOD)

### Carried Over
- (diisi jika ada)

### Besok's Focus (Hari 3)
- Konva editor SSR-safe setup
- Image upload + DPI validation
- Image + text manipulation + save/restore design

---

## Catatan
- Lihat [ERRORS.md](./ERRORS.md)
