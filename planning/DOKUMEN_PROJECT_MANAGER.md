# 📋 Executive Project Brief & Status Report
## Custom Hardcover Notebook Platform (Web-to-Print / W2P)

| Metadata | Keterangan |
|---|---|
| **Nama Proyek** | Custom Hardcover Notebook Platform (W2P) |
| **Konteks** | Project-Based Learning (Politeknik Manufaktur Bandung) & Inisiatif Komersial Percetakan |
| **Target Deliverable** | MVP Demo-Ready (Siklus Sprint 1: 7 Hari Kerja) |
| **Penyusun** | Tim Engineering & Sistem |
| **Ditujukan Kepada** | Project Manager |
| **Status Dokumen** | Siap Review & Persetujuan Eksekusi (Sprint Ready) |

---

## 1. Ringkasan Eksekutif (Executive Summary)

Platform **Custom Hardcover Notebook (W2P)** adalah solusi digital *Web-to-Print* terintegrasi yang mendigitalkan proses pemesanan buku catatan kover tebal (*hardcover*) secara kustom. Sistem ini menjembatani kebutuhan visualisasi pelanggan dengan presisi manufaktur pabrik/percetakan secara otomatis.

### Nilai Bisnis & Inovasi Utama:
1. **Otomatisasi Pracetak (Pre-press Automation)**: Mengeliminasi proses setting manual desain kover dengan kalkulasi matematis presisi untuk punggung buku (*spine width*), *safety margin*, dan *bleed*.
2. **Visualisasi Interaktif Real-time**: Memungkinkan konsumen mendesain kover (gambar, teks, efek *foil/emboss*) dengan kalkulasi harga dinamis (*dynamic pricing*).
3. **Penerbitan Berkas Siap Cetak (Print-Ready PDF)**: Sistem menghasilkan 1 paket berkas produksi otomatis (PDF Kover 300 DPI, PDF Isi, dan Lembar Spesifikasi Aksesori dalam format ZIP) begitu pesanan masuk.

Perencanaan teknis (Master Plan, Data Model, API Contract, Formula Spine, Gap Analysis, dan Roadmap 7 Hari) telah diselesaikan dan didokumentasikan secara terpadu di direktori `planning/`.

---

## 2. Ruang Lingkup Proyek & Deliverables

### A. Customer-Facing (Web Pelanggan)
* **4-Fase Wizard Interaktif**:
  1. *Base Configuration*: Pemilihan format buku (A5/B5/A6), jumlah halaman (50/100 lembar), jenis kertas (HVS/Bookpaper), dan layout grid/ruled/blank.
  2. *2D Visual Editor (Konva.js)*: Kanvas kover depan, punggung (*spine*), dan belakang dengan fitur upload foto, peringatan resolusi (DPI check), teks editor, serta layer efek khusus (*Gold Foil / Deboss*).
  3. *Material & Aksesori*: Pemilihan laminasi pelapis (Doff/Glossy/Kanvas), pita pembatas, dan karet elastis.
  4. *Preview & Pre-Flight Review*: Validasi visual komposit akhir dan checklist kelayakan sebelum masuk keranjang.
* **Dynamic Pricing Engine**: Perhitungan harga instan di sisi klien dan tervalidasi di sisi server.
* **Keranjang & Checkout**: Manajemen pesanan dan konfirmasi pembayaran.

### B. Manufacturer & Admin Facing (Dashboard Produksi)
* **Automated PDF Generator Engine**: Pipeline komputasi latar belakang (worker) untuk merender PDF resolusi tinggi (300 DPI, bleed area, crop marks).
* **Order Production Workflow**: Pelacakan status pesanan (*Menunggu Pembayaran → Antrean Cetak → Jilid & Finishing → Selesai/Dikirim*).
* **1-Click Production Bundle Download**: Pengunduhan paket produksi terpadu per pesanan (`order_[id].zip`).
* **Inventory Material Toggle**: Kontrol ketersediaan stok bahan langsung memengaruhi opsi di konfigurator secara real-time.

---

## 3. Arsitektur Teknis & Tech Stack

Sistem dibangun dengan arsitektur **Modular Monolith** dalam struktur **pnpm Monorepo + Turborepo**: 1 proses deploy, performa tinggi, struktur kode rapi dengan isolasi domain modular.

