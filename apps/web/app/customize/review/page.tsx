'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConfiguratorStore } from '../../lib/stores/configurator';

const COVER_LABELS: Record<string, string> = {
  doff: 'Laminasi Doff', glossy: 'Laminasi Glossy',
  canvas: 'Kanvas / Linen', leatherette: 'Leatherette',
};
const CORNER_LABELS: Record<string, string> = {
  square: 'Square (Bulat)', round: 'Round (Tajam)',
};
const EDGE_LABELS: Record<string, string> = {
  plain: 'Plain', gilded_gold: 'Gilded (Emas)', gilded_silver: 'Gilded (Perak)',
  sprayed_red: 'Sprayed (Merah)', sprayed_blue: 'Sprayed (Biru)', stenciled: 'Stenciled',
};
const PAPER_LABELS: Record<string, string> = {
  BOOK57: 'Bookpaper 57gsm', BOOK72: 'Bookpaper 72gsm', BOOK90: 'Bookpaper 90gsm',
  HVS70: 'HVS 70gsm', HVS80: 'HVS 80gsm', HVS100: 'HVS 100gsm',
  ART120: 'Art Paper 120gsm', ART150: 'Art Paper 150gsm',
  MATT120: 'Matt Paper 120gsm', MATT150: 'Matt Paper 150gsm',
};
const BOARD_LABELS: Record<string, string> = {
  BOARD14: 'Greyboard 1.4mm', BOARD18: 'Greyboard 1.8mm',
  BOARD20: 'Greyboard 2.0mm', BOARD25: 'Greyboard 2.5mm',
};
const ENDPAPER_LABELS: Record<string, string> = {
  ENDFLAT: 'Endpaper 120gsm', ENDPLAIN: 'Endpaper 150gsm', ENDPAT: 'Endpaper 180gsm + Motif',
};

