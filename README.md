# Booxury

**Custom Hardcover Notebook Web-to-Print** — aplikasi e-commerce untuk membuat notebook hardcover kustom (pilih ukuran, bahan, cover, finish, lalu checkout). Monorepo pnpm + Turborepo: frontend Next.js 15, backend Fastify, database PostgreSQL 16.

Proyek PBL Politeknik Manufaktur Bandung.

## ✨ Fitur

- **Customizer 3D & desain cover** — editor Konva (wizard multi-langkah: ukuran, bahan, cover, finish, review)
- **Preview 3D buku** — Three.js (React Three Fiber / `@booxury/three`)
- **Harga real-time** — dihitung server-side (`pricing-engine` + rumus spine `spine-calc`)
- **Checkout & keranjang** — alur belanja lengkap
- **Autentikasi** — login customer & admin (NextAuth v5 + JWT)
- **Admin panel** — kelola order & bahan
- **PDF engine** — generate PDF custom cover & proof untuk produksi
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

### Quick Start (2 langkah)

```bash
# 1. Clone
git clone https://github.com/MFaridgunawan/booxury.git
cd booxury

# 2. Setup sekali (install deps + database + env + migrate + seed)
pnpm bootstrap

# 3. Jalankan (setiap hari)
pnpm dev
```

Buka **http://localhost:3000**.

`pnpm bootstrap` otomatis:
- mengecek prasyarat (Node, pnpm, Podman/Docker),
- install dependencies & generate Prisma client,
- membuat container PostgreSQL 16 `booxury-pg` (port 5433) jika belum ada,
- membuat file `.env` (root & `apps/web`) bila belum ada (AUTH_SECRET digenerate otomatis),
- menjalankan migrasi + seed (data dasar, akun demo, desain & order demo).

> **Idempoten** — aman dijalankan ulang; tidak menimpa container/.env yang sudah ada.
>
> Jika `pnpm bootstrap` tidak terdaftar (versi pnpm lain), jalankan langsung: `bash setup.sh`
>
> **Tanpa Podman/Docker?** `pnpm bootstrap` akan memperingatkan; sediakan PostgreSQL 16 sendiri di `$DATABASE_URL` lalu jalankan ulang.

### PDF worker (terminal terpisah)

Worker memproses pembuatan PDF custom cover di background:

```bash
pnpm --filter @booxury/api worker
```

---

### Setup manual langkah-per-langkah (opsional, bila ingin kontrol penuh)

#### 1. Install dependencies

```bash
pnpm install
pnpm --filter @booxury/database generate
```

#### 2. Setup database (PostgreSQL via container)

```bash
podman run -d --name booxury-pg \
  -e POSTGRES_DB=booxury \
  -e POSTGRES_USER=booxury \
  -e POSTGRES_PASSWORD=booxury_dev \
  -p 5433:5432 \
  docker.io/library/postgres:16-alpine
```

> Jika pakai Docker, ganti `podman` dengan `docker`. Pastikan port 5433 tidak dipakai aplikasi lain.

#### 3. Konfigurasi environment (`.env`)

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

#### 4. Migrasi & seed database

```bash
pnpm db:migrate
pnpm db:seed
pnpm --filter @booxury/database demo:seed
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
