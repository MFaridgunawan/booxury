'use client';
import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useConfiguratorStore } from '@/lib/stores/configurator';
import type { Scene3DProps } from '@booxury/three';

// Lazy-load the heavy Scene3D
const Scene3D = dynamic(
  () => import('@booxury/three').then((m) => m.Scene3D),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full h-full animate-pulse bg-brand-100 rounded-2xl"
        style={{ minHeight: 300 }}
      />
    ),
  }
) as React.ComponentType<Scene3DProps>;

interface WizardCanvasProps {
  phase?: string;
  mode?: 'orbit' | 'cinematic';
  className?: string;
}

export function WizardCanvas({ phase = 'base', mode = 'orbit', className = '' }: WizardCanvasProps) {
  const { base, finish, coverTextureUrl, spineWidthMm } = useConfiguratorStore();

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-brand-50 to-amber-50 ${className}`}
      style={{ minHeight: 320 }}
    >
      <Scene3D
        mode={mode}
        sizeCode={base.size}
        spineWidthMm={spineWidthMm}
        coverFinish={finish.coverFinish}
        coverColor={finish.coverColor}
        cornerShape={finish.cornerShape}
        edgeFinish={finish.edgeFinish}
        hasDustJacket={finish.hasDustJacket}
        headbandCode={finish.headbandCode}
        ribbonCodes={finish.ribbonCodes ?? []}
        coverTextureUrl={coverTextureUrl ?? undefined}
        layout={base.layout}
        paperCode={base.paperCode}
        endpaperCode={base.endpaperCode}
        phase={phase}
        dpr={[1, 1.5]}
      />

      {/* Phase label overlay */}
      <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-lg text-xs font-medium text-brand-900 shadow-sm">
        {phase === 'base' && 'Ukuran & Isi'}
        {phase === 'cover' && 'Desain Kover'}
        {phase === 'finish' && 'Material & Finish'}
        {phase === 'review' && 'Review'}
      </div>

      {/* Drag hint */}
      <div className="absolute bottom-3 right-3 px-2 py-1 bg-white/60 backdrop-blur-sm rounded text-[10px] text-gray-400">
        Drag to rotate
      </div>
    </div>
  );
}
