# Hari 4 — Editor Part 2 + Fase 3 Finish

**Tanggal**: Kamis, 27 Agustus 2026
**Agent**: Sonnet 4.6 (EXEC) + Opus 4.6 (review)
**Status**: ⬜ belum
**Detail roadmap**: [`../planning/roadmap-sprint1.md`](../planning/roadmap-sprint1.md#hari-4--editor-part-2--fase-3-finish)

---

## PLAN (Opus 4.6 — pagi)

### Tasks (8 jam)
1. Background color picker + patterns (solid, dots, lines, plain) — inline SVG kecil
2. Foil/emboss annotation visual (shadow + highlight overlay, simpan ke `finish_zones`)
3. Fase 3 page (`/customize/finish/page.tsx`) — cover finish + elastic strap + page ribbon
4. Real-time price update (Zustand computed + floating price bar)
5. Save finish config `PUT /api/designs/:id`
6. Full restore test (semua state kembali saat buka design URL lama)

### Risks
- Pattern SVG besar bikin canvas lag → inline SVG simpel, max 1KB per pattern
- Real-time price flicker → debounce Zustand selector

### Definition of Done
- [ ] Background color + 3 patterns bekerja
- [ ] Gold foil / emboss toggle kasih efek visual di canvas
- [ ] `finish_zones` tersimpan di design_payload
- [ ] Fase 3: cover finish + strap + ribbon toggle berfungsi
- [ ] Harga update real-time tanpa flicker
- [ ] Full restore: buka URL design lama → semua state kembali

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

### Besok's Focus (Hari 5)
- **3D Viewport CSS** (6-face box + GSAP camera + SVG textures) — khusus, Opus rancang lebih dulu
- Fase 4 review page (pakai 3D viewport)
- Pre-flight checklist
- Cart + checkout simplified

---

## Catatan
- Lihat [ERRORS.md](./ERRORS.md)
