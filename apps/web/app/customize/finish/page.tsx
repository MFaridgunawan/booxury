'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConfiguratorStore } from '../../lib/stores/configurator';

export default function FinishPage() {
  const router = useRouter();
  const { finish, setFinish, base, setPhase } = useConfiguratorStore();
  usePhaseEffect('finish');

  const goNext = () => { setPhase('review'); router.push('/customize/review'); };
  const goBack = () => { setPhase('cover'); router.push('/customize/cover'); };

  const addAccessory = (type: 'STRAP' | 'RIBBON') => {
    if (finish.accessories?.some(a => a.type === type)) return;
    setFinish({ accessories: [...(finish.accessories ?? []), { code: `${type.toLowerCase()}_default`, type }] });
  };
  const removeAccessory = (type: 'STRAP' | 'RIBBON') => {
    setFinish({ accessories: finish.accessories?.filter(a => a.type !== type) ?? [] });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-serif font-bold text-brand-900 mb-2">Material & Aksesoris</h1>
      <p className="text-gray-500 mb-8">Step 3 dari 4 — Pilih finish kover dan tambahan.</p>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Cover Finish */}
          <div className="bg-white rounded-2xl shadow border p-6">
            <h2 className="font-semibold text-brand-900 mb-4">Pelapis Kover</h2>
            <div className="grid grid-cols-1 gap-3">
              {[
                { code: 'doff', name: 'Laminasi Doff', desc: 'Tampilan matte, elegan' },
                { code: 'glossy', name: 'Laminasi Glossy', desc: 'Tampilan mengkilap' },
                { code: 'canvas', name: 'Kanvas', desc: 'Tekstur kain premium (+Rp15.000)' },
              ].map((f) => (
                <button
                  key={f.code}
                  onClick={() => setFinish({ coverFinish: f.code as 'doff' | 'glossy' | 'canvas' })}
                  className={`p-4 rounded-xl border-2 text-left transition-colors ${
                    finish.coverFinish === f.code ? 'border-brand-700 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                  }`}
                >
                  <p className="font-semibold">{f.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Accessories */}
          <div className="bg-white rounded-2xl shadow border p-6">
            <h2 className="font-semibold text-brand-900 mb-4">Aksesoris Tambahan</h2>
            <div className="space-y-4">
              {/* Strap */}
              <div className="flex items-center justify-between p-4 border rounded-xl">
                <div>
                  <p className="font-medium">Tali Pengikat</p>
                  <p className="text-sm text-gray-500">+Rp5.000</p>
                </div>
                <button
                  onClick={() => finish.accessories?.some(a => a.type === 'STRAP') ? removeAccessory('STRAP') : addAccessory('STRAP')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    finish.accessories?.some(a => a.type === 'STRAP')
                      ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-brand-100'
                  }`}
                >
                  {finish.accessories?.some(a => a.type === 'STRAP') ? '✓ Aktif' : '+ Tambah'}
                </button>
              </div>

              {/* Ribbon */}
              <div className="flex items-center justify-between p-4 border rounded-xl">
                <div>
                  <p className="font-medium">Pita Hias</p>
                  <p className="text-sm text-gray-500">+Rp3.000</p>
                </div>
                <button
                  onClick={() => finish.accessories?.some(a => a.type === 'RIBBON') ? removeAccessory('RIBBON') : addAccessory('RIBBON')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    finish.accessories?.some(a => a.type === 'RIBBON')
                      ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-brand-100'
                  }`}
                >
                  {finish.accessories?.some(a => a.type === 'RIBBON') ? '✓ Aktif' : '+ Tambah'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={goBack} className="flex-1 py-4 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50">← Kembali</button>
          <button onClick={goNext} className="flex-1 py-4 bg-brand-700 text-white rounded-xl font-bold hover:bg-brand-900">Review & Checkout →</button>
        </div>
      </div>
    </div>
  );
}

function usePhaseEffect(phase: 'finish') {
  useEffect(() => { useConfiguratorStore.getState().setPhase(phase); }, [phase]);
}
