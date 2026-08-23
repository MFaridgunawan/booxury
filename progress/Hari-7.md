# Hari 7 — Polish + Demo Prep (DEMO DAY)

**Tanggal**: Minggu, 30 Agustus 2026
**Agent**: Opus 4.6 (review + demo prep) + Sonnet 4.6 (bug fixes + polish)
**Status**: ⬜ belum
**Detail roadmap**: [`../planning/roadmap-sprint1.md`](../planning/roadmap-sprint1.md#hari-7--polish--demo-prep)

---

## PLAN (Opus 4.6 — pagi)

### Tasks (7 jam)
1. **Bug fixes** (2 jam) — dari list yang dikumpulkan 6 hari
2. **UI polish minimal** (1.5 jam) — loading skeleton, toast notifications, empty states, wizard progress bar
3. **Seed demo data** (1.5 jam) — 3 designs (berbagai konfigurasi) + 5 orders (various status) + 1 demo user
4. **End-to-end smoke test** (1 jam) — 26 steps manual, semua pass
5. **Demo documentation** (1 jam) — 7 screenshot + video rekam 90 detik

### Critical (jangan di-skip)
- 26-step smoke test harus pass (lihat `roadmap-sprint1.md` §Hari 7)
- 23-item Definition of Done checklist terpenuhi
- Screenshot 7 frame tersedia untuk slide

### Risks
- Demo flow broken last-minute → smoke test mulai pagi, bukan sore
- Bug fatal di 3D viewport → fallback ke 2D composite preview di Fase 4 (sudah ada kode)

### MCP Tools (hari ini)
- **Playwright**: Auto-run 26-step smoke test sebagai regression check. Sonnet eksekusi sebelum demo.
- **testsprite**: Final visual check 7 screenshot untuk slide deck + verifikasi tidak ada regression visual dari 6 hari sebelumnya.

### Definition of Done
- [ ] Demo user bisa login
- [ ] Wizard 4 fase navigasi tanpa error
- [ ] Editor image upload + drag/resize/rotate
- [ ] Text tool dengan font + color
- [ ] Gold foil / emboss visual toggle
- [ ] Background color + patterns
- [ ] Spine width preview real-time
- [ ] Save design → restore
- [ ] Fase 3 finish + accessories
- [ ] Real-time price update
- [ ] Fase 4 2D/3D composite preview
- [ ] Pre-flight checklist
- [ ] Cart + checkout + order
- [ ] Mock payment → PDF worker
- [ ] PDF generator 3 file valid
- [ ] ZIP download
- [ ] Admin orders list + filter
- [ ] Admin status transitions
- [ ] 26-step smoke test pass
- [ ] 7 screenshot tersedia
- [ ] Video 90 detik ter-record
- [ ] Final commit + tag `v0.1.0-demo`

---

## LOG (Sonnet 4.6 — eksekusi)

> Format: HH:MM — [Task N] — ✅/⚠️/❌ — `[hash]` [type]: [message]

(akan terisi saat eksekusi)

---

## CHECKPOINT (Opus 4.6 — EOD — POST-DEMO)

### DoD Status Final
- [ ] (di-update setelah demo)

### Demo Result
- (catat feedback dosen)

### Sprint 1 Retrospective
- Apa yang berjalan baik
- Apa yang harus diperbaiki di Sprint 2
- Tech debt yang di-akumulasi

### Sprint 2 Wishlist (post-demo todo)
- Real Midtrans integration
- CMYK conversion (RGB → sesuai ICC profile percetakan)
- R3F 3D enhancement (jika perlu real lighting/materials di atas CSS 3D)
- Admin material CRUD UI
- Unit test coverage: pricing 100%, modules 60%+
- E2E Playwright tests untuk critical flows
- Lighthouse performance audit
- UU PDP compliance + cookie consent
- Queue upgrade: BullMQ + Redis
- GSAP → Motion One (MIT) jika komersial

---

## Catatan
- Lihat [ERRORS.md](./ERRORS.md) untuk final error count
- Total git commits selama sprint: (akan dihitung)
