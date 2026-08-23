# Progress — Booxury Sprint 1

> Catatan eksekusi harian. 1 MD per hari (PLAN + LOG + CHECKPOINT di file yang sama, bukan file terpisah).
> Prinsip: monolith modular — folder structure minimal, satu sumber kebenaran per hari.

---

## 🚀 Quick Start untuk Agent Baru

> Kalau kamu (Opus/Sonnet) baru buka folder ini di sesi baru, baca ini dulu:

### Lokasi
`progress/` di root project, **sibling** dari `planning/` (bukan di dalam planning).

### Struktur file
| File | Untuk siapa | Kapan di-update |
|---|---|---|
| `README.md` (ini) | Semua agent | Kapan perlu navigasi |
| `ERRORS.md` | Semua agent | Append error baru saat encountered |
| `Hari-0.md` s/d `Hari-7.md` | Opus (PLAN, CHECKPOINT) + Sonnet (LOG) | Pagi (PLAN), per-task (LOG), EOD (CHECKPOINT) |

### First action untuk sesi baru
1. Cek `Hari-N.md` untuk hari ini (N = current day 0–7)
2. Kalau PLAN section belum ada → kamu Opus, tulis PLAN
3. Kalau PLAN sudah ada → kamu Sonnet, eksekusi tasks + update LOG
4. Sebelum mulai task baru → cek `ERRORS.md` untuk error history yang mungkin related

### Reference wajib
- Ground rules: [`../planning/README.md` §8.5–8.6](../planning/README.md#85-honest-scope--anti-loop-rules)
- Sprint roadmap: [`../planning/roadmap-sprint1.md`](../planning/roadmap-sprint1.md)
- Domain specs: [`../planning/README.md`](../planning/README.md) §1–8

### Escalation rule
Sonnet stuck > 1 jam atau 2 attempt gagal → stop, dokumentasikan, escalate ke Opus 4.6.

---

## Struktur

| File | Fungsi |
|---|---|
| `README.md` (ini) | Index + sprint summary |
| `ERRORS.md` | Cumulative error log lintas hari (di-centralized karena cross-day) |
| `Hari-0.md` s/d `Hari-7.md` | Satu file per hari: PLAN (pagi) + LOG (eksekusi) + CHECKPOINT (EOD) |

> **Prinsip**: 1 file MD per konsep. Tidak ada sub-folder, tidak ada file terpisah per section — supaya tetap **monolith modular** (konsolidasi, satu sumber kebenaran per hari).

## Timeline

| Hari | Tanggal | Tema | Agent |
|---|---|---|---|
| 0 | Minggu, 23 Agt 2026 | Setup + Riset Percetakan | Opus plan + Sonnet exec |
| 1 | Senin, 24 Agt 2026 | Foundation + PDF Engine | Opus + Sonnet |
| 2 | Selasa, 25 Agt 2026 | Pricing + Auth + Backend + Wizard F1 | Opus + Sonnet |
| 3 | Rabu, 26 Agt 2026 | Editor Konva Part 1 | Sonnet |
| 4 | Kamis, 27 Agt 2026 | Editor Part 2 + Fase 3 Finish | Sonnet |
| 5 | Jumat, 28 Agt 2026 | **3D Viewport CSS + Fase 4 + Cart** | Opus (3D design) + Sonnet (impl) |
| 6 | Sabtu, 29 Agt 2026 | PDF Worker + Admin Dashboard | Sonnet |
| 7 | Minggu, 30 Agt 2026 | Polish + Demo Prep | Opus + Sonnet |

## Sprint Summary (di-update EOD tiap hari)

| Hari | Status | DoD | Carried Over |
|---|---|---|---|
| 0 | ✅ selesai | 6/7 | Riset percetakan DITUNDA (manual, perlu user hubungi percetakan) |
| 1 | ⬜ belum | — | — |
| 2 | ⬜ belum | — | — |
| 3 | ⬜ belum | — | — |
| 4 | ⬜ belum | — | — |
| 5 | ⬜ belum | — | — |
| 6 | ⬜ belum | — | — |
| 7 | ⬜ belum | — | — |

## Multi-Agent Convention

- **Opus 4.6** (medium): Tulis PLAN section di pagi hari, verifikasi CHECKPOINT di EOD, root-cause analysis untuk error kompleks
- **Sonnet 4.6** (medium): Eksekusi tasks, update LOG section per task selesai, append error baru ke ERRORS.md
- **Escalation**: Sonnet stuck > 2 attempt → escalate ke Opus dengan symptom + attempted fixes

## Coding Environment & MCP Tools

### Installed MCPs
- **Playwright** — E2E browser testing. Invoke via Claude Code MCP integration.
- **testsprite** — AI-assisted test generation + UI/visual verification. Invoke via Claude Code MCP integration.

### Konfigurasi MCP (`.mcp.json` di project root atau `~/.claude/mcp.json`)
MCP servers dideklarasikan di luar planning — cek dokumentasi Claude Code untuk format persis. Yang penting: kedua MCP harus tersedia sebelum agent Sonnet 4.6 dipakai untuk tasks testing.

### Kapan Pakai Tools

| Tool | Dipakai di Hari | Untuk apa |
|---|---|---|
| Playwright | 6, 7 | E2E test critical flows (login → wizard → cart → checkout → admin download ZIP) |
| testsprite | 5, 6, 7 | Verifikasi UI/visual (3D viewport rendering, wizard step transitions, responsive layout) + auto-generate test cases untuk Sonnet eksekusi |

### Sonnet 4.6 MCP Invocation Pattern
Saat Sonnet 4.6 perlu pakai Playwright/testsprite, ia bisa langsung invoke via Claude Code MCP tools (lihat tools yang available di session). Tidak perlu manual config — MCP server sudah handle. Kalau Sonnet stuck saat pakai MCP tools, escalate ke Opus 4.6.

## Update Convention

Setiap file `Hari-N.md` mengikuti pola:

1. **PLAN** (pagi, Opus) — task list + acceptance criteria + risks
2. **LOG** (eksekusi, Sonnet) — per-task entry dengan timestamp + status + commit hash
3. **CHECKPOINT** (EOD, Opus) — DoD status + carried over + tomorrow's focus
