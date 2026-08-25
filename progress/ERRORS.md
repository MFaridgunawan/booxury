# Errors — Booxury Sprint 1

> Cumulative error log lintas hari. Di-centralized supaya debugging terstruktur dan tidak menebak-nebak.
> Setiap error baru → entry baru di sini dengan format konsisten.

## Format Entry

```
### E[NNN] — [Tanggal] — Hari X — [Severity: low/medium/high/critical]
- **Task**: [nama task yang trigger error]
- **Symptom**: [apa yang terjadi — error message, unexpected output, dll]
- **Repro**: [langkah reproduce]
- **Root cause**: [penyebab setelah investigate]
- **Fix**: [solusi yang diterapkan]
- **Files affected**: [list path]
- **Prevention**: [cara avoid di future]
- **Status**: ✅ resolved / ⚠️ workaround / ❌ unresolved
```

## Index by Type

| Type | Count | Error IDs |
|---|---|---|
| Module not found | 5 | E001, E002, E003, E004, E005 |
| TypeScript type | 4 | E006, E007, E011, E012 |
| Build configuration | 2 | E008, E009 |
| Import order | 1 | E010 |
| 3D / Preview | 2 | E015, E016 |

## Errors

### E001 — 2026-08-28 — Hari 5 — high
- **Task**: Type check `packages/three/` + build web app
- **Symptom**: `Module not found: Can't resolve './ribbon-marker'` — webpack error di Next.js build
- **Repro**: `pnpm --filter @booxury/web build` → webpack fails on `@booxury/three` barrel
- **Root cause**: `packages/three/src/index.ts` exports `RibbonMarker` from `./ribbon-marker`, tapi file tersebut tidak ada. `RibbonFlutter` didefinisikan inline di `hardcover-model.tsx`.
- **Fix**: Hapus export `./ribbon-marker` dari barrel. Simplify index.ts hanya export komponen yang benar-benar dipakai web app (`Scene3D`, `HardcoverModel`, camera rigs).
- **Files affected**: `packages/three/src/index.ts`
- **Prevention**: Jangan export file yang tidak ada. Review barrel exports setelah setiap sesi coding.
- **Status**: ✅ resolved

### E002 — 2026-08-28 — Hari 5 — medium
- **Task**: Type check `packages/three/`
- **Symptom**: `Cannot find module 'next/dynamic'` — TypeScript error di `packages/three/src/client-only.tsx`
- **Repro**: `pnpm --filter @booxury/three exec tsc --noEmit`
- **Root cause**: `packages/three/src/client-only.tsx` import `from 'next/dynamic'`, tapi `next` adalah peerDependency (bukan regular dep), dan tsconfig packages/three tidak me-resolve peer deps dengan benar. Lebih fundamental: Next.js-specific imports tidak seharusnya ada di shared workspace package.
- **Fix**: Hapus `client-only.tsx` dari barrel exports. Web app sudah punya pola `dynamic({ ssr: false })` sendiri di `landing-canvas-wrapper.tsx` dan `wizard-canvas.tsx`.
- **Files affected**: `packages/three/src/index.ts`, `packages/three/src/client-only.tsx`
- **Prevention**: Shared workspace packages (packages/three) tidak boleh punya Next.js-specific imports. Itu tanggung jawab app-specific code.
- **Status**: ✅ resolved

