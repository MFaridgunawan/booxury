'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConfiguratorStore } from '../../lib/stores/configurator';
import { PAPER_CATEGORIES } from '@booxury/design-types';

const SIZES = [
  { code: 'A5', label: 'A5', sublabel: '148 × 210 mm', base: 'Rp35.000' },
  { code: 'B5', label: 'B5', sublabel: '176 × 250 mm', base: 'Rp45.000' },
  { code: 'A6', label: 'A6', sublabel: '105 × 148 mm', base: 'Rp25.000' },
];

const PAPERS = [
  { code: 'BOOK57',  label: 'Bookpaper 57 gsm',  cat: 'bookpaper', note: 'Tipis, nyaman untuk teks panjang' },
  { code: 'BOOK72',  label: 'Bookpaper 72 gsm',  cat: 'bookpaper', note: 'Standar novel' },
  { code: 'BOOK90',  label: 'Bookpaper 90 gsm',  cat: 'bookpaper', note: 'Lebih tebal, tekstur premium' },
  { code: 'HVS70',   label: 'HVS 70 gsm',        cat: 'hvs',       note: 'Putih bersih, bagus untuk tulis' },
  { code: 'HVS80',   label: 'HVS 80 gsm',        cat: 'hvs',       note: 'Standar' },
  { code: 'HVS100',  label: 'HVS 100 gsm',       cat: 'hvs',       note: 'Tebal, bagus untuk formulir' },
  { code: 'ART120',  label: 'Art Paper 120 gsm',  cat: 'art',       note: 'Glossy — warna hidup, bagus untuk foto' },
  { code: 'ART150',  label: 'Art Paper 150 gsm',  cat: 'art',       note: 'Glossy lebih tebal' },
  { code: 'MATT120', label: 'Matt Paper 120 gsm', cat: 'matt',      note: 'Doff/coated — foto dengan tampilan lembut' },
  { code: 'MATT150', label: 'Matt Paper 150 gsm', cat: 'matt',      note: 'Matt lebih tebal' },
];

const BOARDS = [
  { code: 'BOARD14', label: 'Greyboard 1.4 mm', note: 'Tipis — untuk buku tipis <120 hal' },
  { code: 'BOARD18', label: 'Greyboard 1.8 mm', note: 'Sedang' },
  { code: 'BOARD20', label: 'Greyboard 2.0 mm', note: 'Standar hardcover — direkomendasikan' },
  { code: 'BOARD25', label: 'Greyboard 2.5 mm', note: 'Tebal — premium, durably solid' },
];

const ENDPAPERS = [
  { code: 'ENDFLAT',  label: 'Endpaper 120 gsm',     note: 'Tipis, flat, minimalis' },
  { code: 'ENDPLAIN', label: 'Endpaper 150 gsm',     note: 'Standar — direkomendasikan', highlight: true },
  { code: 'ENDPAT',   label: 'Endpaper 180 gsm + Motif', note: 'Premium, kertas bermotif', price: '+Rp5.000' },
];

