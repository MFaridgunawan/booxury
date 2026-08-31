'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConfiguratorStore } from '@/lib/stores/configurator';
import { PAPER_CATEGORIES } from '@booxury/design-types';
import { SpinePreview } from '@/components/configurator/SpinePreview';
import { COVER_COLORS, COVER_FINISHES } from '@/lib/cover-foundation';

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
  { code: 'ENDPLAIN', label: 'Krem Novel (Ivory)',    color: '#eee5cf', note: 'Standar novel — hangat & klasik', highlight: true },
  { code: 'ENDFLAT',  label: 'Putih Bersih (HVS)',    color: '#ffffff', note: 'Minimalis & modern' },
  { code: 'ENDKRAFT', label: 'Kraft Coklat',          color: '#b88d57', note: 'Artisan brown — serat natural' },
  { code: 'ENDHITAM', label: 'Hitam Elegan',          color: '#1a1a1a', note: 'Eksklusif — cocok kover gelap' },
  { code: 'ENDABU',   label: 'Abu-Abu Doff',          color: '#555b6e', note: 'Kesan kontemporer & elegan' },
  { code: 'ENDPAT',   label: 'Motif Marmer Klasik',   color: '#dacdaf', note: 'Artistik buku kuno', price: '+Rp5.000' },
];