### E003 — 2026-08-28 — Hari 5 — medium
- **Task**: Import wizard pages dari shared components
- **Symptom**: `Module not found: WizardProgress` — semua halaman customize/* tidak bisa resolve WizardProgress
- **Repro**: Build web app → semua halaman customize/* fail
- **Root cause**: Wizard pages di `app/customize/*/page.tsx` (4 level deep) menggunakan `../../../components/` tapi seharusnya `../../components/`.
- **Fix**: Ubah semua import depth di wizard pages dari `../../../components/` → `../../components/` (2 level up, bukan 3).
- **Files affected**: `apps/web/app/customize/base/page.tsx`, `apps/web/app/customize/cover/page.tsx`, `apps/web/app/customize/finish/page.tsx`, `apps/web/app/customize/review/page.tsx`, `apps/web/app/customize/layout.tsx`
- **Prevention**: Gunakan path aliases (`@/components/...`) konsisten untuk hindari depth guessing.
- **Status**: ✅ resolved

### E004 — 2026-08-28 — Hari 5 — medium
- **Task**: Import Zustand store dari wizard pages
- **Symptom**: `Module not found: ../../lib/stores/configurator` di semua halaman customize
- **Repro**: Build web app setelah fix E003
- **Root cause**: Sama masalah depth — wizard pages 4 level deep perlu `../../../lib/` (3 level up), bukan `../../lib/` (2 level).
- **Fix**: Ubah `../../lib/stores/configurator` → `../../../lib/stores/configurator` di semua halaman customize.
- **Files affected**: `apps/web/app/customize/base/page.tsx`, `apps/web/app/customize/cover/page.tsx`, `apps/web/app/customize/finish/page.tsx`, `apps/web/app/customize/review/page.tsx`
- **Prevention**: Path aliases `@/lib/stores/configurator` menghilangkan masalah ini.
- **Status**: ✅ resolved

### E005 — 2026-08-28 — Hari 5 — low
- **Task**: Type check `packages/three/`
- **Symptom**: `Cannot find module 'react'` di 4 file packages/three
- **Repro**: `pnpm --filter @booxury/three exec tsc --noEmit`
- **Root cause**: `packages/three/package.json` tidak punya `@types/react` di devDependencies (React sendiri peer dep, tapi TypeScript butuh types).
- **Fix**: `pnpm --filter @booxury/three add -D @types/react @types/react-dom`
- **Files affected**: `packages/three/package.json`
- **Prevention**: Workspace packages yang pakai JSX perlu @types/react di devDependencies meskipun React peer dep.
- **Status**: ✅ resolved

### E006 — 2026-08-28 — Hari 5 — low
- **Task**: Import Scene3DProps type di wizard-canvas
- **Symptom**: `Module '"@booxury/three"' has no exported member 'Scene3DProps'`
- **Repro**: Build web app
- **Root cause**: `packages/three/src/index.ts` re-export `Scene3D` sebagai value, tapi `Scene3DProps` adalah type-only export. Re-export value tidak menyertakan type secara otomatis dengan `isolatedModules`.
- **Fix**: Tambah `export type { Scene3DProps } from './scene-3d'` di barrel (saat ini sudah ter-export). Build ter-attempt ulang otomatis setelah E001-E005 fixed, dan error ini ikut hilang karena webpack resolution berbeda dari tsc.
- **Files affected**: `packages/three/src/index.ts`, `apps/web/components/three/wizard-canvas.tsx`
- **Prevention**: Gunakan `export type { Foo }` eksplisit untuk type-only exports di barrel.
- **Status**: ✅ resolved

### E007 — 2026-08-28 — Hari 5 — medium
- **Task**: Display base config di cover page
- **Symptom**: `Property 'paper' does not exist on type '{ size?: "A5" | ... }'` — TypeScript error di customize/cover/page.tsx
- **Repro**: `pnpm --filter @booxury/web build`
- **Root cause**: `BaseConfig` type dari `@booxury/design-types` punya field `paperCode` dan `boardCode`, bukan `paper` dan `board`. Cover page mengakses `base.paper` dan `base.board` yang tidak ada.
- **Fix**: Ubah `base.paper` → `base.paperCode` dan `base.board` → `base.boardCode` di `apps/web/app/customize/cover/page.tsx`.
- **Files affected**: `apps/web/app/customize/cover/page.tsx` (baris 64-65)
- **Prevention**: Check Zod schema type actual field names sebelum akses. Field display names berbeda dari code names — perlu lookup table terpisah untuk UI labels.
- **Status**: ✅ resolved

### E008 — 2026-08-28 — Hari 5 — high
- **Task**: TypeScript compilation web app
- **Symptom**: `Cannot resolve 'exports' field in package.json` — tsc menolak resolve `packages/three` exports map
- **Repro**: `pnpm build` → web app tsc fail
- **Root cause**: `apps/web/tsconfig.json` pakai `moduleResolution: "node"`, yang tidak resolve `exports` field di package.json (fitur Node 16+). packages/three pakai exports field.
- **Fix**: Ubah `moduleResolution: "node"` → `"bundler"` di `apps/web/tsconfig.json`. Bundler resolution lebih modern dan support ESM + exports field.
- **Files affected**: `apps/web/tsconfig.json`
- **Prevention**: Selalu pakai `moduleResolution: "bundler"` atau `"node16"` untuk project Next.js 15.
- **Status**: ✅ resolved

### E009 — 2026-08-28 — Hari 5 — low
- **Task**: webpack compiles `packages/three/src/` files
- **Symptom**: webpack follows symlink `node_modules/@booxury/three` → `packages/three/src/` → tries to compile source files. `tsconfig exclude` tidak membantu webpack.
- **Repro**: Build web app → webpack picks up `packages/three/src/` files despite exclude
- **Root cause**: `tsconfig.json` exclude hanya affects TypeScript compiler, bukan webpack bundler. Webpack follow symlinks dan compiles semua source.
- **Fix**: Ensure barrel export `packages/three/src/index.ts` tidak punya broken imports (fix E001). Tidak perlu exclude di tsconfig untuk webpack — barrel harus self-contained. Alternative: build packages/three sebagai compiled output (dist/), tapi overkill untuk MVP.
- **Files affected**: `apps/web/tsconfig.json`
- **Prevention**: Keep barrel exports self-contained. Don't put Next.js-specific imports (next/dynamic) in shared workspace packages.
- **Status**: ✅ resolved (workaround: clean barrel exports)

### E010 — 2026-08-28 — Hari 5 — low
- **Task**: Build `packages/three/src/scene-3d.tsx`
- **Symptom**: `gsap.registerPlugin()` called before `import gsap` — TypeScript/ESLint error
- **Repro**: Type check scene-3d.tsx
- **Root cause**: GSAP import di line AFTER `gsap.registerPlugin()` call. JS hoisting tidak cover `import` statements dalam ES modules.
- **Fix**: Pindah `import gsap from 'gsap'` ke BEFORE `gsap.registerPlugin()` di scene-3d.tsx.
- **Files affected**: `packages/three/src/scene-3d.tsx`
- **Prevention**: Selalu letakkan semua import di TOP of file, sebelum code execution apa pun.
- **Status**: ✅ resolved

### E011 — 2026-08-25 — Hari 5 (continuation) — medium
- **Task**: Restore design from API (GET /designs/:id)
- **Symptom**: TypeScript error `Property 'paper' does not exist` di `customize/cover/page.tsx`
- **Repro**: `pnpm --filter @booxury/web build`
- **Root cause**: Type annotation pakai nama lama `paperMaterial?: { code: string }` padahal API return `paper: { code: string }` (Prisma relation field).
- **Fix**: Ubah type annotation jadi `paper?: { code: string }; board?: { code: string }` sesuai Prisma schema. Relation field names adalah `paper` dan `board`.
- **Files affected**: `apps/web/app/customize/cover/page.tsx`
- **Prevention**: Sync type annotation dengan actual API response. Prisma relation field names tidak boleh disangka.
- **Status**: ✅ resolved

### E012 — 2026-08-25 — Hari 5 (continuation) — medium
- **Task**: Checkout flow — designId missing from cart
- **Symptom**: Checkout blocked karena `designId` tidak ada di CartItem interface
- **Repro**: Review → add-to-cart → checkout gagal
- **Root cause**: `addToCart` tidak terima/peneruskan `designId`. `CartItem` interface tidak punya field `designId`.
- **Fix**: Tambah `designId?: string` ke `CartItem`. Review page pass `designId` saat add-to-cart. Checkout handle `designId` optional.
- **Files affected**: `apps/web/lib/stores/configurator.ts`, `apps/web/app/customize/review/page.tsx`, `apps/web/app/checkout/page.tsx`
- **Prevention**: DesignId harus flowable dari design → cart → checkout.
- **Status**: ✅ resolved

### E013 — 2026-08-26 — Hari 8 — high
- **Task**: Navigasi langsung ke rute root `/customize`
- **Symptom**: 500 Internal Server Error saat mengakses `/customize`
- **Repro**: Buka `http://localhost:3000/customize` dari browser atau curl
- **Root cause**: Direktori `apps/web/app/customize` hanya berisi sub-rute (`base`, `cover`, `finish`, `review`) tanpa memiliki `page.tsx` root index, serta NextAuth secret belum memiliki fallback string di edge runtime.
- **Fix**: Membuat `apps/web/app/customize/page.tsx` dengan `redirect('/customize/base')`, menambahkan fallback secret di `apps/web/lib/auth.ts`, dan memperbarui `middleware.ts` agar mengizinkan akses tamu (guest) ke alur customize.
- **Files affected**: `apps/web/app/customize/page.tsx`, `apps/web/lib/auth.ts`, `apps/web/middleware.ts`
- **Prevention**: Setiap folder sub-app router dengan layout harus memiliki root `page.tsx` atau redirect eksplisit.
- **Status**: ✅ resolved