```
hardcover_custom/
├── apps/
│   ├── web/                     # Next.js 15 (App Router) — Konfigurator & Storefront
│   ├── admin/                   # Next.js 15 — Dashboard Produksi & Manajemen Pesanan
│   └── api/                     # Fastify (Node.js/TypeScript) — Backend Modular Monolith
└── packages/
    ├── database/                # PostgreSQL + Prisma ORM
    ├── pdf-engine/              # Sharp + PDFKit + Ghostscript
    ├── pricing-engine/          # Shared Business Logic Perhitungan Harga
    └── shared-types/            # Shared Schema & Types (Zod / TypeScript)
```

### Fondasi Teknologi:
* **Frontend**: Next.js 15 (App Router), Konva.js (`react-konva`), Tailwind CSS, Zustand + Immer (State Management).
* **Backend**: Fastify (Node.js / TypeScript) dengan arsitektur domain modules.
* **Database & ORM**: PostgreSQL + Prisma ORM.
* **Asynchronous Worker**: BullMQ + Redis (pemrosesan render PDF berat di latar belakang).
* **Penyimpanan Berkas**: S3-compatible storage (Cloudflare R2 / MinIO / Local storage untuk dev).

---

## 4. Rencana Eksekusi: Sprint 1 (7-Day MVP Roadmap)

Siklus eksekusi dirancang selama **7 hari kerja** dengan prinsip *lean scope* untuk menghasilkan sistem fungsional end-to-end yang siap didemokan kepada stakeholder/dosen:

```mermaid
gantt
    title Sprint 1 — 7-Day MVP Execution Schedule
    dateFormat  YYYY-MM-DD
    axisFormat  Day %d
    section Backend & Core
    Day 1: Monorepo, DB Schema & PDF Engine Core        :active, d1, 2026-08-21, 1d
    Day 2: Auth, Catalog/Material APIs & Pricing Engine :d2, after d1, 1d
    section Configurator & UI
    Day 3: 2D Canvas Editor (Konva) & State Store       :d3, after d2, 1d
    Day 4: 4-Fase Wizard Integration & Validation       :d4, after d3, 1d
    section Integration & Prod
    Day 5: Cart, Checkout Flow & BullMQ Worker Queue    :d5, after d4, 1d
    Day 6: Admin Dashboard & Order Asset Download       :d6, after d5, 1d
    Day 7: E2E Testing, Smoke Test & Demo Polish        :d7, after d6, 1d
```

### Rincian Target Harian:
1. **Hari 1 (Foundation & PDF Engine Core)**: Setup Monorepo, konfigurasi schema Prisma, migrasi database, dan pembuatan unit generator PDF Kover (uji coba render lokal).
2. **Hari 2 (Auth, Core API, & Pricing)**: Implementasi autentikasi dasar, endpoint katalog & material, serta paket shared *pricing engine*.
3. **Hari 3 (2D Canvas Editor)**: Integrasi Konva.js di frontend, upload gambar + DPI warning, manipulasi teks punggung, dan penyimpanan state desain.
4. **Hari 4 (4-Fase Wizard UI)**: Perakitan alur 4 langkah wizard, integrasi dinamis formula lebar punggung (*spine formula*), dan review pre-flight.
5. **Hari 5 (Commerce & Background Worker)**: Penyelesaian alur keranjang/checkout, integrasi antrean kerja BullMQ/Redis untuk render PDF otomatis saat pesanan dibuat.
6. **Hari 6 (Admin Production Dashboard)**: Antarmuka antrean cetak untuk operator, transisi status produksi, dan fungsionalitas unduh ZIP paket produksi.
7. **Hari 7 (Validasi Sistem & Demo Preparation)**: End-to-end smoke test alur penuh (User Desain ➔ Checkout ➔ Worker Render ➔ Operator Download Asset), perbaikan bug kritis, dan kesiapan presentasi demo.

---

## 5. Scope Management (MVP vs Post-MVP)

Untuk memastikan target 7 hari tercapai tanpa kompromi pada kestabilan fungsi utama, batasan ruang lingkup telah ditetapkan secara ketat:

