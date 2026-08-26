'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { useConfiguratorStore } from '../../lib/stores/configurator';
import type { Scene3DProps } from '@booxury/three';

const Scene3D = dynamic(
  () => import('@booxury/three').then((m) => m.Scene3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-50 to-amber-50 rounded-2xl">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-brand-800 font-medium">Memuat 3D preview...</p>
        </div>
      </div>
    ),
  }
) as React.ComponentType<Scene3DProps>;

function useCurrentPhase() {
  return useConfiguratorStore((s) => s.phase);
}

interface PhaseOverlayProps {
  phase: string;
  children: React.ReactNode;
}

function PhaseOverlay({ phase, children }: PhaseOverlayProps) {
  const [visible, setVisible] = useState(true);
  const prevPhaseRef = useRef(phase);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase === prevPhaseRef.current) return;
    prevPhaseRef.current = phase;

    if (!overlayRef.current || !contentRef.current) {
      setVisible(true);
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => setVisible(true),
    });

    tl.to(contentRef.current, {
      opacity: 0,
      x: -16,
      duration: 0.25,
      ease: 'power2.in',
    })
      .set(overlayRef.current, { pointerEvents: 'none' })
      .to(overlayRef.current, {
        opacity: 0,
        duration: 0.1,
      })
      .set(overlayRef.current, { display: 'none' })
      .set(contentRef.current, { opacity: 0, x: 16 })
      .set(overlayRef.current, { opacity: 1, display: 'block' })
      .to(overlayRef.current, { opacity: 0, duration: 0.08 })
      .to(contentRef.current, {
        opacity: 1,
        x: 0,
        duration: 0.35,
        ease: 'power3.out',
        onComplete: () => setVisible(true),
      });

    return () => {
      tl.kill();
    };
  }, [phase]);

  return (
    <div ref={overlayRef} className="relative flex-1 min-w-0">
      <div
        ref={contentRef}
        className="h-full"
        style={{ opacity: 1, transform: 'translateX(0)' }}
      >
        {children}
      </div>
    </div>
  );
}

