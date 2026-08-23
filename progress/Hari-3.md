# Hari 3 — Editor Konva Part 1

**Tanggal**: Rabu, 26 Agustus 2026
**Agent**: Sonnet 4.6 (EXEC) + Opus 4.6 (review)
**Status**: ⬜ belum
**Detail roadmap**: [`../planning/roadmap-sprint1.md`](../planning/roadmap-sprint1.md#hari-3--editor-konva-part-1)

---

## PLAN (Opus 4.6 — pagi)

### Tasks (8 jam)
1. Konva setup SSR-safe (`'use client'`, dynamic import)
2. Image upload + DPI validation (server-side Sharp + client-side warning)
3. Konva image manipulation (drag, resize, rotate, delete)
4. Text tool (add, edit inline, font + color, delete) — font whitelist 4 font
5. Save design endpoint `POST /api/designs`
6. Restore design `GET /api/designs/:id` + `?design=ID` query param populate editor

### Risks
- Konva SSR crash di `/customize/cover` → wajib `'use client'`, dynamic import
- DPI warning tidak muncul → validasi edge case (PNG tanpa DPI metadata)

### Definition of Done
- [ ] Upload image → muncul di canvas, drag/resize berfungsi
- [ ] DPI < 100 → error merah, blocked
- [ ] DPI < 300 → warning kuning
- [ ] Text bisa ditambah, diedit, dihapus
- [ ] Save → design tersimpan, ID muncul di response
- [ ] Buka `?design=ID` → canvas ter-restore

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

### Besok's Focus (Hari 4)
- Background color + patterns (Konva layer)
- Foil/emboss annotation visual
- Fase 3 page (cover finish + strap + ribbon)
- Real-time price update
- Save finish config + full restore test

---

## Catatan
- Lihat [ERRORS.md](./ERRORS.md)
