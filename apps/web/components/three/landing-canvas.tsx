'use client';
import { useEffect, useRef, useState } from 'react';
import { Scene3D } from '@booxury/three';

interface LandingCanvasProps {
  reducedMotion?: boolean;
}

export function LandingCanvas({ reducedMotion = false }: LandingCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // requestIdleCallback delays mount until after LCP has settled
    const id = requestIdleCallback(
      () => setMounted(true),
      { timeout: 2000 }
    );
    return () => cancelIdleCallback(id);
  }, []);

  if (reducedMotion) {
    return <StaticFallback />;
  }

  if (!mounted) {
    return <StaticFallback />;
  }

  return (
    <div ref={canvasRef} className="w-full h-full">
      <Scene3D
        mode="orbit"
        sizeCode="A5"
        spineWidthMm={12}
        coverFinish="leatherette"
        cornerShape="round"
        hasDustJacket={false}
        autoRotate
        autoRotateSpeed={0.2}
        bloomIntensity={0.4}
        dpr={[1, 1.5]}
      />
    </div>
  );
}

// Static fallback for reduced motion or pre-mount
export function StaticFallback() {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #faf5ee 0%, #f0e4cc 50%, #c4873a 100%)',
      }}
    >
      {/* SVG book illustration */}
      <svg
        viewBox="0 0 120 160"
        width={180}
        height={240}
        className="drop-shadow-xl"
        aria-hidden="true"
      >
        {/* Back cover */}
        <rect x="15" y="10" width="90" height="140" rx="3" fill="#4a3410" />
        {/* Spine */}
        <rect x="48" y="10" width="24" height="140" fill="#6b4420" />
        {/* Front cover */}
        <rect x="15" y="10" width="90" height="140" rx="3" fill="#8b5e20" />
        {/* Spine text */}
        <text x="60" y="85" textAnchor="middle" fill="#c4873a" fontSize="10" fontFamily="serif">
          BX
        </text>
        {/* Front decorative lines */}
        <rect x="25" y="30" width="70" height="2" fill="#c4873a" opacity="0.6" />
        <rect x="25" y="40" width="70" height="2" fill="#c4873a" opacity="0.4" />
        <rect x="25" y="50" width="50" height="2" fill="#c4873a" opacity="0.3" />
        {/* Title */}
        <text x="60" y="100" textAnchor="middle" fill="#FFD700" fontSize="14" fontFamily="serif" fontWeight="bold">
          B
        </text>
      </svg>
    </div>
  );
}