// Persistent 3D sidebar with game-like cinematic camera controls
function WizardSidebar() {
  const phase = useCurrentPhase();
  const { base, finish, coverTextureUrl, spineWidthMm } = useConfiguratorStore();
  const [autoRotate, setAutoRotate] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<string | null>(null);

  // Sync preset with phase when phase changes
  useEffect(() => {
    setCameraPreset(null);
  }, [phase]);

  const activeAngle = cameraPreset ?? phase;

  // Dynamic open angle for realistic inside page inspection
  let coverOpenAngle = 0;
  if (activeAngle === 'inside') {
    coverOpenAngle = Math.PI * 0.85; // Open wide (~153°) — see full inside pages fanning out
  } else if (activeAngle === 'base') {
    coverOpenAngle = Math.PI * 0.45; // Partially open (~81°) — highlight paper layout & spine
  } else if (activeAngle === 'finish') {
    coverOpenAngle = Math.PI * 0.18; // Slight peek for gilded edge & ribbon
  } else if (activeAngle === 'ribbon') {
    coverOpenAngle = Math.PI * 0.22;
  }

  const CAMERA_PRESETS = [
    { id: 'cover',  label: '🎨 Kover',     title: 'Fokus Kover Depan Tertutup' },
    { id: 'inside', label: '📖 Buka Isi',  title: 'Buka Kover: Lihat Isi (Garis/Polos) & Kertas' },
    { id: 'base',   label: '📐 3/4',       title: 'Sudut Beauty 3/4 Lengkap' },
    { id: 'spine',  label: '📚 Punggung',  title: 'Fokus Punggung & Engsel' },
    { id: 'edges',  label: '✨ Sisi',      title: 'Fokus Sisi Halaman & Foil' },
    { id: 'ribbon', label: '🎗️ Pita',      title: 'Fokus Pita & Headband' },
  ];

  return (
    <div className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 sticky top-20 h-[540px] lg:h-[calc(100vh-6.5rem)] rounded-2xl overflow-hidden bg-white/80 backdrop-blur-md border border-brand-200/80 shadow-md flex flex-col">
      {/* 3D Canvas Header Bar */}
      <div className="px-4 py-2.5 bg-white/90 border-b border-brand-100 flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-brand-900 tracking-wide uppercase">3D Cinematic View</span>
        </div>
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-colors ${
            autoRotate ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          title="Toggle putar otomatis"
        >
          {autoRotate ? 'Berhenti' : '🔄 Putar 360°'}
        </button>
      </div>

      {/* Game-like Camera Angle Toolbar */}
      <div className="px-3 py-2 bg-stone-50 border-b border-brand-100/60 flex items-center gap-1 overflow-x-auto no-scrollbar z-10">
        <span className="text-[10px] uppercase font-bold text-gray-400 mr-1 flex-shrink-0">Kamera:</span>
        {CAMERA_PRESETS.map((p) => {
          const isActive = activeAngle === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setCameraPreset(p.id)}
              title={p.title}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? 'bg-brand-700 text-white shadow-sm ring-1 ring-brand-800'
                  : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* 3D Canvas Container */}
      <div className="relative flex-1 min-h-[280px] bg-gradient-to-b from-brand-50/50 via-amber-50/40 to-stone-100">
        <Scene3D
          mode="orbit"
          sizeCode={base.size}
          spineWidthMm={spineWidthMm}
          coverFinish={finish.coverFinish}
          cornerShape={finish.cornerShape}
          edgeFinish={finish.edgeFinish}
          hasDustJacket={finish.hasDustJacket}
          headbandCode={finish.headbandCode}
          ribbonCodes={finish.ribbonCodes ?? []}
          coverTextureUrl={coverTextureUrl ?? undefined}
          coverOpenAngle={coverOpenAngle}
          layout={base.layout}
          paperCode={base.paperCode}
          endpaperCode={base.endpaperCode}
          autoRotate={autoRotate}
          autoRotateSpeed={0.4}
          phase={activeAngle}
          dpr={[1, 1.5]}
          bloomIntensity={0.2}
        />

        {/* Floating live specs pill */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg shadow-sm border border-brand-100/80 text-[11px] text-brand-900 font-medium">
            {base.size} · {base.pages} hal ({base.layout === 'lined' ? 'Garis' : 'Polos'}) · Spine {spineWidthMm.toFixed(1)}mm
          </div>
          <div className="px-2 py-0.5 bg-black/45 backdrop-blur-md rounded text-[10px] text-white/90">
            Drag bebas untuk rotasi
          </div>
        </div>
      </div>

      {/* Footer step specs */}
      <div className="bg-white px-4 py-2 border-t border-brand-100 text-[11px] flex items-center justify-between text-gray-500">
        <span>Kertas: <strong className="text-brand-900">{base.paperCode}</strong></span>
        <span>Kover: <strong className="text-brand-900 capitalize">{finish.coverFinish}</strong></span>
        <span>Sisi: <strong className="text-brand-900 capitalize">{finish.edgeFinish.replace('_', ' ')}</strong></span>
      </div>
    </div>
  );
}

interface WizardLayoutProps {
  children: React.ReactNode;
}

export function WizardLayout({ children }: WizardLayoutProps) {
  const phase = useCurrentPhase();

  return (
    <div className="min-h-screen bg-brand-50/40 flex flex-col">
      {/* Sticky header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-brand-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-2xl font-serif font-bold text-brand-900 tracking-tight hover:opacity-90 transition-opacity">
              Booxury
            </a>
            <span className="hidden sm:inline-block text-xs bg-brand-100 text-brand-800 font-medium px-2.5 py-0.5 rounded-full">
              W2P Configurator
            </span>
          </div>
          <WizardProgress />
        </div>
      </header>

      {/* Main: persistent 3D sidebar + active step content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-8 items-start">
        {/* Persistent 3D sidebar */}
        <WizardSidebar />

        {/* Animated page content */}
        <PhaseOverlay phase={phase} key={phase}>
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </PhaseOverlay>
      </main>
    </div>
  );
}

// ── WizardProgress ────────────────────────────────────────────────────────────
const PHASES = [
  { id: 'base', label: 'Ukuran & Isi' },
  { id: 'cover', label: 'Desain Kover' },
  { id: 'finish', label: 'Finishing' },
  { id: 'review', label: 'Review' },
] as const;

function WizardProgress() {
  const phase = useConfiguratorStore((s) => s.phase);
  const currentIndex = PHASES.findIndex((p) => p.id === phase);

  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      {PHASES.map((p, i) => {
        const done = i < currentIndex;
        const active = p.id === phase;
        return (
          <a
            key={p.id}
            href={`/customize/${p.id}`}
            className={[
              'px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1.5',
              active ? 'bg-brand-700 text-white shadow-sm ring-2 ring-brand-700/20' :
              done ? 'bg-brand-100 text-brand-800 hover:bg-brand-200' :
              'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none',
            ].join(' ')}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
              active ? 'bg-white text-brand-900 font-bold' : done ? 'bg-brand-700 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {done ? '✓' : i + 1}
            </span>
            <span>{p.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
