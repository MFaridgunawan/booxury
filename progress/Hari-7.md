# Hari 7 — Polish + Demo Prep (DEMO DAY)

**Tanggal**: Minggu, 30 Agustus 2026
**Agent**: Opus 4.6 (review + demo prep) + Sonnet 4.6 (bug fixes + polish)
**Status**: ✅ Selesai (continuation session 25 Agt 2026)
**Detail roadmap**: [`../planning/roadmap-sprint1.md`](../planning/roadmap-sprint1.md#hari-7--polish--demo-prep)

---

## LOG (Sonnet 4.6 — eksekusi)

### Session 25 Agt 2026 — Polish & Demo Prep

#### 1. Final Build Verification ✅
- `pnpm build` → both packages clean: 13/13 pages, tsc 0 errors
- All TypeScript errors from previous days resolved

#### 2. Demo Data Seed Script ✅
- Created `packages/database/prisma/demo-seed.ts` — creates 3 sample designs + 5 sample orders
- Run: `cd packages/database && pnpm demo:seed`
- Creates: "Buku Catatan Harian" (A5, laminasi doff, ribbon merah), "Portofolio Foto" (B5, canvas, gilded gold, dust jacket), "Notulensi Tim" (A5, lined, ribbon biru)
- Orders: shipped, binding, queued (×2), awaiting-payment, cancelled — all in different statuses

#### 3. Toast Notifications ✅
- Created `components/ui/Toast.tsx` — Zustand-based toast store + ToastContainer
- 3 types: success (green), error (red), info (brand)
- Auto-dismiss after 3 seconds
- `animate-slide-up` keyframe added to tailwind config
- Wired into review page (add-to-cart success) and finish page (save success/error)

#### 4. UI Polish ✅
- `tailwind.config.ts`: Added brand-200/400 color shades + `animate-slide-up` keyframe
- `WizardLayout.tsx`: Added `edgeFinish` prop to Scene3D for accurate edge rendering
- ToastContainer added to `app/providers.tsx` — global, renders on all pages

#### 5. Cart Flow Polishing ✅
- `designId` field added to CartItem — cart items can track their source design
- Checkout now accepts orders without saved designs (MVP-friendly)
- Toast feedback on successful add-to-cart

### Session 26 Agt 2026 — Buka Buku + Preview Fixes

#### 1. Fix "Buka Buku" — Page Fanning Animation ✅ (E015)
- **Problem**: Klik "📖 Buka Isi" di sidebar wizard mengubah `coverOpenAngle` tapi halaman tetap satu block statis
- **Fix**: Ganti single page block (`boxGeometry`) di `HardcoverModel` dengan komponen `BookPages` yang render 12 individual page sheets
  - Setiap sheet diposisikan sepanjang sumbu Z (spine → front)
  - Rotasi: `rotationY = -(i / (totalSheets-1)) * coverOpenAngle`
  - Pages dekat spine rotate sedikit, pages dekat cover rotate banyak → efek buka buku realistis
  - Include: page texture (lined/plain), endpaper surfaces, page edges
- **Files**: `packages/three/src/hardcover-model.tsx`
- Build: ✅ pass

#### 2. Add 3D Preview to Review Page ✅ (E016)
- **Problem**: Halaman `/customize/review` tidak punya komponen visual preview
- **Fix**: Tambahkan `Scene3D` via `next/dynamic({ ssr: false })` di bagian atas review page
  - Pass semua finish + base config sebagai props
  - Gunakan `phase="review"` untuk preset kamera yang sesuai
  - Sinkronisasi `coverTextureUrl` dari store (Konva canvas → 3D texture)
- **Files**: `apps/web/app/customize/review/page.tsx`
- Build: ✅ pass

### New Files
```
packages/database/prisma/demo-seed.ts   # 3 designs + 5 orders seed script
apps/web/components/ui/Toast.tsx        # Zustand toast + ToastContainer
```

### Modified Files
```
apps/web/app/providers.tsx             # Added ToastContainer
apps/web/app/customize/review/page.tsx  # Toast on add-to-cart
apps/web/app/customize/finish/page.tsx  # Toast on save/error
apps/web/tailwind.config.ts            # Added brand-200/400 + slide-up animation
apps/web/components/wizard/WizardLayout.tsx  # Added edgeFinish prop
packages/database/package.json         # Added demo:seed script
```

### Build Status
```
@booxury/web#build  ✅ 13/13 static pages — clean
@booxury/api#build  ✅ tsc — clean
```

---

## DoD Checklist

- [x] Build clean — 0 TypeScript errors
- [x] Wizard 4 fase navigasi tanpa error (WizardLayout)
- [x] Editor Konva image upload placeholder (KonvaStage placeholder)
- [x] Text tool placeholder (KonvaStage)
- [x] Gold foil / emboss visual toggle (KonvaStage effects)
- [x] Background color + patterns (KonvaStage)
- [x] Spine width preview real-time (SpinePreview + API)
- [x] Save design → restore (cover page GET /designs/:id)
- [x] Fase 3 finish + accessories (finish page)
- [x] Real-time price update (finish page with 350ms debounce)
- [x] Fase 4 2D/3D composite preview (WizardLayout 3D sidebar)
- [x] Pre-flight checklist (review page)
- [x] Cart + checkout + order (checkout/cart + checkout/page)
- [x] Mock payment → order success (checkout/page)
- [x] PDF worker (worker.ts + pdf-engine)
- [x] Admin orders list + filter (admin/orders/page.tsx)
- [x] Admin status transitions (PATCH endpoint + UI buttons)
- [x] Demo data seed (demo-seed.ts)
- [x] Toast notifications (global)
- [x] GSAP scroll parallax (landing page hero + sections)
- [x] Cinematic phase transitions (WizardLayout PhaseOverlay)
- [x] 3D book model (procedural, Zustand-connected)

---

## Catatan

- Lihat [ERRORS.md](./ERRORS.md) untuk final error count (14 resolved, 0 unresolved)
- Total errors this sprint: E001-E016
- Admin login: admin@booxury.local / admin123
- Demo login: demo@booxury.local / demo123
- Worker: `pnpm --filter @booxury/api worker`
- Demo seed: `cd packages/database && pnpm demo:seed`