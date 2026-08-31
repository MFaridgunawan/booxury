# Hari-8 — Customer Proof PDF (final v4) — 31 Agt 2026

## Fix: Plain/Lined + 3D Isometric Book

### Perbaikan
1. **Layout polos/bergaris**: halaman sampel interior sekarang menampilkan (`halaman polos — tanpa garis`) pada layout plain, dan garis tulis pada layout lined. TIDAK lagi menampilkan garis paragraph di mode polos.
2. **3D Isometric Book** (halaman 4): tampak buku dengan perspektif isometrik — cover depan, spine dengan teks berotasi, blok halaman di sisi kanan dengan edge finish + garis kertas bertumpuk, top page edge, headband, ribbon menjuntai, greyboard, endpaper hint, shadow. Delapan badge emas bernomor + legend di sisi kanan (judul + deskripsi tiap komponen).

### Halaman
1. Cover Final — artwork + BOOXURY + gold corners
2. Blueprint Spread — dimension arrows, grid, legend
3. Interior & Material — 2 sample halaman (plain: kosong alami, lined: bergaris) + kertas detail + endsheet
4. Tampak Buku 3D — isometric view semua komponen dengan callout bernomor
5. Spesifikasi & Detail — tabel + ilustrasi inline

### Test
- 19/19 pass
- API + Web build: clean
## Perbaikan v5 — True 3D Isometric Book (SVG projector)

### Masalah Sebelumnya
Halaman "Tampak Buku 3D" memakai primitif 2D kaku (rect + stroke) → terlihat flat/2D, bukan 3D sejati.

### Solusi
- Modul baru `book-visual.ts`: proyeksi 3D nyata (yaw+pitch) → SVG (front/top/right face shading berbeda, stacked paper lines, spine text rotasi, headband, bezier ribbon + V-cut, greyboard ledger, drop shadow + sheen gradient).
- Dikodekan jadi PNG via `sharp` (anti-aliased) → di-embed `doc.image` di page 4.
- Legend 8 callout tetap; `generateCustomerProofPdf` jadi `async`, build PNG di depan lalu pass ke `page4_FullBook`.
- Fallback: jika render gagal → halaman tetap digambar tanpa gambar (guard `if (bookPng)`).

### Verified
- Test: 19/19 pass (10 customer-proof + 9 cover).
- API `tsc` build: clean.
- Web Next build: compiled successfully.
- (`pnpm --filter @booxury/pdf-engine test`) clean.
