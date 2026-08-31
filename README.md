# Booxury

**Custom Hardcover Notebook Web-to-Print** — aplikasi e-commerce untuk membuat notebook hardcover kustom (pilih ukuran, bahan, cover, finish, lalu checkout). Monorepo pnpm + Turborepo: frontend Next.js 15, backend Fastify, database PostgreSQL 16.

Proyek PBL Politeknik Manufaktur Bandung.

---

## 📋 Prasyarat

Instal terlebih dahulu di mesin Anda:

- **Node.js** `>= 20` — [nodejs.org](https://nodejs.org)
- **pnpm** `9.x` — aktifkan via Corepack:
  ```bash
  corepack enable pnpm
  # atau global: npm install -g pnpm@9
  ```
- **Podman** atau **Docker** — untuk menjalankan PostgreSQL 16

Cek versi:

```bash
node -v        # >= v20
pnpm -v        # 9.x
podman --version   # atau docker --version
```

---

## 🚀 Cara Menjalankan dari Awal

### 1. Clone & masuk direktori

```bash
git clone https://github.com/MFaridgunawan/booxury.git
cd booxury
```

> Branch yang dipakai adalah **`main`**.

### 2. Install dependencies

```bash
pnpm install
```

Setelah install, generate Prisma client:

```bash
pnpm --filter @booxury/database generate
```

### 3. Setup database (PostgreSQL via container)

Jalankan PostgreSQL 16 dengan nama `booxury-pg` di port **5433**:

```bash
podman run -d --name booxury-pg \
  -e POSTGRES_DB=booxury \
  -e POSTGRES_USER=booxury \
  -e POSTGRES_PASSWORD=booxury_dev \
  -p 5433:5432 \
  docker.io/library/postgres:16-alpine
```

> Jika pakai Docker, ganti `podman` dengan `docker`. Pastikan port 5433 tidak dipakai aplikasi lain.

### 4. Konfigurasi environment (`.env`)

Siapkan file `.env` di **root** project:

```
DATABASE_URL="postgresql://booxury:booxury_dev@localhost:5433/booxury"
AUTH_SECRET="<generate-secure-string>"
NEXTAUTH_SECRET="<generate-secure-string>"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_API_URL="http://localhost:3001"
NEXT_PUBLIC_API_URL="http://localhost:3001"
NODE_ENV="development"
```

> Generate `AUTH_SECRET` / `NEXTAUTH_SECRET` dengan: `openssl rand -base64 32`
>
> **Opsional** — upload file cover disimpan ke Cloudflare R2. Lewati dulu jika tidak punya akun R2 (`R2_*` dibiarkan kosong; fallback lokal bekerja).

### 5. Migrasi & seed database

Jalankan migrasi, lalu isi data dasar (bahan, ukuran, aksesoris, akun demo), lalu data demo (desain & order contoh):

```bash
pnpm db:migrate          # prisma migrate dev (pakai migration yang ada)
pnpm db:seed             # data dasar + akun demo
pnpm --filter @booxury/database demo:seed   # desain & order demo
```

### 6. Jalankan aplikasi

Start web (Next.js `:3000`) dan API (Fastify `:3001`) bersamaan:

```bash
pnpm dev
```

Buka **http://localhost:3000** di browser.

### 7. Jalankan PDF worker (terminal terpisah)

Worker memproses pembuatan PDF custom cover di background:

```bash
pnpm --filter @booxury/api worker
```

---

## 🔐 Akun Demo

| Role     | Email                    | Password   |
|----------|--------------------------|------------|
| Customer | `demo@booxury.local`     | `demo123`  |
| Admin    | `admin@booxury.local`    | `admin123` |

---

## 🧪 Verifikasi & Perintah Berguna

Cek API liveness:

```bash
curl http://localhost:3001/health
```

Build seluruh monorepo (validasi TypeScript semua package):

```bash
pnpm build
```

Menjalankan test unit:

```bash
pnpm test
```

Prisma Studio (GUI database):

```bash
pnpm db:studio
```

---

## 🏗️ Arsitektur

**Monorepo**: pnpm workspaces + Turborepo.

| Layer | Tech | Port |
|---|---|---|
| Web (BFF proxy) | Next.js 15 App Router + Zustand + Konva.js + Tailwind + Three.js | 3000 |
| API | Fastify + Prisma | 3001 |
| DB | PostgreSQL 16 (Podman/Docker) | 5433 |
| Auth | NextAuth v5 (credentials → Fastify JWT) | — |
| PDF worker | Fastify background worker | — |

```
booxury/
├── apps/
│   ├── web/                 # Next.js 15 — UI + BFF proxy
│   │   ├── app/             # routes: login, customize/*, checkout/*, admin/*
│   │   ├── components/      # configurator (Konva editor), three, wizard
│   │   ├── lib/             # auth, stores (Zustand), api-client
│   │   └── middleware.ts    # route protection
│   └── api/                 # Fastify — REST API
│       ├── src/
│       │   ├── server.ts
│       │   ├── plugins/auth.ts
│       │   ├── worker.ts    # PDF worker
│       │   └── modules/     # catalog, configurator, pricing, commerce, admin, production
│       └── tsconfig.json
├── packages/
│   ├── database/            # Prisma schema, migrasi & seed
│   ├── pricing-engine/      # fungsi harga murni (TS)
│   ├── spine-calc/          # rumus spine hardcover (TS)
│   ├── design-types/        # Zod schemas & tipe Konva
│   ├── pdf-engine/          # pembuatan PDF custom cover
│   └── three/               # helper scene 3D
└── pnpm-workspace.yaml
```

**Modul backend** (`apps/api/src/modules/`):

- `catalog/` — `/store/materials`, `/store/sizes`, `/store/accessories`
- `configurator/` — CRUD desain kustom
- `pricing/` — `/api/price-quote` (server-authoritative, harga dihitung di API)
- `commerce/` — cart & checkout
- `admin/` — manajemen order & bahan
- `production/` — alur produksi
- `auth/` (plugin) — `/api/auth/login`

---

## ❓ Troubleshooting

**`pnpm: command not found`**
→ Aktifkan Corepack: `corepack enable pnpm`.

**Koneksi DB ditolak saat migrate/seed**
→ Pastikan container PostgreSQL berjalan: `podman ps`. Cek `DATABASE_URL` di `.env` cocok dengan credential container.

**Port 3000/3001 sudah terpakai**
→ Hentikan proses pemakai port tersebut, atau ubah port di `apps/web/package.json` (`next dev -p ...`) & `apps/api/src/server.ts`.

**Prisma client tidak ditemukan**
→ Jalankan ulang `pnpm --filter @booxury/database generate`.

---

## 📄 Lisensi

Proyek ini adalah bagian dari kegiatan Project-Based Learning — Politeknik Manufaktur Bandung.
