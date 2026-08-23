'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConfiguratorStore } from '../../../lib/stores/configurator';
import { useQuery } from '@tanstack/react-query';

export default function CoverPage() {
  const router = useRouter();
  const { base, designPayload, setDesignPayload, setPhase } = useConfiguratorStore();
  usePhaseEffect('cover');

  const { data: finishes } = useQuery({
    queryKey: ['cover-finishes'],
    queryFn: () => fetch('/api/cover-finishes').then(r => r.json()),
  });

  const goNext = () => {
    setPhase('finish');
    router.push('/customize/finish');
  };
  const goBack = () => { setPhase('base'); router.push('/customize/base'); };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-serif font-bold text-brand-900 mb-2">Desain Kover</h1>
      <p className="text-gray-500 mb-8">Step 2 dari 4 — Upload gambar, tambah teks, dan efek foil/emboss.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 3-panel preview */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow border p-6">
          <div className="flex gap-2 items-center justify-center">
            {/* Back */}
            <div className="border rounded-lg w-24 h-36 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
              Back
            </div>
            {/* Spine */}
            <div
              className="border rounded-lg bg-amber-100 flex items-center justify-center text-xs text-amber-600 font-bold"
              style={{ width: 16, height: 36, minWidth: 10 }}
            >
              Spine
            </div>
            {/* Front */}
            <div className="border-2 border-dashed rounded-lg w-24 h-36 bg-gray-50 flex flex-col items-center justify-center text-gray-400 text-xs text-center p-2">
              <p>Upload / Drag & Drop</p>
              <p className="mt-1">Front Cover</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4 justify-center">
            <button className="px-4 py-2 bg-brand-100 text-brand-700 rounded-lg text-sm font-medium">+ Teks</button>
            <button className="px-4 py-2 bg-brand-100 text-brand-700 rounded-lg text-sm font-medium">+ Gambar</button>
            <button className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">Embas/Emboss</button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">Konva Editor — implemented di Hari 3-4</p>
        </div>

        {/* Tool panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">Konfigurasi</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between"><span>Ukuran</span><span className="font-medium">{base.size}</span></div>
              <div className="flex justify-between"><span>Halaman</span><span className="font-medium">{base.pages}</span></div>
              <div className="flex justify-between"><span>Kertas</span><span className="font-medium">{base.paper}</span></div>
              <div className="flex justify-between"><span>Board</span><span className="font-medium">{base.board}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">Cover Finish</h3>
            <div className="space-y-2">
              {finishes?.finishes?.map((f: { code: string; name: string; priceModifier: number }) => (
                <label key={f.code} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="finish" value={f.code} className="accent-brand-700" />
                  <span className="text-sm">{f.name}</span>
                  {f.priceModifier > 0 && <span className="text-xs text-brand-600 ml-auto">+Rp{f.priceModifier.toLocaleString()}</span>}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={goBack} className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50">← Kembali</button>
            <button onClick={goNext} className="flex-1 py-3 bg-brand-700 text-white rounded-xl font-bold hover:bg-brand-900">Lanjut →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function usePhaseEffect(phase: 'cover') {
  useEffect(() => { useConfiguratorStore.getState().setPhase(phase); }, [phase]);
}
