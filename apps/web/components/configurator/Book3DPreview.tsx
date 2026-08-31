'use client';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';

// Lazy-load the 3D scene to avoid SSR — R3F can't render server-side
const Book3DScene = dynamic(() => import('@booxury/three').then(m => m.Scene3D), {
  ssr: false,
  loading: () => (
    <div className="aspect-[4/3] bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-brand-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-gray-500">Memuat 3D scene...</p>
      </div>
    </div>
  ),
});

interface Props {
  coverFinish: 'doff' | 'glossy' | 'canvas' | 'leatherette';
  cornerShape: 'square' | 'round';
  edgeFinish: 'plain' | 'gilded_gold' | 'gilded_silver' | 'sprayed_red' | 'sprayed_blue' | 'stenciled';
  hasDustJacket?: boolean;
  headbandCode?: string;
  ribbonCodes?: string[];
  spineWidthMm?: number;
  sizeCode?: 'A5' | 'B5' | 'A6';
  coverTextureUrl?: string;
}

export default function Book3DPreview(props: Props) {
  const [enabled, setEnabled] = useState(true);

  // If WebGL not supported, fall back to 2D
  const hasWebGL = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch { return false; }
  }, []);

  if (!hasWebGL) {
    return (
      <div className="aspect-[4/3] bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl flex items-center justify-center text-sm text-gray-500">
        3D preview tidak tersedia — perangkat tidak mendukung WebGL
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="aspect-[4/3] bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 rounded-xl overflow-hidden border border-amber-200 relative">
        {enabled ? (
          <Book3DScene
            {...props}
            mode="orbit"
            autoRotate
            autoRotateSpeed={0.4}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
            3D dimatikan
          </div>
        )}
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className="text-xs text-brand-700 hover:underline self-start"
      >
        {enabled ? 'Matikan 3D' : 'Nyalakan 3D'}
      </button>
    </div>
  );
}