| Komponen | Status di MVP (Sprint 1) | Rencana Pasca-MVP (Sprint 2+) |
|---|---|---|
| **Visualisasi 3D** | Preview komposit 2D realistis | Full React Three Fiber (R3F) 3D Viewport |
| **Payment Gateway** | Simulasi pembayaran instan (Mock Gateway) | Integrasi Production Midtrans / Xendit Webhook |
| **Manajemen Material** | Prisma Studio & Endpoint Toggle Sederhana | UI CRUD Material lengkap dengan kalkulator margin |
| **Konversi Warna CMYK** | Standard High-Res RGB PDF Output | Ghostscript DeviceCMYK color profiling |
| **Automasi Testing** | Critical Path Integration & Smoke Testing | Full Test Suite (Jest Unit Test + Playwright E2E) |

---

## 6. Analisis Celah & Mitigasi Kritis (Gap Analysis Summary)

Berdasarkan tinjauan pra-eksekusi (*gap analysis*), tim telah mengidentifikasi **4 temuan kritis** dan menyiapkan langkah penyesuaian agar tidak terjadi hambatan teknis saat sprint berjalan:

1. **Konsistensi Arsitektur Backend (Fastify vs Medusa)**:
   * *Keputusan*: Menghilangkan ketergantungan Medusa untuk fase MVP dan menggunakan arsitektur **Pure Fastify Modular Monolith** agar implementasi cart & checkout lebih ramping, cepat, dan mudah di-maintain.
2. **Kelengkapan Skema Database**:
   * *Tindakan*: Tabel `users`, `carts`, dan `cart_items` telah dimasukkan ke dalam schema awal (Hari 1) agar persistensi data keranjang tidak tertunda.
3. **Penempatan Modul Autentikasi**:
   * *Tindakan*: Modul Auth dimajukan ke **Hari 2** (sebelum routing desain) sehingga fitur simpan desain (*Save Design*) memiliki keterikatan `user_id` yang valid sejak awal.
4. **Strategi Pembuatan Thumbnail Desain**:
   * *Tindakan*: Menggunakan mekanisme *client-side snapshot* (`stage.toDataURL()`) untuk menghemat beban komputasi server dan mempercepat proses penyimpanan desain.

---

## 7. Manajemen Risiko Utama

| Risiko | Tingkat | Dampak | Strategi Mitigasi |
|---|---|---|---|
| **Ketidakakuratan Lebar Punggung (*Spine Defect*)** | Tinggi | Kover hasil cetak tidak pas dengan ketebalan buku | Mengunci formula matematis: `Spine = (Jml Lembar / 2 × Tebal Kertas) + (2 × Tebal Greyboard) + Hinge Hump (1.5mm)`. |
| **Gambar User Pecah saat Dicetak** | Tinggi | Kualitas cetak buruk | Peringatan otomatis (*Pre-flight Alert*) jika gambar < 150 DPI sebelum masuk ke keranjang. |
| **Beban Server Macet saat Generate PDF** | Sedang | Server API lambat / *out-of-memory* | Isolasi rendering PDF ke worker thread terpisah menggunakan BullMQ + Redis. |
| **Keterlambatan Timeline 7 Hari** | Sedang | Demo tidak siap | Penerapan *Scope Cuts* agresif (fokus pada alur kerja utama, menunda fitur pelengkap). |

---

## 8. Kriteria Keberhasilan (Definition of Done)

Sprint 1 dinyatakan berhasil dan siap dipresentasikan jika memenuhi seluruh kriteria berikut:
- [x] User dapat melakukan kustomisasi buku dari Fase 1 hingga Fase 4 tanpa error.
- [x] Teks pada punggung buku otomatis menyesuaikan batas aman sesuai variasi kertas & lembar yang dipilih.
- [x] Desain dapat disimpan dan dipulihkan kembali dari database.
- [x] Checkout pesanan memicu proses background worker untuk menghasilkan file produksi.
- [x] File ZIP hasil render (Cover PDF, Interior PDF, Spec Sheet) dapat diunduh dari Admin Dashboard dan valid saat dibuka di PDF reader.

---

## 9. Rekomendasi & Langkah Selanjutnya

1. **Pemberian Persetujuan (Sign-Off)**: Memohon persetujuan Project Manager terhadap dokumen arsitektur dan timeline Sprint 1 7-Hari.
2. **Kickoff Eksekusi Hari 1**: Memulai inisialisasi monorepo, setup database PostgreSQL/Prisma, dan pipeline PDF Engine.
3. **Daily Sync Checkpoint**: Standup harian singkat (15 menit) setiap akhir jam kerja untuk memverifikasi pencapaian target harian sesuai `roadmap-sprint1.md`.