### E014 — 2026-08-26 — Hari 8 — high
- **Task**: Client-side rendering pada Canvas Editor & 3D Webpack bundles
- **Symptom**: `Runtime TypeError: __webpack_modules__[moduleId] is not a function`
- **Repro**: Buka `http://localhost:3000/customize/cover` di browser
- **Root cause**: Terjadi *nested dynamic import* ganda (`CanvasEditor` di-import `dynamic()` di `cover/page.tsx`, lalu `KonvaStage` di-import `dynamic()` lagi di dalam `CanvasEditor`). Selain itu, terdapat side-effect `gsap.registerPlugin()` di level modul pada `packages/three/src/scene-3d.tsx` yang dievaluasi sebelum Webpack chunk siap.
- **Fix**: Mengubah import `KonvaStage` di `CanvasEditor/index.tsx` menjadi import langsung, menghapus `gsap.registerPlugin()` dari `scene-3d.tsx`, serta mendaftarkan seluruh paket monorepo (`@booxury/spine-calc`, `@booxury/pricing-engine`, `@booxury/design-types`) ke `transpilePackages` di `next.config.ts`.
- **Files affected**: `apps/web/components/configurator/CanvasEditor/index.tsx`, `packages/three/src/scene-3d.tsx`, `apps/web/next.config.ts`
- **Prevention**: Hindari nesting `next/dynamic` di dalam komponen yang sudah di-load secara dinamis; daftarkan semua paket monorepo internal di `transpilePackages`.
- **Status**: ✅ resolved