export default function ReviewPage() {
  const router = useRouter();
  const { base, finish, setPhase } = useConfiguratorStore();
  usePhaseEffect('review');

  const [confirmed, setConfirmed] = useState(false);
  const [priceData, setPriceData] = useState<{ total?: number; spine_width_mm?: number; breakdown?: Array<{ item: string; amount: number }> } | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Fetch price
  useEffect(() => {
    const controller = new AbortController();
    setPriceLoading(true);
    setPriceError(null);
    fetch('/api/price-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        sizeCode: base.size,
        pages: base.pages,
        paperCode: base.paperCode,
        boardCode: base.boardCode,
        endpaperCode: base.endpaperCode,
        layout: base.layout,
        coverFinish: finish.coverFinish,
        cornerShape: finish.cornerShape,
        edgeFinish: finish.edgeFinish,
        hasDustJacket: finish.hasDustJacket,
        headbandCode: finish.headbandCode,
        ribbonCodes: finish.ribbonCodes,
        accessories: finish.accessories,
      }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setPriceError(d.error.message); }
        else { setPriceData(d); }
      })
      .catch(() => setPriceError('Tidak bisa mengambil harga'))
      .finally(() => setPriceLoading(false));
    return () => controller.abort();
  }, [base, finish]);

  const spineOk = priceData?.spine_width_mm != null && priceData.spine_width_mm > 0;
  const allPass = spineOk && confirmed && !priceError;

  const goBack = () => { setPhase('finish'); router.push('/customize/finish'); };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-serif font-bold text-brand-900 mb-2">Review &amp; Pre-Flight</h1>
      <p className="text-gray-500 mb-8">Step 4 dari 4 — Periksa semua konfigurasi sebelum checkout.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── 2D Hardcover Preview ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow border p-6">
          <h2 className="font-semibold text-brand-900 mb-4">Preview Hardcover</h2>
          {/* Flat 2D illustration: back | spine | front */}
          <div className="flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50 rounded-xl p-8 mb-4">
            <div className="relative flex items-center">
              {/* Back cover */}
              <div className="bg-amber-900 border-2 border-amber-800 rounded-l-sm w-16 h-24 shadow-md flex items-center justify-center text-amber-200 text-xs text-center px-1">
                BACK
              </div>
              {/* Spine */}
              <div
                className="bg-amber-700 border-y-2 border-amber-800 flex flex-col items-center justify-center text-amber-100 text-xs"
                style={{ width: Math.max(8, Math.min(24, (priceData?.spine_width_mm ?? 10) * 1.5)), height: 96 }}
              >
                <span className="rotate-90 whitespace-nowrap text-center text-[9px]">SPINE</span>
              </div>
              {/* Front cover */}
              <div className="bg-amber-100 border-2 border-amber-700 rounded-r-sm w-16 h-24 shadow-md flex items-center justify-center text-amber-700 text-xs">
                FRONT
              </div>
            </div>
          </div>

          {/* Configuration summary */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Ukuran</span>
              <span className="font-bold">{base.size}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Halaman</span>
              <span className="font-bold">{base.pages} hal. <span className="text-gray-400 text-xs">(signature binding)</span></span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Kertas Isi</span>
              <span className="font-bold">{PAPER_LABELS[base.paperCode] ?? base.paperCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Greyboard</span>
              <span className="font-bold">{BOARD_LABELS[base.boardCode] ?? base.boardCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Endpaper</span>
              <span className="font-bold">{ENDPAPER_LABELS[base.endpaperCode] ?? base.endpaperCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Layout</span>
              <span className="font-bold capitalize">{base.layout}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Cover Finish</span>
              <span className="font-bold">{COVER_LABELS[finish.coverFinish] ?? finish.coverFinish}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Bentuk Sudut</span>
              <span className="font-bold">{CORNER_LABELS[finish.cornerShape] ?? finish.cornerShape}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Edge Finish</span>
              <span className="font-bold">{EDGE_LABELS[finish.edgeFinish] ?? finish.edgeFinish}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Dust Jacket</span>
              <span className="font-bold">{finish.hasDustJacket ? 'Ya (+Rp8.000)' : 'Tidak'}</span>
            </div>
            {finish.headbandCode && (
              <div className="flex justify-between">
                <span className="text-gray-500">Headband</span>
                <span className="font-bold capitalize">{finish.headbandCode.replace('hb_', '')}</span>
              </div>
            )}
            {(finish.ribbonCodes ?? []).length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Pita Marker</span>
                <span className="font-bold">{finish.ribbonCodes!.map(c => c.replace('rb_', '')).join(', ')}</span>
              </div>
            )}

            {/* Price breakdown */}
            {priceLoading ? (
              <div className="text-center py-3 text-gray-400 text-sm animate-pulse">Menghitung harga...</div>
            ) : priceError ? (
              <div className="text-center py-3 text-red-400 text-xs">{priceError}</div>
            ) : (
              <>
                <div className="border-t pt-2 mt-1" />
                {(priceData?.breakdown ?? []).map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-400">{item.item}</span>
                    <span className={item.amount < 0 ? 'text-green-600' : 'text-gray-700'}>
                      {item.amount < 0 ? '-' : ''}Rp {Math.abs(item.amount).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-2 mt-1">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-brand-700 text-lg">
                    Rp {(priceData?.total ?? 0).toLocaleString('id-ID')}
                  </span>
                </div>
                {spineOk && (
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Lebar spine</span>
                    <span>{priceData?.spine_width_mm} mm</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Checklist + Actions ──────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Pre-flight checks */}
          <div className="bg-white rounded-2xl shadow border p-6">
            <h2 className="font-semibold text-brand-900 mb-4">Pre-Flight Checklist</h2>
            <div className="space-y-2">
              {[
                { id: 'spine', pass: spineOk, label: `Spine ${priceData?.spine_width_mm ?? '—'} mm — dalam rentang valid` },
                { id: 'pages', pass: base.pages >= 80 && base.pages % 4 === 0, label: `${base.pages} halaman — kelipatan 4, min 80` },
                { id: 'cover', pass: true, label: `Cover finish: ${COVER_LABELS[finish.coverFinish]}` },
                { id: 'corners', pass: true, label: `Sudut: ${CORNER_LABELS[finish.cornerShape]}` },
                { id: 'edge', pass: finish.edgeFinish !== 'plain', label: `Edge: ${EDGE_LABELS[finish.edgeFinish]}` },
                { id: 'dustjacket', pass: finish.hasDustJacket, label: `Dust jacket: ${finish.hasDustJacket ? 'Ya' : 'Tidak'}` },
                { id: 'headband', pass: true, label: `Headband: ${finish.headbandCode ? finish.headbandCode.replace('hb_', '') : '—'}` },
                { id: 'ribbon', pass: true, label: `Pita: ${(finish.ribbonCodes ?? []).length > 0 ? finish.ribbonCodes!.map(c => c.replace('rb_', '')).join(', ') : '—'}` },
              ].map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-sm">
                  <span className={c.pass ? 'text-green-600' : 'text-gray-300'}>
                    {c.pass ? '✓' : '○'}
                  </span>
                  <span className={c.pass ? 'text-gray-700' : 'text-gray-400'}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Color disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            ⚠️ Warna cetak mungkin berbeda dari tampilan monitor. RGB → CMYK conversion berlaku untuk semua desain.
          </div>

          {/* Confirmation */}
          <label className="flex items-start gap-3 cursor-pointer bg-white rounded-xl border p-4">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 accent-brand-700 w-4 h-4 flex-shrink-0"
            />
            <span className="text-sm text-gray-600">
              Saya sudah periksa semua konfigurasi dan menyetujui bahwa hasil cetak bisa berbeda dari preview layar.
            </span>
          </label>

          {/* CTA */}
          <button
            onClick={() => router.push('/checkout/cart')}
            disabled={!allPass}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-colors ${
              allPass ? 'bg-brand-700 text-white hover:bg-brand-900' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {allPass ? 'Tambah ke Keranjang' : 'Centang konfirmasi untuk lanjut'}
          </button>

          <button onClick={goBack} className="w-full py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50">
            ← Kembali
          </button>
        </div>
      </div>
    </div>
  );
}

function usePhaseEffect(phase: 'review') {
  useEffect(() => { useConfiguratorStore.getState().setPhase(phase); }, [phase]);
}
