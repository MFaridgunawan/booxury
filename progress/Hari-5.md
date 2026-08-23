# Hari 5 — 3D Viewport CSS + Fase 4 Review + Cart

**Tanggal**: Jumat, 28 Agustus 2026
**Agent**: Opus 4.6 (3D design + review) + Sonnet 4.6 (implementation)
**Status**: ⬜ belum
**Detail roadmap**: [`../planning/roadmap-sprint1.md`](../planning/roadmap-sprint1.md#hari-5--fase-4-review--pre-flight--cart)
**Spesial**: Hari ini pakai **Pure CSS 3D + GSAP + Procedural SVG Textures** (bukan R3F — lihat alasan di [`../planning/README.md` §2](../planning/README.md#2-module-tech-stack--architecture))

---

## PLAN (Opus 4.6 — pagi)

### Tasks (8 jam)

#### 3D Viewport (5 jam) — bagian inti hari ini
1. **6-face DOM box construction** (1.5 jam)
   - Files: `apps/web/components/3d-viewport/BookModel.tsx`
   - CSS: `perspective`, `transform-style: preserve-3d`, `will-change: transform`
   - Front, back, spine, foredge, top, bottom faces dengan translateZ sesuai book dimensions

2. **SVG filter textures** (1.5 jam) — procedural, zero external assets
   - Files: `apps/web/lib/3d/textures.ts`
   - Leather: `feTurbulence` + `feColorMatrix` brown
   - Gold foil: `linearGradient` + `feGaussianBlur` shimmer
   - Canvas: `feTurbulence` diagonal weave
   - Paper: `feTurbulence` sepia overlay

3. **GSAP camera controller** (1 jam)
   - Files: `apps/web/lib/3d/camera.ts`
   - Steps: overview (-25°, z=200), front (-15°, z=120), spine (-90°, z=40), back (-200°, z=120)
   - Easing: `power3.inOut`, duration 800ms

4. **Zustand viewport slice + Stepper UI** (1 jam)
   - Files: `apps/web/lib/stores/configurator.ts` (extend), `Stepper.tsx`
   - State: `currentStep`, `orbitAngleY`, `zoomScale`, `isTransitioning`

#### Fase 4 + Cart (3 jam)
5. **Fase 4 review page** (1.5 jam) — pakai 3D viewport sebagai preview
6. **Pre-flight checklist** (1 jam) — `POST /api/preflight` + UI checklist
7. **Cart page + simplified checkout** (30 menit) — mock payment

### Risks
- SVG filter perf di low-end mobile → respect `prefers-reduced-motion`, flat color fallback
- Konva ↔ DOM 3D sync (texture mapping dari canvas → DOM face) → render Konva → dataURL → CSS background
- Camera transition glitchy → test di Safari iOS (beda CSS 3D behavior)

### MCP Tools (hari ini)
- **testsprite**: Verifikasi visual 3D viewport (face rendering, texture mapping, camera transitions). Invoke via Claude Code MCP setelah Task 1-4 selesai untuk screenshot + visual diff.

### Definition of Done
- [ ] 3D book visible di `/customize/review` dengan 6 face
- [ ] Click stepper (Overview/Front/Spine/Back) → smooth GSAP transition
- [ ] Leather grain + gold foil + canvas texture terlihat jelas
- [ ] Zustand state sync antara stepper ↔ camera dalam 16ms
- [ ] Pre-flight checklist auto-check jalan
- [ ] Add to Cart blocked sampai checklist pass
- [ ] Cart: list items + total
- [ ] Checkout → order `awaiting_payment` → mock payment → `queued`

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

### Besok's Focus (Hari 6)
- Queue worker (database polling `FOR UPDATE SKIP LOCKED`)
- Worker generate 3 PDF + ZIP dari snapshot
- Admin orders list + status transitions + ZIP download

---

## Catatan
- Lihat [ERRORS.md](./ERRORS.md)
- Lihat detail arsitektur 3D di `../planning/README.md` §2 + Risks R6 (removed) + new SVG filter perf risk
