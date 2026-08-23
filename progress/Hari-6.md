# Hari 6 — PDF Worker + Admin Dashboard

**Tanggal**: Sabtu, 29 Agustus 2026
**Agent**: Sonnet 4.6 (EXEC) + Opus 4.6 (review)
**Status**: ⬜ belum
**Detail roadmap**: [`../planning/roadmap-sprint1.md`](../planning/roadmap-sprint1.md#hari-6--pdf-worker--admin-dashboard)

---

## PLAN (Opus 4.6 — pagi)

### Tasks (8 jam)
1. **Queue worker setup** (database polling `FOR UPDATE SKIP LOCKED`, polling 5 detik)
2. Worker handler: generate 3 PDF (cover + interior + spec-sheet) + ZIP dari `order_items.*_snapshot`
3. Worker trigger otomatis saat checkout success
4. Frontend polling `GET /api/orders/:id` → cek `production_zip_url` tersedia
5. Admin orders list page (`/admin/orders`)
6. Admin status transitions (queued → binding → shipped, queued → cancelled)
7. Admin ZIP download (`GET /api/admin/orders/:id/zip`)

### Risks
- Worker blocking main process → polling di worker.ts terpisah, setInterval
- Worker timeout → retry mechanism (3 attempt), set status `failed` setelah itu

### MCP Tools (hari ini)
- **Playwright**: E2E spec untuk flow admin (login admin → list orders → filter status → update status → download ZIP). Sonnet generate spec di Task 7, run end-of-day.
- **testsprite**: Verifikasi UI admin dashboard (status badge colors, table responsiveness, ZIP download flow).

### Definition of Done
- [ ] Checkout success → PDF worker triggered dalam 5 detik
- [ ] Worker generate 3 PDF + ZIP < 30 detik untuk MVP
- [ ] Admin orders list dengan filter by status
- [ ] Klik status button → order status berubah
- [ ] Download ZIP → file valid berisi 3 PDF

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

### Besok's Focus (Hari 7 — DEMO DAY)
- Bug fixes dari 6 hari
- UI polish minimal (loading states, toast, empty states)
- Seed demo data (3 designs, 5 orders, 1 demo user)
- 26-step smoke test pass
- Screenshot 7 frame untuk slide demo
- Video rekam 90 detik

---

## Catatan
- Lihat [ERRORS.md](./ERRORS.md)
- Testing tools (Playwright, testsprite) diasumsikan sudah ter-install di hari ini — Sonnet bisa integrate E2E spec untuk flow admin
