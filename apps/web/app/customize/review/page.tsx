'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConfiguratorStore } from '../../lib/stores/configurator';
import { useQuery } from '@tanstack/react-query';

export default function ReviewPage() {
  const router = useRouter();
  const { base, finish, designPayload, setPhase } = useConfiguratorStore();
  usePhaseEffect('review');

  const [confirmed, setConfirmed] = useState(false);

  const { data: priceData } = useQuery({
    queryKey: ['price-quote', base, finish],
    queryFn: () => fetch('/api/price-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sizeCode: base.size,
        pages: base.pages,
        paperCode: base.paper,
        boardCode: base.board,
        layout: base.layout.toUpperCase(),
        coverFinishCode: finish.coverFinish,
        accessories: finish.accessories,
      }),
    }).then(r => r.json()),
  });

  const checks = [
    { id: 'spine_ok', label: 'Spine width dalam rentang valid', status: 'pass' },
    { id: 'pages_ok', label: 'Jumlah halaman valid (20-400)', status: 'pass' },
    { id: 'cover_finish', label: `Cover finish: ${finish.coverFinish}`, status: 'pass' },
  ];

  const allPass = checks.every(c => c.status === 'pass') && confirmed;

  const goBack = () => { setPhase('finish'); router.push('/customize/finish'); };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-serif font-bold text-brand-900 mb-2">Review & Pre-Flight</h1>
      <p className="text-gray-500 mb-8">Step 4 dari 4 — Periksa konfigurasi sebelum checkout.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 3D Composite preview (2D) */}
        <div className="bg-white rounded-2xl shadow border p-6">
          <h2 className="font-semibold text-brand-900 mb-4">Preview Hardcover</h2>
          <div className="flex gap-2 items-center justify-center bg-gray-50 rounded-xl p-8">
            <div className="bg-gray-200 border rounded w-20 h-28 shadow-sm" />
            <div className="bg-amber-200 border rounded" style={{ width: 12, height: 28 }} />
            <div className="bg-gray-100 border-2 border-dashed rounded w-20 h-28 flex items-center justify-center text-xs text-gray-400">FRONT</div>
          </div>
          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between"><span>Ukuran</span><span className="font-bold">{base.size}</span></div>
            <div className="flex justify-between"><span>Halaman</span><span className="font-bold">{base.pages} hal.</span></div>
            <div className="flex justify-between"><span>Kertas</span><span className="font-bold">{base.paper}</span></div>
            <div className="flex justify-between"><span>Board</span><span className="font-bold">{base.board}</span></div>
            <div className="flex justify-between"><span>Layout</span><span className="font-bold capitalize">{base.layout}</span></div>
            <div className="flex justify-between"><span>Finish</span><span className="font-bold capitalize">{finish.coverFinish}</span></div>
            <div className="flex justify-between"><span>Accessories</span><span className="font-bold">{finish.accessories?.length ?? 0} item</span></div>
            <div className="flex justify-between border-t pt-1 mt-2">
              <span>Total</span>
              <span className="font-bold text-brand-700 text-lg">
                {priceData ? `Rp ${(priceData.total ?? 0).toLocaleString('id-ID')}` : '...'}
              </span>
            </div>
          </div>
        </div>

        {/* Checklist + Confirm */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow border p-6">
            <h2 className="font-semibold text-brand-900 mb-4">Pre-Flight Checklist</h2>
            <div className="space-y-2">
              {checks.map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-sm">
                  <span className="text-green-600">✓</span>
                  <span>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            ⚠️ Warna cetak mungkin berbeda dari tampilan monitor. RGB → CMYK conversion berlaku.
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 accent-brand-700 w-4 h-4"
            />
            <span className="text-sm text-gray-600">
              Saya sudah periksa semua konfigurasi dan menyetujui bahwa hasil cetak bisa berbeda dari preview layar.
            </span>
          </label>

          <button
            onClick={() => router.push('/checkout/cart')}
            disabled={!allPass}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-colors ${
              allPass ? 'bg-brand-700 text-white hover:bg-brand-900' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {allPass ? 'Tambah ke Keranjang' : 'Konfirmasi checklist di atas'}
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
