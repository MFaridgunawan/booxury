# Sprint 1 — 7-Day Roadmap: Booxury W2P MVP

> **Durasi**: 7 hari (Hari 0–7, Hari 0 = setup + riset percetakan)
> **Target**: MVP demo-ready untuk review dosen
> **Asumsi**: 6–8 jam kerja produktif/hari
> **Prinsip**: scope cuts agresif, deliver working software, bukan sempurna
> **Nama project**: Booxury
> **Metodologi**: Mini-Sprint Timeboxed (detail: [`README.md` §8](../README.md#8-module-methodology--sdlc))

---

## Definition of Done (DoD)

Setiap task dianggap **selesai** hanya jika memenuhi semua ini:

- [ ] Code sudah runnable (bisa diakses di browser/dev URL)
- [ ] Tidak crash / tidak ada unhandled error di console
- [ ] Minimal error handling (Zod validation + try-catch)
- [ ] Sudah di-commit dengan message ringkas (`fix:`, `feat:`, `chore:`)
- [ ] Sudah di-test manual dan dicatat di `TESTING.md`
- [ ] Tidak ada TODO/FIXME yang belum resolved

---

## AI vs Manual Split

### AI Handle (Boilerplate)

- Scaffolding project (pnpm, tsconfig, eslint config)
- Fastify route handlers + Zod validation schemas
- React UI components (basic layout + styling)
- Prisma schema generation (perlu review manual)
- SQL query drafting (perlu verify)
- CSS / styling

### Manual Handle (Tidak Di-Delegasikan Penuh)

- **Pre-sprint (Hari 0)**: Hubungi percetakan mitra → dapat specs → update spine formula + pricing
- **Prisma schema review**: Verifikasi relasi, foreign key, constraint
- **Architecture decisions**: Setiap keputusan besar — review dan pahami "kenapa"
- **Manual smoke test**: Setiap endpoint — curl/Postman test + catat di `TESTING.md`
- **Code review**: Verify semua output AI sebelum commit

> ⚠️ **Pre-sprint checklist (Hari 0) wajib sebelum mulai coding:**
> 1. Hubungi percetakan — tanya format PDF, ICC profile, caliper aktual, pricing
> 2. Update spine formula (§4 README) dengan data aktual dari percetakan
> 3. Update pricing rules dengan harga aktual
> 4. Buat `percetakan-spec.md` dengan hasil riset
> 5. Setup Git repo + `pnpm install`

---

## Scope MVP — Apa Yang Masuk, Apa Yang Dilewati

### Yang Masuk (Wajib)

- [ ] Wizard 4 fase jalan end-to-end
- [ ] Editor Konva: upload image + text + foil/emboss
- [ ] Spine width kalkulasi real-time
- [ ] Save design + restore
- [ ] Cart + checkout + order creation
- [ ] PDF generator: 3 file (cover + interior + spec-sheet) → ZIP
- [ ] Admin: lihat orders + status transitions + download ZIP

### Yang Dilewati (Boleh Nanti)

- Real Midtrans payment (mock button → langsung success)
- Ghostscript CMYK conversion (RGB cukup untuk demo)
- R3F 3D mockup (ganti 2D composite preview)
- Real percetakan kirim sungguhan (tidak kirim — demo only)
- Admin material CRUD UI (Prisma Studio cukup)
- Figma wireframe (opsional — 1-2 jam bikin wireframe sederhana membantu demo)
- Unit test 100% (smoke test manual cukup)
- E2E test otomatis
- UU PDP compliance
- Save-for-later UI polish

---

## Daily Breakdown

### Hari 0 — Setup + Riset Percetakan Mitra

> ⚠️ **HARI Ini TIDAK BOLEH DI-SKIP.** Jangan mulai coding sebelum spine formula dan pricing di-update dengan data aktual dari percetakan.

**Jam**: 0–6 | **Goal**: Environment ready, specs percetakan dapat, spine formula + pricing di-update

#### 00:00 — 01:00 | Environment Setup

```bash
mkdir -p booxury
cd booxury
git init
pnpm init -y
# Setup monorepo: pnpm-workspace.yaml, apps/web + apps/api + packages/*
# Setup PostgreSQL (docker atau local)
# Setup .env — DATABASE_URL, NEXTAUTH_SECRET
# Initial commit
```

#### 01:00 — 02:00 | Monorepo Scaffold

```bash
pnpm add -w turbo
# apps/web (Next.js 15)
# apps/api (Fastify + TypeScript)
# packages/pricing-engine
# packages/spine-calculator
# packages/shared (Zod schemas, types)
```

#### 02:00 — 04:00 | Riset Percetakan Mitra

**Ini yang tidak bisa di-AI-kan.** Hubungi percetakan (WA / telepon / visit):

Tanya:
- Format PDF yang mereka terima (PDF/X-4, plain PDF, specific version)
- ICC profile warna yang mereka pakai (FOGRA39? custom?)
- Bleed standar (3mm? 5mm?)
- Minimum spine width tolerance (±0.5mm? ±1mm?)
- Tebal kertas caliper aktual per jenis (HVS 70gsm = ?mm, Bookpaper 80 = ?mm)
- Tebal board per jenis (2mm = ? sheet)
- Endpaper thickness
- Hinge allowance yang mereka pakai
- Sample pricing per jenis material
- Apakah bisa terima dari sistem online / email?

#### 04:00 — 05:00 | Update Spine Formula + Pricing

Dengan data dari percetakan:
1. Update §4 README — koreksi caliper table dengan angka aktual
2. Update pricing_rules seed data dengan harga aktual
3. Hitung worked examples baru dengan tolerance dari percetakan

#### 05:00 — 06:00 | Document & Commit

```bash
# Buat percetakan-spec.md:
# - Format PDF yang diterima
# - ICC profile
# - Bleed + turn-in specs
# - Caliper aktual per material
# - Tolerance
# - Pricing reference
# - Contact person percetakan

git add .
git commit -m "chore: Hari 0 setup + riset percetakan"
```

---

### Hari 1 — Foundation + PDF Engine Core

**Jam**: 0–8 | **Goal**: Pipeline PDF berdiri, monorepo runnable

#### 08:00 — 09:00 | Setup Monorepo

```bash
mkdir -p booxury
cd booxury
pnpm init -y
```

File: `pnpm-workspace.yaml`
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

File: `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"] },
    "dev": { "cache": false },
    "test": { "dependsOn": ["^build"] }
  }
}
```

File: `package.json` root
```json
{
  "name": "booxury",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "pdf:test": "node packages/pdf-engine/scripts/test-local.ts"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.5.0"
  }
}
```

#### 09:00 — 10:00 | Prisma Schema + Migration

Setup `packages/database/`:
- Buat schema yang mirror dari §3 master plan
- Jalankan `prisma migrate dev --name init`
- Verify: `prisma studio` bisa dibuka

#### 10:00 — 12:00 | Seed Script

Bikin `packages/database/prisma/seed.ts`:

```ts
// Seed materials, size_presets, cover_finishes, accessories
// Run: npx prisma db seed
// Verify: query ke DB, data muncul
```

#### 12:00 — 14:00 | PDF Engine Setup

Setup `packages/pdf-engine/`:
```bash
pnpm add pdfkit sharp archiver
pnpm add -D @types/pdfkit
```

Bikin struktur:

```
packages/pdf-engine/
├── src/
│   ├── cover.ts        # Generate cover.pdf
│   ├── interior.ts     # Generate interior.pdf
│   ├── spec-sheet.ts  # Generate spec-sheet.pdf
│   └── index.ts       # Export all generators
├── scripts/
│   └── test-local.ts  # Hardcoded JSON → 3 PDF + ZIP
└── package.json
```

#### 14:00 — 17:00 | Cover PDF Generator

Test dengan data hardcoded (A5, 100 halaman, HVS 80):

```ts
// Input hardcoded
const spine = calculateSpine({
  pages: 100,
  paperCaliperMm: 0.105,
  boardThicknessMm: 2.0,
  endpaperThicknessMm: 0.12,
  hingeAllowanceMm: 2.0,
});
// Hasil: spineWidthMm = 11.49mm

// Generate cover.pdf: 3 panel (back | spine | front)
// - back panel: 148mm × 210mm
// - spine: 11.49mm × 210mm
// - front: 148mm × 210mm
// - turn-in: 15mm tiap sisi
// - bleed: 3mm tiap sisi
// - totalSheetWidthMm: 148 + 11.49 + 148 + 30 + 6 = 343.49mm
// - totalSheetHeightMm: 210 + 30 + 6 = 246mm
```

Verify: PDF bisa dibuka, dimensi panel sesuai, teks label "BACK", "SPINE", "FRONT" muncul.

#### 17:00 — 18:00 | Interior + Spec Sheet + ZIP

```ts
// interior.pdf: 100 halaman, layout lined (garis horizontal tiap 8mm)
// spec-sheet.pdf: 1 halaman tabel: ukuran, kertas, finish, aksesoris
// archiver: buat ZIP dari 3 file
```

#### Checkpoint EOD

```bash
$ pnpm pdf:test
✓ cover.pdf  generated  (343.49 × 246mm, RGB, 300dpi)
✓ interior.pdf  generated  (100 halaman lined)
✓ spec-sheet.pdf  generated  (1 halaman)
✓ output.zip  created  (3 file)
✓ PDF can be opened in browser
```

**Criteria to pass**: Semua 3 PDF generated, ZIP berisi 3 file, bisa di-download dan dibuka.

---

### Hari 2 — Pricing Engine + Auth + Backend + Wizard Fase 1

**Jam**: 0–8 | **Goal**: Auth jalan, API lengkap, Fase 1 berfungsi

> ⚠️ Perbaikan: Auth dipindahkan dari Hari 7 ke Hari 2 (GAP-3). Semua endpoint yang butuh `user_id` akan error tanpa auth. Next.js setup dipindahkan dari sini ke akhir Hari 1.

#### 00:00 — 02:00 | Pricing + Spine Packages

Setup `packages/pricing-engine/` + `packages/spine-calc/`. Test: 10 test pricing + 3 worked examples spine pass.

#### 02:00 — 05:00 | Backend Fastify + Modules

Setup `apps/api/` + 6 modules:

```bash
npx fastify-cli serve
```

Modules:

```
apps/api/src/
├── server.ts
├── plugins/
│   ├── prisma.ts
│   ├── auth.ts         # JWT verification middleware
│   ├── error-handler.ts
│   └── cors.ts
└── modules/
    ├── catalog/       # GET /store/materials, /store/sizes
    ├── pricing/      # POST /api/price-quote
    ├── configurator/  # POST/GET /api/designs
    └── cart/          # POST/GET/DELETE /api/cart/items
```

EOD routes wajib jalan:
- `GET /store/materials` → active materials
- `GET /store/sizes` → size presets
- `GET /store/accessories` → accessories
- `GET /store/cover-finishes` → finishes
- `POST /api/price-quote` → breakdown + total
- `POST /api/designs` → save design (auth required)
- `GET /api/designs` → list user's designs (auth required)

#### 05:00 — 06:30 | Auth Setup (NextAuth + Seed User)

```ts
// Seed 1 demo user di seed.ts:
{
  email: 'demo@booxury.local',
  name: 'Demo User',
  password_hash: await bcrypt.hash('demo123', 12),
  role: 'customer'
},
{
  email: 'admin@booxury.local',
  name: 'Admin',
  password_hash: await bcrypt.hash('admin123', 12),
  role: 'admin'
}
```

NextAuth credentials provider (15 menit):
```ts
// apps/web/app/api/auth/[...nextauth]/route.ts
// Credentials provider: email + password → return JWT session
// Middleware: protect /customize/*, /checkout/*, /admin/*
```

#### 06:30 — 08:00 | Wizard Fase 1 Page

`/customize/base/page.tsx` + `/customize/layout.tsx`:

```tsx
// Zustand store (tempat seluruh wizard state):
const useConfiguratorStore = create<ConfiguratorStore>()((set) => ({
  base: { size: 'A5', pages: 100, paper: 'HVS80', layout: 'lined' },
  setBase: (patch) => set((s) => ({ base: { ...s.base, ...patch } })),
  // ...
}));

// Form fields: size, pages, paper, layout
// Real-time spine preview: spine width update saat input berubah
// Next → navigate('/customize/cover')
```

#### Checkpoint EOD

- [ ] `pnpm test` pricing → 10/10 pass
- [ ] `GET /store/materials` → JSON data seeded
- [ ] `POST /api/price-quote` → breakdown + total
- [ ] Login `/api/auth/signin` → demo@booxury.local / demo123 → JWT cookie
- [ ] `POST /api/designs` dengan auth → design saved, `user_id` terisi
- [ ] `GET /api/designs` tanpa auth → 401
- [ ] `/customize/base` → spine preview real-time + Next navigates

### Hari 3 — Editor Konva Part 1

**Jam**: 0–8 | **Goal**: Editor image + text + save/restore

#### 00:00 — 01:30 | Konva Setup (SSR-Safe)

File: `components/configurator/CanvasEditor/index.tsx`

```tsx
'use client';
// PENTING: 'use client' wajib, ini yang cegah SSR error

import { Stage, Layer, Image as KonvaImage, Text, Transformer } from 'react-konva';
import { useEffect, useRef, useState } from 'react';

// SSR guard (kalau ada yang accidental import server-side)
if (typeof window !== 'undefined') {
  import('konva').then(...);
}
```

Key setup:
- Stage dengan 3 Layer: background, images, text, transformer
- Infinite canvas (zoom/pan tidak wajib di MVP)
- Pixel-to-mm conversion berdasarkan DPI setting

#### 01:30 — 03:00 | Image Upload + DPI Validation

Next.js Route Handler: `app/api/upload/route.ts`

```ts
// Upload workflow:
// 1. Client: fetch ke /api/upload (multipart)
// 2. Server: Sharp resample ke proxy (max 2048px)
// 3. Server: DPI check → return warnings
// 4. Client: tampilkan warning kalau DPI rendah
// 5. Client: generate thumbnail untuk preview
```

Client-side DPI warning (sebelum upload):
```tsx
// Pasang event listener ke file input
// Load image → hitung effective DPI
// if DPI < 100 → reject (tidak boleh upload)
// if DPI < 150 → warning kuning
// if DPI < 300 → warning kuning muda (opsional)
```

#### 03:00 — 04:30 | Konva Image Manipulation

Fitur:
- Drop image ke canvas → muncul di posisi drop
- Klik image → muncul Transformer (resize handles)
- Drag → move
- Resize handles → scale
- Delete key → remove selected

```tsx
// Konva Transformer pattern:
const handleSelect = (node) => {
  transformerRef.current.nodes([node]);
  transformerRef.current.getLayer().batchDraw();
};
```

#### 04:30 — 06:00 | Text Tool

Fitur:
- Click "Add Text" button → text muncul di canvas
- Double-click text → inline edit (HTML overlay)
- Properties panel: font (4 whitelist), size, color
- Font whitelist: Playfair Display, Lora, Open Sans, Roboto

```tsx
const FONT_WHITELIST = [
  'Playfair Display',
  'Lora',
  'Open Sans',
  'Roboto',
];
```

#### 06:00 — 07:00 | Save Design Endpoint + Service

Backend: `POST /api/designs`

```ts
// Body: { base_config, design_payload, finish_config }
// 1. Validate dengan Zod
// 2. Calculate spine width (packages/spine-calc)
// 3. Calculate price (packages/pricing-engine)
// 4. Save to DB (designs table)
// 5. Thumbnail: client-side via `stage.toDataURL('image/png', 0.5)`
//    → kirim sebagai base64 di body POST /api/designs
//    → server decode → save ke /public/uploads/thumbnails/ (local, MVP)
//    → return thumbnail_url
// 6. Return { id, thumbnail_url, total_price, spine_width_mm }
```

#### 07:00 — 08:00 | Restore Design

Backend: `GET /api/designs/:id`

```tsx
// /customize/cover?design=uuid
// 1. Fetch design dari API
// 2. Populate Zustand store dengan design_payload
// 3. Render Konva stage dengan layers dari payload
// → User bisa lanjut edit design yang sudah ada
```

**Checkpoint EOD**

- [ ] Upload image → muncul di canvas, bisa drag/resize
- [ ] DPI < 100 → error merah, tidak bisa upload
- [ ] DPI < 300 → warning kuning muncul
- [ ] Text bisa ditambah, diedit (font/color), dihapus
- [ ] Klik Save → design tersimpan, ID muncul di response
- [ ] Buka ulang URL dengan `?design=ID` → canvas ter-restore

---

### Hari 4 — Editor Part 2 + Fase 3 Finish

**Jam**: 0–8 | **Goal**: Background, foil/emboss, Fase 3, real-time price

#### 00:00 — 02:00 | Background Color + Patterns

```tsx
// Background options:
// 1. Solid color picker (react-colorful)
// 2. Pattern: dots, lines, plain (inline SVG, sangat kecil)

// Implementation: Konva Layer paling bawah
// Pattern = SVG filled rectangle dengan fill pattern
// Solid = Konva.Rect dengan fill color
```

#### 02:00 — 04:00 | Foil/Emboss Annotation

Fitur visual (belum print-ready, hanya simulasi layar):

```tsx
// Saat layer di-select → muncul toggle panel:
// [ ] Gold Foil  [ ] Emboss

// Jika Gold Foil checked:
// Konva.Text → shadowColor: '#FFD700', shadowBlur: 8, fill: '#B8860B'
// Konva.Image → overlay gradient gold

// Jika Emboss checked:
// Konva.Text → shadowOffsetX/Y: 2, shadowBlur: 3, opacity: 0.7

// Simpan ke design_payload.finish_zones:
{
  "type": "gold_foil",
  "layerId": "layer-xyz",
  "bbox": { "x": 50, "y": 20, "w": 100, "h": 30 },
  "label": "Logo"
}
```

#### 04:00 — 05:30 | Fase 3 Page — Material & Accessories

`/customize/finish/page.tsx`:

```tsx
// Cover Finish: Radio group dengan gambar preview
// - Laminasi Doff (tanpa surcharge)
// - Laminasi Glossy (tanpa surcharge)
// - Kanvas (+Rp15.000)

// Elastic Strap: Toggle on/off + color picker (3 warna)
// Page Ribbon: Toggle on/off + color picker (3 warna)

// Saat toggle berubah:
// → update Zustand finish config
// → pricing recalculate (display only, belum save)
// → user lihat harga berubah real-time
```

#### 05:30 — 06:30 | Real-Time Price Update

Gabungkan pricing engine ke Zustand:

```tsx
// Zustand: computed price
const totalPrice = useConfiguratorStore((s) =>
  calculatePrice(s.base, s.finish, data /* from TanStack Query */)
);

// Display: floating price bar di bottom wizard
<div className="fixed bottom-0 w-full bg-white border-t shadow-lg p-4">
  Total: Rp {totalPrice.toLocaleString('id-ID')}
</div>
```

#### 06:30 — 07:30 | Save Finish Config

```tsx
// PUT /api/designs/:id
// { finish_config, finish_zones, total_price }

// Response:
// { updated_at, total_price, material_warnings? }
// → update Zustand
```

#### 07:30 — 08:00 | Full Restore Test

```bash
# 1. Mulai fresh → wizard Fase 1
# 2. Pilih A5, 100 hal, Bookpaper, Garis
# 3. Masuk editor → upload image, tambah text
# 4. Set gold foil di text "Judul"
# 5. Pilih Kanvas + strap merah + ribbon hijau
# 6. Simpan
# 7. Copy URL design
# 8. Buka new tab, paste URL
# → Semua state ter-restore: base, canvas, finish
```

**Checkpoint EOD**

- [ ] Background color + 3 patterns bekerja
- [ ] Gold foil / emboss toggle memberikan efek visual di canvas
- [ ] `finish_zones` tersimpan di design_payload
- [ ] Fase 3: cover finish + strap + ribbon toggle berfungsi
- [ ] Harga update real-time saat pilihan berubah
- [ ] Full restore: buka URL design lama → semua state kembali

---

### Hari 5 — Fase 4 Review + Pre-flight + Cart

**Jam**: 0–8 | **Goal**: Review page, checklist, cart jalan

#### 00:00 — 02:00 | Fase 4 Review Page — 2D Composite

`/customize/review/page.tsx`:

```tsx
// 2D composite: flat view 3 panel (back | spine | front)
// - Render dari Konva stage snapshot (PNG)
// - Tampilkan specs: size, pages, paper, finish, accessories
// - Spine preview: lebarnya proporsional

// Layout:
// [ BACK ] | [ SPINE ] | [ FRONT ]
// ---- specs table ----
// ---- checklist ----
// [ Add to Cart Rp XXX ]
```

#### 02:00 — 04:00 | Pre-flight Checklist

Server: `POST /api/preflight`

```tsx
// Checks (auto, server-side):
// 1. DPI check: semua image di canvas ≥ 100 DPI
// 2. Spine calc valid: spine width dalam min/max range
// 3. Text in spine safe zone: text width < safe zone width
// 4. No empty design: minimal 1 layer ada

// Client: render checklist
const [checks, setChecks] = useState<Check[]>([]);
const [userConfirmed, setUserConfirmed] = useState(false);

// Add to Cart disabled kalau:
// - !checks.every(c => c.status === 'pass')
// - !userConfirmed
```

#### 04:00 — 05:30 | Cart Page

`/checkout/cart/page.tsx`:

```tsx
// List items dari Zustand atau TanStack Query
// - Thumbnail (PNG Konva)
// - Name, specs summary
// - Price
// - Quantity (1 untuk MVP)
// - Remove button

// Total: subtotal + shipping (fixed Rp 0 untuk MVP)
// [ Checkout ] button
```

#### 05:30 — 07:00 | Add to Cart + Create Order

```tsx
// POST /api/cart/items
// Body: { design_id, quantity: 1 }
// Server:
// 1. Fetch design
// 2. Recalculate price server-side
// 3. Snapshot base_config, design_payload, finish_config ke order_items
// 4. Create order dengan status 'awaiting_payment'
// 5. Return order_id

// Navigate ke /checkout/shipping
```

#### 07:00 — 08:00 | Checkout Simplified

`/checkout/confirm/page.tsx`:

```tsx
// Simplified (MVP): tanpa real shipping address form
// - Tampilkan ringkasan order
// - Mock payment button: "Bayar Sekarang (Demo)"
// - Klik → simulate payment success
// → order status → 'queued'
// → BullMQ job enqueue
// → redirect ke /checkout/success
```

**Checkpoint EOD**

- [ ] Review page menampilkan 2D composite 3 panel + specs
- [ ] Pre-flight checklist: auto-checks jalan, user confirm required
- [ ] Add to Cart disabled sampai checklist pass
- [ ] Cart: list items + total
- [ ] Checkout → order created dengan status `awaiting_payment`
- [ ] Mock payment → status `queued`, PDF worker triggered

---

### Hari 6 — PDF Worker + Admin Dashboard

**Jam**: 0–8 | **Goal**: Worker auto-trigger, admin bisa download ZIP

#### 00:00 — 02:00 | Queue Setup (Database-Based, Persistent)

> ⚠️ Perbaikan (GAP-6): Queue pakai tabel `job_queue` di database (bukan in-memory Map). In-memory hilang saat server restart — tidak acceptable walau untuk MVP demo.

Queue worker poll database tiap 5 detik:

```ts
// apps/api/src/lib/worker.ts
async function pollAndProcess() {
  const job = await prisma.$queryRaw`
    SELECT * FROM job_queue
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  `;
  if (!job) return;

  await prisma.jobQueue.update({
    where: { id: job.id },
    data: { status: 'processing', started_at: new Date() }
  });

  await generatePdf(job.payload);

  await prisma.jobQueue.update({
    where: { id: job.id },
    data: { status: 'done', finished_at: new Date() }
  });
}

// Poll setiap 5 detik:
setInterval(pollAndProcess, 5000);
```

#### 02:00 — 04:30 | Worker: Generate PDFs from Snapshot

Worker baca dari `*_snapshot` di `order_items`:

```ts
async function handlePdfJob(job) {
  // Payload sudah ada di job_queue, tidak perlu fetch ulang
  const { orderId } = job;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });

  // For each item:
  // - Generate cover.pdf (dari design_snapshot + spine_width_mm)
  // - Generate interior.pdf (dari base_snapshot: pages, layout)
  // - Generate spec-sheet.pdf (dari finish_snapshot)

  // ZIP 3 file
  // Upload ke /public/production/ (local, MVP)
  // Update order: production_zip_url = url
}
```

#### 04:30 — 05:30 | Trigger Worker

Di checkout confirm, setelah create order:

```ts
// POST /api/checkout → sudah create order + job_queue entry
// Worker poll setiap 5 detik → process job secara async
// Frontend poll GET /api/orders/:id → cek production_zip_url tersedia
```

#### 05:30 — 07:00 | Admin Orders List

`/admin/orders/page.tsx`:

```tsx
// Table: Order ID, Customer, Total, Status, Date, ZIP
// Filter: by status (awaiting_payment | queued | binding | shipped)
// Sort: newest first

// Columns:
// - Order #1234
// - user@example.com
// - Rp 42.500
// - Status badge (colored: yellow=awaiting, blue=queued, green=binding, gray=shipped)
// - 2026-08-21
// - [Download ZIP] button
```

#### 07:00 — 08:00 | Admin Status Transitions + ZIP Download

```tsx
// Status buttons per order:
// - 'queued' → [ Mulai Jilid ] → status 'binding'
// - 'binding' → [ Sudah Dikirim ] → status 'shipped' (+ input resi opsional)
// - 'queued' → [ Batalkan ] → status 'cancelled'

// Download ZIP:
// GET /api/admin/orders/:id/zip → returns signed URL / direct file
```

**Checkpoint EOD**

- [ ] Checkout success → PDF worker triggered
- [ ] Worker generate 3 PDF + ZIP (dalam < 30 detik untuk MVP)
- [ ] Admin: list orders dengan filter status
- [ ] Admin: klik status button → order status berubah
- [ ] Admin: download ZIP → file ter-download, berisi 3 PDF valid

---

### Hari 7 — Polish + Demo Prep

**Jam**: 0–7 | **Goal**: Bug fixes, polish, demo-ready

#### 00:00 — 02:00 | Bug Fixes

Dari 6 hari sebelumnya, buat daftar bug yang ketemu:

```bash
# Bug checklist (isi dari pengalaman 6 hari):
# - [ ] Konva SSR issue → fix dynamic import
# - [ ] Image DPI warning tidak muncul → fix validation logic
# - [ ] Save design gagal di edge case → add try/catch
# - [ ] Harga tidak update saat toggle accessories → fix Zustand selector
# - [ ] Pre-flight false positive → adjust thresholds
# - [ ] PDF worker timeout → add timeout + retry
```

Prioritas: fix blocking bugs dulu (yang bikin flow berhenti). UX polish boleh nunggu.

#### 02:00 — 03:30 | UI Polish

Minimal polish (MVP-level, bukan production):

- Loading states: `loading="lazy"` + skeleton shimmer
- Error messages: toast notifications (pakai `react-hot-toast` atau native `alert`)
- Empty states: placeholder illustration + CTA
- Wizard progress bar: visual indicator Fase 1/2/3/4
- Mobile: cukup bisa di-scroll, tidak perlu pixel-perfect mobile-first

#### 03:30 — 05:00 | Seed Demo Data

```ts
// apps/api/prisma/seed-demo.ts

// 3 designs (saved, berbagai konfigurasi):
// 1. "Notebook A5 Sederhana" — plain, no image, doff
// 2. "Jurnal B5 Custom" — with image, canvas, strap + ribbon
// 3. "Draft Baru" — empty, fresh

// 5 orders (various statuses):
// 1. awaiting_payment (demo only)
// 2. queued (ZIP ready)
// 3. binding
// 4. shipped (dengan resi)
// 5. cancelled

// 1 demo user account:
// email: demo@booxury.local
// password: demo123
```

#### 05:00 — 06:00 | Auth Basic (MVP)

NextAuth credentials provider (MVP-level, tidak production):

```ts
// app/api/auth/[...nextauth]/route.ts
// credentials provider dengan email/password hardcoded
// atau: buat 1 user di seed

// Protect routes:
// - /customize/* → login required
// - /checkout/* → login required
// - /admin/* → admin role required
```

#### 06:00 — 07:00 | End-to-End Smoke Test

Manual click-through, catat hasil:

```bash
# Test script (jalankan browser, manual):

# === Flow 1: New Design ===
1. Buka /customize/base
2. Login (demo account)
3. Pilih B5, 200 hal, Bookpaper 80, Garis
4. Lihat spine: 17.74mm ✅
5. Klik Next → /customize/cover
6. Upload image (test.jpg)
7. DPI warning muncul ✅
8. Tambah text "My Journal"
9. Set gold foil di text
10. Klik Save → "Design saved" ✅
11. Pilih cover finish: Kanvas, strap: merah
12. Harga update ✅
13. Klik Next → /customize/finish
14. Klik Next → /customize/review
15. Semua checklist pass ✅
16. Klik konfirmasi user
17. Klik "Add to Cart" → masuk cart ✅
18. Klik Checkout
19. Klik "Bayar Sekarang (Demo)"
20. Lihat "Order placed" ✅
21. Buka /admin/orders
22. Lihat order baru di status queued ✅
23. Klik "Download ZIP"
24. ZIP ter-download, buka → 3 PDF valid ✅

# === Flow 2: Restore Design ===
25. Buka URL design dari step 10
26. Canvas ter-restore ✅
27. Edit text → "My New Journal"
28. Save → version updated ✅

# Total: 26 steps, semua pass?
```

#### 07:00 — 07:00 | Demo Documentation

Screenshot 7 frame untuk slide:

1. Wizard Fase 1 + spine preview
2. Editor Konva (image + text + foil)
3. Fase 3 finish + accessories
4. Fase 4 review + checklist
5. Cart + checkout
6. Admin orders list
7. ZIP download + PDF preview

Video: rekam layar 90 detik (bukan 2 menit, 90 detik cukup):

```
00:00 — 15s  Wizard 4 fase walkthrough
15:00 — 20s  Editor Konva demo
35:00 — 15s  Cart + checkout
50:00 — 20s  Admin dashboard + ZIP download
70:00 — 20s  Restore saved design
```

---

## Definition of Done — Checklist Final

**Semua harus ✅ sebelum demo:**

- [ ] Demo user bisa login
- [ ] Wizard 4 fase navigasi tanpa error
- [ ] Editor: image upload + drag/resize/rotate berfungsi
- [ ] Editor: text tool dengan font + color berfungsi
- [ ] Editor: gold foil / emboss visual toggle berfungsi
- [ ] Background color + patterns berfungsi
- [ ] Spine width preview real-time di Fase 1
- [ ] Save design → tersimpan di database
- [ ] Buka design lama → canvas ter-restore
- [ ] Fase 3: cover finish + strap + ribbon toggle berfungsi
- [ ] Harga update real-time saat pilihan berubah
- [ ] Fase 4: 2D composite preview menampilkan 3 panel
- [ ] Pre-flight checklist auto-check berfungsi
- [ ] Add to Cart blocked sampai checklist pass
- [ ] Cart: list items + total
- [ ] Checkout: create order dengan status `awaiting_payment`
- [ ] Mock payment → status `queued` + worker triggered
- [ ] PDF generator: 3 file (cover + interior + spec-sheet) valid
- [ ] ZIP download berfungsi
- [ ] Admin: list orders dengan filter
- [ ] Admin: status transition buttons berfungsi
- [ ] Smoke test: semua 26 steps pass

**Total: 23 checklist items.**

---

## Risk Map — Per Hari

| Hari | Risiko Utama | Tanda Bahaya | Mitigasi |
|---|---|---|---|
| 1 | Prisma migration fail, Ghostscript issue | Schema error, `pdfkit` undefined | Test migration sebelum lunch; skip Ghostscript |
| 2 | Pricing engine bugs | Test fail, harga salah | Tulis test case dulu, test green sebelum lanjut |
| 3 | Konva SSR crash | White screen di `/customize/cover` | `'use client'` wajib, dynamic import |
| 4 | Pattern SVG besar bikin canvas lag | Frame drop saat switch tab | Inline SVG simpel, max 1KB per pattern |
| 5 | Pre-flight false positive | Add to Cart selalu disabled | Validasi edge case sebelum EOD |
| 6 | Worker blocking main process | API hang saat generate PDF | setTimeout/yield di loop, atau async worker |
| 7 | Demo flow broken last-minute | Discover bug fatal jam 18:00 | Smoke test mulai jam 06:00, bukan akhir |

---

## Post-Sprint — Sprint 2 Wishlist

Ditambahkan setelah demo dosen:

1. Real Midtrans integration
2. Ghostscript CMYK (sesuai konfirmasi percetakan)
3. R3F 3D mockup (replace 2D composite)
4. Admin material CRUD UI (replace Prisma Studio)
5. Unit test coverage: pricing 100%, modules 60%+
6. E2E Playwright tests untuk critical flows
7. Lighthouse performance audit
8. UU PDP compliance + cookie consent
9. Font whitelist expand (8-10 font)
10. Undo/redo di Konva editor (zundo)
---

## Sprint 2 — Post-Demo Todo

Setelah demo, sprint 2 focus:

1. **Queue upgrade**: Database polling → BullMQ + Redis (R11 — §6 README)
2. **Real payment**: Mock Midtrans → Production Midtrans
3. **CMYK conversion**: RGB → sesuai ICC profile dari percetakan
4. **R3F 3D mockup**: Replace 2D composite preview
5. **Admin CRUD UI**: Replace Prisma Studio
6. **Storage**: Local filesystem → Cloudflare R2
7. **Font expand**: 8-10 font di whitelist
8. **Undo/redo**: zundo integration
9. **Unit test**: Pricing 100%, modules 60%+
10. **E2E tests**: Playwright critical flows
11. **UU PDP compliance**: Cookie consent
12. **Pagination**: GAP-8 implementation

---

## Project Info

| Field | Value |
|---|---|
| Nama | **Booxury** |
| Domain | `booxury.id` (planning) |
| Repo | `booxury/` (root folder) |
| Stack | Next.js 15 + Fastify + PostgreSQL + Prisma |
| PDF | Sharp + PDFKit + Ghostscript |
| Metodologi | Mini-Sprint Timeboxed (§8 README) |