### E015 — 2026-08-26 — Hari 8 (Review) — high
- **Task**: "Buka buku" animation — halaman tidak membuka saat cover terbuka
- **Symptom**: Klik tombol "📖 Buka Isi" di sidebar wizard mengubah `coverOpenAngle` ke 1.35, tapi halaman tetap menjadi satu block statis. Cover berputar tapi halaman tidak ikut fanning — efek "buka buku" terasa tidak realistis.
- **Repro**: Buka `/customize/base`, klik tombol "📖 Buka Isi" di toolbar kamera sidebar → cover terbuka tapi halaman tetap statis
- **Root cause**: `HardcoverModel` di `packages/three/src/hardcover-model.tsx` render halaman sebagai single `boxGeometry` yang tidak merespons `coverOpenAngle`. Tidak ada animasi fanning.
- **Fix**: Ganti single page block dengan komponen `BookPages` yang render 12 individual page sheets. Setiap sheet diposisikan sepanjang sumbu Z (spine ke depan) dan dirotasi oleh `-(i / (totalSheets - 1)) * coverOpenAngle` — pages dekat spine rotate kurang, pages dekat cover rotate lebih, menciptakan efek buka buku realistis.
- **Files affected**: `packages/three/src/hardcover-model.tsx`
- **Prevention**: Animasi 3D yang bergantung pada props harus bereaksi terhadap perubahan props tersebut.
- **Status**: ✅ resolved

### E016 — 2026-08-26 — Hari 8 (Review) — medium
- **Task**: Review page tidak punya visual 3D preview
- **Symptom**: Halaman `/customize/review` hanya menampilkan teks checklist dan ringkasan konfigurasi. Tidak ada visual preview buku 3D untuk user review sebelum checkout. Sidebar wizard (WizardSidebar) menampilkan 3D preview tapi di luar area konten utama review.
- **Repro**: Navigasi ke `/customize/review` → tidak ada komponen visual preview buku
- **Root cause**: Review page (`apps/web/app/customize/review/page.tsx`) tidak mount komponen Scene3D/Book3DPreview di dalam konten halaman. Sidebar wizard punya 3D scene tapi review page berdiri sendiri tanpa preview visual.
- **Fix**: Tambahkan komponen `Scene3D` (via `next/dynamic({ ssr: false })`) di bagian atas review page, pass semua finish config (coverFinish, cornerShape, edgeFinish, dustJacket, headband, ribbon) dan base config (size, spineWidthMm, layout, paperCode) sebagai props. Set `phase="review"` agar kamera menggunakan preset review yang sesuai.
- **Files affected**: `apps/web/app/customize/review/page.tsx`
- **Prevention**: Setiap fase wizard yang menampilkan hasil kustomisasi harus memiliki komponen visual preview.
- **Status**: ✅ resolved
