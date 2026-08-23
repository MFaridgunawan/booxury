'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useConfiguratorStore } from '../../lib/stores/configurator';
import { calculateSpine } from '@booxury/spine-calc';
import { useQuery } from '@tanstack/react-query';

const PAPER_CALIPER: Record<string, number> = {
  HVS80: 0.105, HVS100: 0.130, BOOK70: 0.082, BOOK80: 0.095,
};
const BOARD_THICKNESS: Record<string, number> = {
  BOARD15: 1.5, BOARD20: 2.0, BOARD25: 2.5, BOARD30: 3.0,
};
const SIZE_DIMS: Record<string, { widthMm: number; heightMm: number }> = {
  A5: { widthMm: 148, heightMm: 210 },
  B5: { widthMm: 176, heightMm: 250 },
  A6: { widthMm: 105, heightMm: 148 },
};

export default function BasePage() {
  const router = useRouter();
  const { base, setBase, setPhase } = useConfiguratorStore();
  usePhaseEffect('base');

  const { data: sizes } = useQuery({ queryKey: ['sizes'], queryFn: () => fetch('/api/sizes').then(r => r.json()) });

  const spinePreview = calculateSpine({
    pages: base.pages,
    paperCaliperMm: PAPER_CALIPER[base.paper] ?? 0.105,
    boardThicknessMm: BOARD_THICKNESS[base.board] ?? 2.0,
    endpaperThicknessMm: 0.12,
    hingeAllowanceMm: 2.0,
  }, SIZE_DIMS[base.size]);

  const goNext = () => {
    setPhase('cover');
    router.push('/customize/cover');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-serif font-bold text-brand-900 mb-2">Pilih Konfigurasi Dasar</h1>
      <p className="text-gray-500 mb-8">Step 1 dari 4 — Ukuran, jumlah halaman, kertas, dan layout.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-6">
          {/* Size */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ukuran</label>
            <div className="grid grid-cols-3 gap-2">
              {['A5', 'B5', 'A6'].map((s) => {
                const dims = SIZE_DIMS[s];
                return (
                  <button
                    key={s}
                    onClick={() => setBase({ size: s as 'A5' | 'B5' | 'A6' })}
                    className={`p-3 rounded-xl border-2 text-center transition-colors ${
                      base.size === s ? 'border-brand-700 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                    }`}
                  >
                    <p className="font-bold text-brand-900">{s}</p>
                    <p className="text-xs text-gray-500 mt-1">{dims.widthMm}×{dims.heightMm}mm</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pages */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Jumlah Halaman: <span className="text-brand-700">{base.pages}</span>
            </label>
            <input
              type="range" min="20" max="400" step="10"
              value={base.pages}
              onChange={(e) => setBase({ pages: Number(e.target.value) })}
              className="w-full accent-brand-700"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>20 hal</span><span>400 hal</span>
            </div>
          </div>

          {/* Paper */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Kertas Isi</label>
            <select
              value={base.paper}
              onChange={(e) => setBase({ paper: e.target.value })}
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="HVS80">HVS 80 gsm (+Rp500/lembar)</option>
              <option value="HVS100">HVS 100 gsm (+Rp700/lembar)</option>
              <option value="BOOK70">Bookpaper 70 gsm (+Rp600/lembar)</option>
              <option value="BOOK80">Bookpaper 80 gsm (+Rp800/lembar)</option>
            </select>
          </div>

          {/* Board */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tebal Kover</label>
            <select
              value={base.board}
              onChange={(e) => setBase({ board: e.target.value })}
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="BOARD15">Greyboard 1.5mm (tipis)</option>
              <option value="BOARD20">Greyboard 2.0mm (standar)</option>
              <option value="BOARD25">Greyboard 2.5mm (tebal)</option>
              <option value="BOARD30">Greyboard 3.0mm (premium)</option>
            </select>
          </div>

          {/* Layout */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Layout Halaman</label>
            <div className="grid grid-cols-2 gap-2">
              {(['plain', 'lined'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setBase({ layout: l })}
                  className={`p-3 rounded-xl border-2 text-center transition-colors capitalize ${
                    base.layout === l ? 'border-brand-700 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={goNext}
            className="w-full py-4 bg-brand-700 text-white font-bold rounded-xl hover:bg-brand-900 transition-colors text-lg"
          >
            Lanjut ke Desain Kover →
          </button>
        </div>

        {/* Spine Preview */}
        <div className="bg-white rounded-2xl shadow-lg border p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 text-center">Preview Hardcover</h2>
          <div className="flex items-center justify-center gap-1">
            {/* Back panel */}
            <div
              className="bg-gray-100 border rounded-sm"
              style={{ width: 40, height: 56 }}
            />
            {/* Spine */}
            <div
              className="bg-amber-100 border rounded-sm flex items-center justify-center text-xs text-amber-700 font-bold"
              style={{
                width: Math.max(6, spinePreview.spineWidthMm * 1.5),
                height: 56,
                minWidth: 6,
              }}
            >
              {spinePreview.spineWidthMm.toFixed(1)}mm
            </div>
            {/* Front panel */}
            <div
              className="bg-gray-100 border rounded-sm"
              style={{ width: 40, height: 56 }}
            />
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between"><span>Ukuran</span><span className="font-semibold">{base.size}</span></div>
            <div className="flex justify-between"><span>Halaman</span><span className="font-semibold">{base.pages} hal.</span></div>
            <div className="flex justify-between"><span>Kertas</span><span className="font-semibold">{base.paper}</span></div>
            <div className="flex justify-between"><span>Board</span><span className="font-semibold">{base.board}</span></div>
            <div className="flex justify-between border-t pt-1 mt-1"><span>Lebar Spine</span><span className="font-bold text-brand-700">{spinePreview.spineWidthMm.toFixed(2)} mm</span></div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700">
            ℹ️ Spine preview adalah estimasi. Hasil aktual bisa berbeda ±0.5mm.
          </div>
        </div>
      </div>
    </div>
  );
}

function usePhaseEffect(phase: 'base') {
  useEffect(() => { useConfiguratorStore.getState().setPhase(phase); }, [phase]);
}
