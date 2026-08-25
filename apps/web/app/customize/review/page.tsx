'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useConfiguratorStore } from '../../../lib/stores/configurator';
import { useToastStore } from '../../../components/ui/Toast';
import type { Scene3DProps } from '@booxury/three';

const Scene3D = dynamic(
  () => import('@booxury/three').then((m) => m.Scene3D),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-[4/3] bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500">Memuat 3D preview...</p>
        </div>
      </div>
    ),
  }
) as React.ComponentType<Scene3DProps>;

const COVER_LABELS: Record<string, string> = {
  doff: 'Laminasi Doff', glossy: 'Laminasi Glossy',
  canvas: 'Kanvas / Linen', leatherette: 'Leatherette',
};
const CORNER_LABELS: Record<string, string> = {
  square: 'Square (Siku)', round: 'Round (Membulat)',
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

export default function ReviewPage() {
  const router = useRouter();
  const { base, finish, setPhase, addToCart, estimatedPrice, designId, coverTextureUrl } = useConfiguratorStore();
  useEffect(() => { setPhase('review'); }, []);

  const [confirmed, setConfirmed] = useState(false);
  const [priceData, setPriceData] = useState<{
    total?: number;
    spine_width_mm?: number;
    breakdown?: Array<{ item: string; amount: number }>;
  } | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceError, setPriceError] = useState<string | null>(null);

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
        if (d.error) setPriceError(d.error.message);
        else setPriceData(d);
      })
      .catch(() => setPriceError('Tidak bisa mengambil harga'))
      .finally(() => setPriceLoading(false));
    return () => controller.abort();
  }, [base, finish]);

  const spineOk = priceData?.spine_width_mm != null && priceData.spine_width_mm > 0;
  const allPass = spineOk && confirmed && !priceError;

  const goBack = () => { setPhase('finish'); router.push('/customize/finish'); };

  const addToast = useToastStore(s => s.add);

  const handleAddToCart = () => {
    if (!allPass) return;
    addToCart({
      designId: designId ?? undefined,
      size: base.size,
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
      ribbonCodes: finish.ribbonCodes ?? [],
      price: priceData?.total ?? estimatedPrice ?? 0,
      spineWidthMm: priceData?.spine_width_mm ?? 12,
    });
    router.push('/checkout/cart');
    addToast('Item ditambahkan ke keranjang!', 'success');
  };

  return (
    <div className="space-y-6">

      {/* 3D Book Preview */}
      <div className="bg-white rounded-2xl shadow border overflow-hidden">
        <div className="px-4 py-2.5 bg-brand-50 border-b border-brand-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-brand-900 tracking-wide uppercase">3D Preview</span>
          </div>
          <span className="text-[10px] text-brand-600 font-medium">
            {base.size} · {base.pages} hal · {COVER_LABELS[finish.coverFinish] ?? finish.coverFinish}
          </span>
        </div>
        <div className="relative" style={{ height: 380 }}>
          <Scene3D
            mode="orbit"
            sizeCode={base.size}
            spineWidthMm={priceData?.spine_width_mm ?? 12}
            coverFinish={finish.coverFinish}
            cornerShape={finish.cornerShape}
            edgeFinish={finish.edgeFinish}
            hasDustJacket={finish.hasDustJacket}
            headbandCode={finish.headbandCode}
            ribbonCodes={finish.ribbonCodes ?? []}
            coverTextureUrl={coverTextureUrl ?? undefined}
            coverOpenAngle={0}
            layout={base.layout}
            paperCode={base.paperCode}
            endpaperCode={base.endpaperCode}
            autoRotate={false}
            autoRotateSpeed={0.3}
            phase="review"
            dpr={[1, 1.5]}
            bloomIntensity={0.2}
          />
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/45 backdrop-blur-sm rounded text-[10px] text-white/90">
            Drag untuk rotasi
          </div>
        </div>
      </div>

      {/* Pre-flight checklist */}
      <div className="bg-white rounded-2xl shadow border p-6">
        <h2 className="font-semibold text-brand-900 mb-4">Pre-Flight Checklist</h2>
        <div className="space-y-2">
          {[
            { id: 'spine', pass: spineOk, label: `Spine ${priceData?.spine_width_mm ?? '—'} mm — dalam rentang valid` },
            { id: 'pages', pass: base.pages >= 80 && base.pages % 4 === 0, label: `${base.pages} halaman — kelipatan 4, min 80` },
            { id: 'cover', pass: true, label: `Cover finish: ${COVER_LABELS[finish.coverFinish] ?? finish.coverFinish}` },
            { id: 'corners', pass: true, label: `Sudut: ${CORNER_LABELS[finish.cornerShape]}` },
            { id: 'edge', pass: finish.edgeFinish !== 'plain', label: `Edge: ${EDGE_LABELS[finish.edgeFinish] ?? finish.edgeFinish}` },
            { id: 'dustjacket', pass: finish.hasDustJacket, label: `Dust jacket: ${finish.hasDustJacket ? 'Ya (+Rp8.000)' : 'Tidak'}` },
            { id: 'headband', pass: true, label: `Headband: ${finish.headbandCode ? finish.headbandCode.replace('hb_', '') : '—'}` },
            { id: 'ribbon', pass: true, label: `Pita: ${(finish.ribbonCodes ?? []).length > 0 ? finish.ribbonCodes!.map(c => c.replace('rb_', '')).join(', ') : '—'}` },
          ].map((c) => (
            <div key={c.id} className="flex items-center gap-2 text-sm">
              <span className={c.pass ? 'text-green-600' : 'text-gray-300'}>{c.pass ? '✓' : '○'}</span>
              <span className={c.pass ? 'text-gray-700' : 'text-gray-400'}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Config summary */}
      <div className="bg-white rounded-2xl shadow border p-6 space-y-2 text-sm">
        <h2 className="font-semibold text-brand-900 mb-3">Konfigurasi Buku</h2>
        {[
          ['Ukuran', base.size],
          ['Halaman', `${base.pages} hal.`],
          ['Kertas', PAPER_LABELS[base.paperCode] ?? base.paperCode],
          ['Greyboard', BOARD_LABELS[base.boardCode] ?? base.boardCode],
          ['Layout', base.layout],
          ['Cover Finish', COVER_LABELS[finish.coverFinish] ?? finish.coverFinish],
          ['Sudut', CORNER_LABELS[finish.cornerShape]],
          ['Edge Finish', EDGE_LABELS[finish.edgeFinish] ?? finish.edgeFinish],
          ['Dust Jacket', finish.hasDustJacket ? 'Ya' : 'Tidak'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}

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

      {/* Color disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
        ⚠️ Warna cetak mungkin berbeda dari tampilan monitor. RGB → CMYK conversion berlaku untuk semua desain.
      </div>

      {/* Confirmation */}
      <label className="flex items-start gap-3 cursor-pointer bg-white rounded-xl border p-4">
        <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
          className="mt-1 accent-brand-700 w-4 h-4 flex-shrink-0" />
        <span className="text-sm text-gray-600">
          Saya sudah periksa semua konfigurasi dan menyetujui bahwa hasil cetak bisa berbeda dari preview layar.
        </span>
      </label>

      {/* CTA */}
      <button
        onClick={handleAddToCart}
        disabled={!allPass}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-colors ${
          allPass ? 'bg-brand-700 text-white hover:bg-brand-900' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {allPass ? 'Tambah ke Keranjang' : 'Centang konfirmasi untuk lanjut'}
      </button>

      <button onClick={goBack}
        className="w-full py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50">
        ← Kembali
      </button>

    </div>
  );
}
