'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useConfiguratorStore } from '@/lib/stores/configurator';
import { Suspense } from 'react';

const CanvasEditor = dynamic(() => import('@/components/configurator/CanvasEditor/index'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border border-gray-200">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-500">Memuat editor...</p>
      </div>
    </div>
  ),
});

function CoverContent() {
  const router = useRouter();
  const { base, setPhase, designPayload, setBase, setDesignPayload, setFinish, setDesignId, reset } = useConfiguratorStore();
  const searchParams = useSearchParams();
  const designIdParam = searchParams.get('design');
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [restoredName, setRestoredName] = useState<string>('');

  // Restore design from ?design=ID
  useEffect(() => { setPhase('cover'); }, []);

  useEffect(() => {
    if (!designIdParam) return;
    setRestoreStatus('loading');
    (async () => {
      try {
        const res = await fetch(`/api/designs/${designIdParam}`);
        if (!res.ok) {
          setRestoreStatus('error');
          return;
        }
        const data = await res.json() as {
          design: {
            id: string;
            name: string;
            baseConfig?: unknown;
            sizePreset?: { code: string };
            paper?: { code: string };
            board?: { code: string };
            endpaperCode?: string;
            layout: 'PLAIN' | 'LINED';
            pages: number;
            designPayload: typeof designPayload;
            finishConfig?: typeof designPayload extends never ? never : object;
            totalPrice: string;
          };
        };
        const d = data.design;

        // Map DB layout (uppercase) back to lowercase
        const layoutLower = (d.layout ?? 'PLAIN').toLowerCase() as 'plain' | 'lined';

        // Reset to default then patch
        reset();
        setBase({
          size: d.sizePreset?.code as typeof base.size ?? 'A5',
          pages: d.pages,
          paperCode: d.paper?.code ?? 'HVS80',
          boardCode: d.board?.code ?? 'BOARD18',
          endpaperCode: d.endpaperCode ?? 'ENDPLAIN',
          layout: layoutLower,
        });
        setDesignPayload(d.designPayload);
        if (d.finishConfig) setFinish(d.finishConfig as Parameters<typeof setFinish>[0]);
        setDesignId(d.id);
        setRestoredName(d.name);
        setRestoreStatus('success');
      } catch {
        setRestoreStatus('error');
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designIdParam]);

  const goNext = () => { setPhase('finish'); router.push('/customize/finish'); };
  const goBack = () => { setPhase('base'); router.push('/customize/base'); };

  const hasContent = (designPayload.front as unknown as Array<{ id: string }>)?.length > 0;

  return (
    <div className="space-y-6">

      {/* Restore banner */}
      {restoreStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-green-900 text-sm">Design dimuat ulang</p>
            <p className="text-xs text-green-700">"{restoredName}" — semua state telah dikembalikan</p>
          </div>
        </div>
      )}
      {restoreStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          ❌ Design tidak ditemukan atau Anda tidak memiliki akses.
        </div>
      )}
      {restoreStatus === 'loading' && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-blue-700">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          Memuat design...
        </div>
      )}

      <div className="bg-white rounded-2xl shadow border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-brand-900">Desain Cover</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{base.size}</span>
        </div>

        <CanvasEditor />

        {hasContent && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Cover sudah memiliki elemen desain
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={goBack}
          className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 font-medium">
          ← Kembali
        </button>
        <button onClick={goNext}
          className="flex-1 py-3 bg-brand-700 text-white rounded-xl font-bold hover:bg-brand-900">
          Lanjut →
        </button>
      </div>

    </div>
  );
}

export default function CoverPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <CoverContent />
    </Suspense>
  );
}