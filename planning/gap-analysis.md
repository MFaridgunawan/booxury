# Gap Analysis — README.md & roadmap-sprint1.md

> **Verdict**: Dokumen sangat solid — 85% production-ready. Ada **12 gap** yang perlu ditambal, 4 di antaranya **Critical** (bisa bikin sprint gagal).

---

## 🔴 Critical Gaps (Harus diperbaiki sebelum mulai coding)

### GAP-1: Medusa vs Plain Fastify — Arsitektur Belum Konsisten

**Lokasi**: [README.md §2](file:///media/faridgun/DATA/Study/Polman/PPI_INTERNAL/hardcover_custom/planning/README.md#L97) vs [README.md §5](file:///media/faridgun/DATA/Study/Polman/PPI_INTERNAL/hardcover_custom/planning/README.md#L897-L918)

**Masalah**: §2 Stack Snapshot mengatakan backend adalah **"Fastify (Node/TS) — modular monolith"** (tanpa Medusa). Tapi §5 API Contract masih menggunakan endpoint Medusa-native:

```
POST /store/carts/:id/items          ← ini Medusa SDK
POST /store/carts/:id/payment-sessions   ← ini Medusa SDK
POST /store/carts/:id/complete       ← ini Medusa SDK
```

Dan §5 masih menyebut `x-medusa-access-token` di auth header.

**Dampak**: Developer akan bingung di Hari 5 — apakah harus install Medusa v2 atau bikin cart dari nol?

**Fix**: Pilih satu. Rekomendasi untuk MVP 7-hari: **pure Fastify tanpa Medusa**. Ganti endpoint cart di §5 dengan custom endpoints:
```
POST /api/cart/items     (custom)
POST /api/checkout       (custom)
```
Dan tambahkan tabel `carts` + `cart_items` di Data Model §3.

---

### GAP-2: Tabel `users` dan `carts` Tidak Ada di Data Model

**Lokasi**: [README.md §3](file:///media/faridgun/DATA/Study/Polman/PPI_INTERNAL/hardcover_custom/planning/README.md#L335-L558)

**Masalah**: ER Diagram referensi entity `USER` tapi tidak ada definisi tabel `users` (kolom apa saja? password hash? role?). Juga tidak ada tabel `carts` / `cart_items` — padahal flow checkout mengharuskan ada keranjang sementara sebelum jadi order.

**Dampak**: Hari 1 (Prisma migration) akan stuck karena schema tidak lengkap. Hari 5 (cart) tidak punya persistence layer.

**Fix**: Tambahkan minimal:

```sql
CREATE TABLE users (
  id            uuid PRIMARY KEY,
  email         text UNIQUE NOT NULL,
  name          text NOT NULL,
  password_hash text NOT NULL,
  role          text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE carts (
  id         uuid PRIMARY KEY,
  user_id    uuid REFERENCES users(id),
  session_id text,  -- untuk guest cart (opsional)
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cart_items (
  id         uuid PRIMARY KEY,
  cart_id    uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  design_id  uuid NOT NULL REFERENCES designs(id),
  quantity   int NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

---

### GAP-3: Auth Tidak Ada Sampai Hari 7, Tapi Dibutuhkan dari Hari 3

**Lokasi**: [roadmap-sprint1.md Hari 3](file:///media/faridgun/DATA/Study/Polman/PPI_INTERNAL/hardcover_custom/planning/roadmap-sprint1.md#L410) vs [Hari 7](file:///media/faridgun/DATA/Study/Polman/PPI_INTERNAL/hardcover_custom/planning/roadmap-sprint1.md#L823)

**Masalah**: `POST /api/designs` di Hari 3 membutuhkan `user_id` (kolom `designs.user_id` adalah FK). Tapi auth baru di-setup di Hari 7. Ini berarti Hari 3-6 tidak punya mekanisme untuk mengetahui siapa user yang sedang login.

**Dampak**: Save design di Hari 3 akan error karena `user_id` null, atau harus di-hardcode — lalu refactor besar di Hari 7.

**Fix**: Pindahkan setup auth **ke Hari 2** (sebelum backend routes). Cukup basic:
- Buat 1 demo user di seed script (sudah ada di Hari 7)
- NextAuth credentials provider (15 menit setup)
- Middleware `requireAuth` yang inject `user_id` ke request
- Hardcode admin check: `if (user.role === 'admin')`

---

### GAP-4: Thumbnail Generation — Server vs Client Tidak Jelas

**Lokasi**: [roadmap-sprint1.md Hari 3 L418](file:///media/faridgun/DATA/Study/Polman/PPI_INTERNAL/hardcover_custom/planning/roadmap-sprint1.md#L418)

**Masalah**: Hari 3 mengatakan "Generate thumbnail (Konva stage → PNG, upload ke R2/local)". Tapi Konva berjalan di **browser**. Server tidak punya Konva instance. Ada 2 opsi:

1. **Client-side**: `stage.toDataURL()` → kirim base64 ke server → simpan
2. **Server-side**: Install `konva` + `canvas` (node-canvas) di backend → render dari JSON

Opsi 1 jauh lebih simple untuk MVP tapi tidak disebutkan secara eksplisit.

**Fix**: Tambahkan keterangan eksplisit di roadmap:
```
Thumbnail: client-side via stage.toDataURL('image/png', 0.5)
→ kirim sebagai base64 di body POST /api/designs
→ server decode + upload ke R2/local
```

---

## 🟡 High Gaps (Harus diperbaiki sebelum fase terkait)

### GAP-5: Spine Formula `totalSheetHeightMm` Tidak Include Turn-in Atas/Bawah

**Lokasi**: [README.md §4 L703-L704](file:///media/faridgun/DATA/Study/Polman/PPI_INTERNAL/hardcover_custom/planning/README.md#L698-L708)

**Masalah**: Formula saat ini:
```ts
totalSheetHeightMm: bookDims.heightMm + bleedMm * 2
```

Ini hanya menambahkan bleed (3mm × 2 = 6mm). Tapi untuk hardcover, **turn-in juga ada di atas dan bawah** (bukan hanya kiri/kanan). Cover sheet harus cukup besar untuk dilipat ke dalam di semua 4 sisi.

**Fix**:
```ts
totalSheetHeightMm: bookDims.heightMm + turnInMm * 2 + bleedMm * 2
```

Contoh A5: 210mm + 15×2 + 3×2 = 246mm (bukan 216mm).

Dan untuk `totalSheetWidthMm`, bleed juga perlu ditambahkan:
```ts
totalSheetWidthMm: bookDims.widthMm + spineWidthMm + bookDims.widthMm + turnInMm * 2 + bleedMm * 2
```

> [!CAUTION]
> Ini akan menghasilkan PDF yang **terlalu kecil** kalau tidak diperbaiki. Percetakan akan menolak karena tidak cukup area lipat.

---

### GAP-6: In-Memory Queue Hilang Saat Restart

**Lokasi**: [roadmap-sprint1.md Hari 6 L658-L685](file:///media/faridgun/DATA/Study/Polman/PPI_INTERNAL/hardcover_custom/planning/roadmap-sprint1.md#L658-L685)

**Masalah**: Queue menggunakan `Map<string, Job>()` in-memory. Kalau server restart (crash, deploy, PM2 restart), semua job yang pending **hilang**. Order yang sudah dibayar tapi PDF-nya belum di-generate akan "menghilang" tanpa jejak.

**Fix untuk MVP**: Gunakan database sebagai queue (bukan in-memory). Tambahkan tabel:

```sql
CREATE TABLE job_queue (
  id          uuid PRIMARY KEY,
  order_id    uuid NOT NULL REFERENCES orders(id),
  status      text NOT NULL DEFAULT 'pending',
  attempts    int NOT NULL DEFAULT 0,
  error       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  started_at  timestamptz,
  finished_at timestamptz
);
```

Poll dengan `SELECT ... WHERE status = 'pending' ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED`. Sederhana, persistent, dan tidak butuh Redis.

---

### GAP-7: Admin vs Customer Role Tidak Ada di Data Model

**Lokasi**: [README.md §3](file:///media/faridgun/DATA/Study/Polman/PPI_INTERNAL/hardcover_custom/planning/README.md#L335) + [roadmap-sprint1.md L835](file:///media/faridgun/DATA/Study/Polman/PPI_INTERNAL/hardcover_custom/planning/roadmap-sprint1.md#L835)

**Masalah**: Roadmap menyebut `/admin/* → admin role required` tapi tidak ada field `role` di entity `USER` di ER diagram maupun schema. Tanpa ini, tidak ada cara membedakan admin dari customer.

**Fix**: Sudah tercakup di solusi GAP-2 (tambahkan `role` field di `users` table).

---

### GAP-8: Tidak Ada Pagination di List Endpoints

**Lokasi**: [README.md §5](file:///media/faridgun/DATA/Study/Polman/PPI_INTERNAL/hardcover_custom/planning/README.md#L748-L982)

**Masalah**: `GET /store/materials`, `GET /api/designs`, `GET /admin/orders` — semua tanpa pagination. Untuk MVP mungkin oke, tapi begitu ada 50+ orders atau 20+ designs per user, response akan membengkak.

**Fix**: Tambahkan konvensi pagination di API Contract:
```
?page=1&limit=20  (default limit=20, max=100)

Response wrapper:
{
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 45 }
}
```

---

## 🟢 Medium Gaps (Monitor, perbaiki saat ada waktu)

### GAP-9: Environment Variables Tidak Didokumentasikan

**Masalah**: Tidak ada `.env.example` atau daftar env vars yang diperlukan. Developer baru (atau diri sendiri setelah 2 minggu) akan bingung variabel apa saja yang harus di-set.

**Fix**: Tambahkan section di README atau buat file `.env.example`:
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
R2_ENDPOINT=...
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
R2_BUCKET=hardcover-assets
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
MIDTRANS_SERVER_KEY=...    # sprint 2
MIDTRANS_CLIENT_KEY=...    # sprint 2
```

---

### GAP-10: File Upload Storage Strategy untuk MVP Belum Eksplisit

**Lokasi**: [roadmap-sprint1.md Hari 3 L418](file:///media/faridgun/DATA/Study/Polman/PPI_INTERNAL/hardcover_custom/planning/roadmap-sprint1.md#L418)

**Masalah**: "upload ke R2/local" — untuk MVP 7 hari, setup R2 credentials + SDK config bisa makan 1-2 jam. Tapi local storage juga punya masalah (path, serving static files, cleanup).

**Fix**: Eksplisitkan: **MVP pakai local filesystem** (`/public/uploads/`). Buat abstraksi `StorageAdapter` interface supaya ganti ke R2 di sprint 2 tanpa refactor:

```ts
interface StorageAdapter {
  upload(key: string, buffer: Buffer): Promise<string>;  // returns URL
  getSignedUrl(key: string): Promise<string>;
}
```

---

### GAP-11: Concurrent Design Edit (2 Tab) Bisa Overwrite

**Masalah**: Jika user buka design yang sama di 2 browser tab, edit di keduanya, lalu save — last write wins tanpa warning. Data dari tab pertama hilang.

**Fix** (low effort): Tambahkan `version` (integer) field di `designs`. Saat PUT, kirim `version` dari client. Server cek:
```ts
if (design.version !== body.version) {
  return 409; // Conflict — "Design sudah diubah di tab lain"
}
```

---

### GAP-12: Design Payload Size Limit Tidak Ada

**Masalah**: Tidak ada batas berapa besar `design_payload` (Konva JSON) boleh disimpan. User bisa menambahkan ratusan layers dan menghasilkan payload 10MB+ yang memperlambat save/restore.

**Fix**: Tambahkan validasi di `POST/PUT /api/designs`:
```ts
const MAX_PAYLOAD_SIZE = 2 * 1024 * 1024; // 2MB
if (JSON.stringify(body.design_payload).length > MAX_PAYLOAD_SIZE) {
  throw new AppError('VALIDATION_FAILED', 'Design terlalu kompleks');
}
```

---

## Roadmap Timing Inconsistency (Minor)

| Issue | Detail |
|---|---|
| Jam format tidak konsisten | Hari 1 pakai clock time (08:00–09:00), Hari 2-7 pakai relative time (00:00–02:00). Sebaiknya konsistenkan ke satu format. |
| Hari 2 terlalu padat | Pricing engine + spine-calc + Fastify setup + Next.js setup + Fase 1 UI + integration test dalam 8 jam. Ini realistis hanya kalau tidak ada blocker. Pertimbangkan pindahkan Next.js setup ke akhir Hari 1. |

---

## Summary Scorecard

| Aspek | Score | Catatan |
|---|---|---|
| **Completeness** | 8/10 | Hampir semua area tercakup, minus user/cart table dan auth timing |
| **Consistency** | 7/10 | Medusa vs Fastify confusion perlu diselesaikan |
| **Reliability** | 8/10 | Snapshot pattern excellent, spine formula perlu fix turn-in |
| **Scalability** | 9/10 | Modular monolith + worker separation = future-proof |
| **Executability** | 7/10 | Auth di Hari 7 akan bikin Hari 3-6 fragile |
| **Risk Awareness** | 9/10 | Risk register sangat mature, mitigasi konkret |

**Overall: 8/10** — Dengan 4 fix Critical, naik ke 9.5/10.

> [!IMPORTANT]
> **Prioritas fix sebelum mulai coding:**
> 1. Selesaikan GAP-1 (Medusa vs Fastify — pilih satu)
> 2. Tambahkan tabel `users` + `carts` (GAP-2)
> 3. Pindahkan auth ke Hari 2 (GAP-3)
> 4. Fix spine formula turn-in (GAP-5)
