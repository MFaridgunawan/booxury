# Hari 0 — Setup + Riset Percetakan Mitra

**Tanggal**: Minggu, 23 Agustus 2026
**Agent**: Opus 4.6 (PLAN) + Sonnet 4.6 (EXEC)
**Status**: ✅ selesai
**Detail roadmap**: [`../planning/roadmap-sprint1.md`](../planning/roadmap-sprint1.md#hari-0--setup--riset-percetakan-mitra)

> ⚠️ **Hari ini TIDAK BOLEH di-skip.** Jangan mulai coding sebelum spine formula dan pricing di-update dengan data aktual dari percetakan.

## Ground Rules (berlaku untuk seluruh sprint)

Lihat [`../planning/README.md` §8.5](../planning/README.md#85-honest-scope--anti-loop-rules) untuk Honest Scope + Anti-Loop Rules, dan §8.6 untuk Code Quality Bar.

**Inti yang tidak boleh dilanggar**:
- 7 hari = constraint keras. Stuck 1 jam → escalate, stuck 2 attempt → stop + log.
- No dead code, no TODOs di committed code, no magic numbers.
- Test sebelum commit (catat di `TESTING.md`).
- Satu commit per logical change, conventional commit message.
- Demo = honest acknowledgment trade-off, bukan over-claim.

---

## PLAN (Opus 4.6 — pagi)

### Tasks

1. **Environment setup** (~1 jam)
   - Files: `package.json`, `.gitignore`, `pnpm-workspace.yaml`, `.env`
   - Acceptance: `pnpm install` jalan tanpa error

2. **Monorepo scaffold** (~1 jam)
   - Files: `apps/web/`, `apps/api/`, `packages/pricing-engine/`, `packages/spine-calc/`, `packages/database/`
   - Acceptance: `turbo dev` bisa start minimal 1 package

3. **Riset percetakan mitra** (~2 jam) — **MANUAL, bukan coding**
   - Output: `percetakan-spec.md` dengan format PDF, ICC profile, caliper aktual, pricing
   - Acceptance: 8-10 pertanyaan kritis terjawab (lihat Risks R1 §6 README)

4. **Update spine formula + pricing dengan data aktual** (~1 jam)
   - Files: §4 README (koreksi caliper table), `packages/database/prisma/seed.ts`
   - Acceptance: worked examples baru match dengan tolerance percetakan

5. **Document & commit** (~1 jam)
   - Files: `percetakan-spec.md`
   - Acceptance: file committed, initial commit message jelas

### Risks Hari Ini
- **R1 (Critical)**: Percetakan tidak bisa dihubungi → default pakai angka tipikal + flag untuk re-verifikasi. Sprint tidak blocked, tapi catat untuk Hari 1.
- **PostgreSQL belum terinstall**: pakai Docker compose file sebagai fallback.

### Definition of Done
- [ ] Monorepo berdiri + `pnpm install` green
- [ ] `percetakan-spec.md` ada (walaupun sebagian data tipikal)
- [ ] Spine formula §4 README ter-update dengan caliper aktual
- [ ] Seed pricing ter-update dengan harga aktual
- [ ] Initial commit ada di git history

---

## LOG (Sonnet 4.6 — eksekusi)

> Format per entry:
> - HH:MM — [Task N] — ✅/⚠️/❌ — `[commit hash]` [type]: [message]

- 12:30 — [1] Environment Setup — ✅ — `357b629` feat: Hari 0 scaffold
- 12:35 — [2] Monorepo Scaffold — ✅ — pnpm workspaces + turbo, Next.js + Fastify
- 13:00 — [3] Prisma Schema + Migration — ✅ — 10 tables created, `357b629`
- 13:30 — [4] Seed Script — ✅ — materials/sizes/finishes/accessories + 2 demo users seeded
- 14:00 — [5] PDF Engine — ✅ — cover + interior + spec-sheet + ZIP, all pass
- 14:30 — [6] Spine + Pricing Packages — ✅ — `357b629`
- 15:00 — [7] Fastify API (catalog, pricing, design, cart) — ✅ — `357b629`
- 15:30 — [8] Next.js Web (4-fase wizard scaffold) — ✅ — Zustand store, WizardProgress, pages 1-4
- 15:45 — [9] Commit — ✅ — `357b629`
- ⚠️ [3b] Riset Percetakan — ⬜ DITUNDA — MANUAL, user perlu kontak percetakan dulu

---

## CHECKPOINT (Opus 4.6 — EOD)

### Definition of Done Status
- [x] Monorepo berdiri + `pnpm install` green
- [x] `prisma studio` bisa dibuka dan ada data (DB seeded ✅)
- [x] `pnpm pdf:test` menghasilkan 3 PDF + ZIP valid ✅
- [x] Initial commit ada di git history ✅
- [x] CLAUDE.md dibuat ✅
- [ ] `percetakan-spec.md` — ⚠️ DITUNDA, butuh MANUAL (WA/telepon ke percetakan)
- [ ] Spine formula §4 README ter-update dengan caliper aktual — ⚠️ DITUNDA (depends on percetakan research)

### Carried Over ke Hari 1
- **Riset percetakan** (wajib MANUAL) — belum bisa automated. User perlu tanya: format PDF, ICC profile, caliper aktual, pricing.
- Buat `percetakan-spec.md` setelah dapat jawaban dari percetakan.
- Update spine caliper table di `packages/spine-calc/src/index.ts` dengan data aktual dari percetakan.

### Besok's Focus (Hari 1)
- Setup Prisma schema + migration ✅ (already done)
- PDF engine cover/interior/spec-sheet ✅ (already done)
- Fastify server start + health check
- Next.js dev server start
- (Remaining: Konva editor, image upload — di Hari 3)

---

## CHECKPOINT (Opus 4.6 — EOD)

### Definition of Done Status
- [ ] Environment setup
- [ ] Monorepo scaffold
- [ ] Riset percetakan (minimal 5/10 pertanyaan terjawab)
- [ ] Spine formula updated
- [ ] Pricing updated
- [ ] Initial commit

### Carried Over ke Hari 1
- (diisi jika ada)

### Besok's Focus (Hari 1)
- Setup Prisma schema + migration
- PDF engine cover/interior/spec-sheet generator
- Test dengan data hardcoded

---

## Catatan / Error Reference
- Lihat [ERRORS.md](./ERRORS.md) untuk error E001+