const snapPages = (n: number) => Math.max(80, Math.round(n / 4) * 4);
const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function BasePage() {
  const router = useRouter();
  const { base, setBase, finish, setFinish, setPhase, setEstimatedPrice, spineWidthMm, estimatedPrice } = useConfiguratorStore();
  useEffect(() => { setPhase('base'); }, []);

  const [priceLoading, setPriceLoading] = useState(false);
  const [pagesInput, setPagesInput] = useState(String(base.pages));

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

  useEffect(() => {
    const timer = setTimeout(async () => {
      setPriceLoading(true);
      try {
        const res = await fetch('/api/price-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sizeCode: base.size,
            pages: base.pages,
            paperCode: base.paperCode,
            boardCode: base.boardCode,
            endpaperCode: base.endpaperCode,
            layout: base.layout,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setEstimatedPrice(data.total);
        }
      } catch { /* price unavailable */ }
      finally { setPriceLoading(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [base.size, base.pages, base.paperCode, base.boardCode, base.endpaperCode]);

  const goNext = () => { setPhase('cover'); router.push('/customize/cover'); };

  return (
    <div className="space-y-8">

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

      <section className="bg-white rounded-2xl shadow border p-6">
        <h2 className="font-semibold text-brand-900">Fondasi Kover</h2>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">Tentukan warna dan pelapis fisik sebelum membuat artwork. Desain kover akan menjadi lapisan transparan di atas fondasi ini, sehingga warna tetap bisa diperbarui tanpa mengubah desain.</p>
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {COVER_COLORS.map((color) => {
            const isSelected = finish.coverColor.toLowerCase() === color.code.toLowerCase();
            return (
              <button
                key={color.code}
                type="button"
                onClick={() => setFinish({ coverColor: color.code })}
                className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${isSelected ? 'border-brand-700 bg-brand-50 ring-1 ring-brand-700' : 'border-gray-200 hover:border-brand-300'}`}
              >
                <span className="h-7 w-7 shrink-0 rounded-full border border-black/15 shadow-inner" style={{ backgroundColor: color.code }} />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-gray-900">{color.name}</span>
                  <span className="block truncate text-[10px] text-gray-500">{color.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {COVER_FINISHES.map((coating) => (
            <button
              key={coating.code}
              type="button"
              onClick={() => setFinish({ coverFinish: coating.code })}
              className={`rounded-xl border-2 p-3 text-left transition-all ${finish.coverFinish === coating.code ? 'border-brand-700 bg-brand-50 shadow-sm' : 'border-gray-200 hover:border-brand-300'}`}
            >
              <span className="block text-sm font-semibold text-gray-900">{coating.name}</span>
              <span className="mt-0.5 block text-xs text-gray-500">{coating.desc}{'price' in coating && coating.price ? ` · ${coating.price}` : ''}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow border p-6">
        <h2 className="font-semibold text-brand-900 mb-4">Isi Buku</h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jumlah Halaman <span className="text-gray-400 font-normal">(kelipatan 4, min 80)</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number" min={80} max={400} step={4}
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
        </div>

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
                      <button key={p.code} onClick={() => setBase({ paperCode: p.code })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          base.paperCode === p.code ? 'border-brand-700 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
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

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Greyboard (Keras Kover)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BOARDS.map((b) => (
              <button key={b.code} onClick={() => setBase({ boardCode: b.code })}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Endsheet / Endpaper (Kertas Pembatas Dalam)</label>
          <p className="text-xs text-gray-400 mb-3">Kertas pembatas yang merekatkan book block ke cover (terlihat saat buku dibuka)</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {ENDPAPERS.map((e) => (
              <button key={e.code} onClick={() => setBase({ endpaperCode: e.code })}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                  base.endpaperCode === e.code ? 'border-brand-700 bg-brand-50 ring-1 ring-brand-700' : 'border-gray-200 hover:border-brand-300'
                }`}
              >
                <span className="w-5 h-5 rounded-full border border-black/15 flex-shrink-0 mt-0.5 shadow-sm" style={{ backgroundColor: e.color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold flex items-center gap-1">
                    {e.label}
                    {e.highlight && <span className="text-[9px] bg-brand-100 text-brand-700 px-1 py-0.2 rounded font-bold">Favorit</span>}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{e.note}{e.price ? ` · ${e.price}` : ''}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow border p-6">
        <h2 className="font-semibold text-brand-900 mb-4">Tipe Halaman</h2>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setBase({ layout: 'plain' })}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              base.layout === 'plain' ? 'border-brand-700 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
            }`}
          >
            <p className="font-semibold text-sm">Polos</p>
            <p className="text-xs text-gray-500 mt-1">Kertas kosong, untuk sketsa atau foto</p>
          </button>
          <button onClick={() => setBase({ layout: 'lined' })}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              base.layout === 'lined' ? 'border-brand-700 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
            }`}
          >
            <p className="font-semibold text-sm">Bergaris</p>
            <p className="text-xs text-gray-500 mt-1">Garis halus, untuk menulis</p>
          </button>
        </div>
      </section>

      <div className="bg-brand-50 border border-brand-200 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Estimasi Harga Base</p>
          <p className="text-3xl font-bold text-brand-900 mt-0.5">
            {priceLoading
              ? <span className="text-gray-400 text-xl animate-pulse">menghitung...</span>
              : estimatedPrice != null
                ? fmt(estimatedPrice)
                : <span className="text-gray-400 text-xl">—</span>
            }
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {base.size} · {base.pages} hal · {PAPERS.find(p => p.code === base.paperCode)?.label}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Tebal Spine</p>
          <p className="text-2xl font-bold text-brand-800 mt-0.5">
            {spineWidthMm.toFixed(1)} mm
          </p>
          <p className="text-[11px] text-brand-600">Terupdate di 3D preview</p>
        </div>
      </div>

      {/* Technical Spine Blueprint (Collapsible / Accordion) */}
      <details className="bg-white rounded-2xl border border-gray-200 p-5 group shadow-sm">
        <summary className="font-semibold text-sm text-brand-900 cursor-pointer flex items-center justify-between select-none">
          <span>Lihat Blueprint &amp; Spesifikasi Lembar Kover</span>
          <span className="text-xs text-brand-700 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <SpinePreview
            sizeCode={base.size}
            pages={base.pages}
            paperCode={base.paperCode}
            boardCode={base.boardCode}
            endpaperCode={base.endpaperCode}
          />
        </div>
      </details>

      <div className="flex gap-4 pt-2">
        <div className="flex-1" />
        <button
          onClick={goNext}
          className="w-full sm:w-auto px-8 py-4 bg-brand-700 text-white rounded-xl font-bold hover:bg-brand-900 shadow-md hover:shadow-lg transition-all text-base flex items-center justify-center gap-2"
        >
          <span>Lanjut ke Desain Kover</span>
          <span className="text-lg">→</span>
        </button>
      </div>

    </div>
  );
}