// Signature binding: pages must be divisible by 4
const snapPages = (n: number) => Math.max(80, Math.round(n / 4) * 4);
const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function BasePage() {
  const router = useRouter();
  const { base, setBase, setPhase, setEstimatedPrice } = useConfiguratorStore();
  usePhaseEffect('base');

  const [priceLoading, setPriceLoading] = useState(false);
  const [pagesInput, setPagesInput] = useState(String(base.pages));

  // Sync input → store when valid
  const handlePagesBlur = () => {
    const n = parseInt(pagesInput);
    if (!isNaN(n) && n >= 80 && n % 4 === 0) {
      setBase({ pages: n });
    } else {
      const snapped = snapPages(parseInt(pagesInput) || 80);
      setPagesInput(String(snapped));
      setBase({ pages: snapped });
    }
  };

  // Fetch real-time price
  useEffect(() => {
    const timer = setTimeout(async () => {
      setPriceLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/price-quote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            size: base.size,
            pages: base.pages,
            paperCode: base.paperCode,
            boardCode: base.boardCode,
            endpaperCode: base.endpaperCode,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setEstimatedPrice(data.totalPrice);
        }
      } catch { /* price unavailable */ }
      finally { setPriceLoading(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [base.size, base.pages, base.paperCode, base.boardCode, base.endpaperCode]);

  const goNext = () => { setPhase('cover'); router.push('/customize/cover'); };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-serif font-bold text-brand-900 mb-1">Ukuran &amp; Isi Buku</h1>
      <p className="text-gray-500 mb-8">Step 1 dari 4 — Tentukan dimensi, jumlah halaman, dan kertas.</p>

      <div className="space-y-8">

        {/* ── Size ─────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow border p-6">
          <h2 className="font-semibold text-brand-900 mb-4">Ukuran</h2>
          <div className="grid grid-cols-3 gap-3">
            {SIZES.map((s) => (
              <button
                key={s.code}
                onClick={() => setBase({ size: s.code as typeof base.size })}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  base.size === s.code
                    ? 'border-brand-700 bg-brand-50'
                    : 'border-gray-200 hover:border-brand-300'
                }`}
              >
                <p className="text-lg font-bold text-brand-900">{s.label}</p>
                <p className="text-xs text-gray-500 mt-1">{s.sublabel}</p>
                <p className="text-xs font-medium text-brand-700 mt-2">{s.base}</p>
              </button>
            ))}
          </div>
        </section>

        {/* ── Pages + Paper + Board ────────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow border p-6">
          <h2 className="font-semibold text-brand-900 mb-4">Isi Buku</h2>

          {/* Pages input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jumlah Halaman <span className="text-gray-400 font-normal">(harus kelipatan 4, min 80)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={80}
                max={400}
                step={4}
                value={pagesInput}
                onChange={e => setPagesInput(e.target.value)}
                onBlur={handlePagesBlur}
                className="w-32 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
              <div className="flex gap-2">
                {[80, 100, 120, 160, 200].map(n => (
                  <button key={n} onClick={() => { setPagesInput(String(n)); setBase({ pages: n }); }}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      base.pages === n ? 'bg-brand-700 text-white border-brand-700' : 'border-gray-300 text-gray-600 hover:border-brand-400'
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">Signature binding — setiap 4 halaman = 1 lembar yang dilipat</p>
          </div>

          {/* Paper */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Kertas Isi</label>
            <div className="space-y-1">
              {(Object.keys(PAPER_CATEGORIES) as Array<keyof typeof PAPER_CATEGORIES>).map(cat => {
                const items = PAPERS.filter(p => p.cat === cat);
                if (!items.length) return null;
                return (
                  <div key={cat} className="mb-3">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                      {PAPER_CATEGORIES[cat].label} — {PAPER_CATEGORIES[cat].desc}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {items.map((p) => (
                        <button
                          key={p.code}
                          onClick={() => setBase({ paperCode: p.code })}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            base.paperCode === p.code
                              ? 'border-brand-700 bg-brand-50'
                              : 'border-gray-200 hover:border-brand-300'
                          }`}
                        >
                          <p className="text-sm font-medium">{p.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{p.note}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Board */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Greyboard (Keras Kover)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BOARDS.map((b) => (
                <button
                  key={b.code}
                  onClick={() => setBase({ boardCode: b.code })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    base.boardCode === b.code ? 'border-brand-700 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                  }`}
                >
                  <p className="text-sm font-medium">{b.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{b.note}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Endpaper */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Endpaper (Kertas Lepek)</label>
            <p className="text-xs text-gray-400 mb-2">Kertas yang merekatkan book block ke hardboard cover</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {ENDPAPERS.map((e) => (
                <button
                  key={e.code}
                  onClick={() => setBase({ endpaperCode: e.code })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    base.endpaperCode === e.code ? 'border-brand-700 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                  }`}
                >
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    {e.label}
                    {e.highlight && <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">rekomendasi</span>}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{e.note}{e.price ? ` · ${e.price}` : ''}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Layout ──────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow border p-6">
          <h2 className="font-semibold text-brand-900 mb-4">Tipe Halaman</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setBase({ layout: 'plain' })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                base.layout === 'plain' ? 'border-brand-700 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
              }`}
            >
              <p className="font-semibold text-sm">Polos</p>
              <p className="text-xs text-gray-500 mt-1">Kertas kosong, untuk sketsa atau foto</p>
            </button>
            <button
              onClick={() => setBase({ layout: 'lined' })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                base.layout === 'lined' ? 'border-brand-700 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
              }`}
            >
              <p className="font-semibold text-sm">Bergaris</p>
              <p className="text-xs text-gray-500 mt-1">Garis halus, untuk menulis</p>
            </button>
          </div>
        </section>

        {/* ── Price Preview ─────────────────────────────────────────────── */}
        <div className="bg-brand-50 border border-brand-200 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Estimasi Harga</p>
            <p className="text-3xl font-bold text-brand-900">
              {priceLoading ? (
                <span className="text-gray-400 text-xl animate-pulse">menghitung...</span>
              ) : (
                useConfiguratorStore.getState().estimatedPrice != null
                  ? fmt(useConfiguratorStore.getState().estimatedPrice!)
                  : <span className="text-gray-400 text-xl">—</span>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {base.size} · {base.pages} hal · {PAPERS.find(p => p.code === base.paperCode)?.label} · {BOARDS.find(b => b.code === base.boardCode)?.label}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">Spine preview</p>
            <div className="w-8 h-20 bg-brand-200 rounded border border-brand-400 mx-auto" title="Spine width preview" />
          </div>
        </div>

        {/* ── Navigation ──────────────────────────────────────────────── */}
        <div className="flex gap-4">
          <div className="flex-1" />
          <button onClick={goNext} className="flex-1 py-4 bg-brand-700 text-white rounded-xl font-bold hover:bg-brand-900 transition-colors">
            Desain Cover →
          </button>
        </div>

      </div>
    </div>
  );
}

function usePhaseEffect(phase: 'base') {
  useEffect(() => { useConfiguratorStore.getState().setPhase(phase); }, [phase]);
}
