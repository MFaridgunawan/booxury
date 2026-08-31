'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';
import { useConfiguratorStore } from '../../lib/stores/configurator';
import type { Scene3DProps } from '@booxury/three';

const Scene3D = dynamic(
  () => import('@booxury/three').then((m) => m.Scene3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-brand-950">
        <div className="text-center">
          <div className="mx-auto mb-3 h-7 w-7 border border-brand-300 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-brand-200">Memuat preview 3D…</p>
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
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative flex-1 min-w-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          ref={contentRef}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Persistent 3D sidebar with luxury studio background and 6 camera angle presets
function WizardSidebar() {
  const phase = useCurrentPhase();
  const { base, finish, coverTextureUrl, spineWidthMm } = useConfiguratorStore();
  const [autoRotate, setAutoRotate] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<string | null>(null);

  // Sync preset with phase when phase changes
  useEffect(() => {
    setCameraPreset(null);
  }, [phase]);

  const activeAngle = cameraPreset ?? (phase === 'cover' ? 'cover' : phase === 'finish' ? 'base' : 'base');

  // Dynamic open angle for realistic inside page inspection
  let coverOpenAngle = 0;
  if (activeAngle === 'inside') {
    coverOpenAngle = Math.PI * 0.7; // Open ~126° — clearly inspect lined/plain pages & paper color
  } else if (activeAngle === 'ribbon') {
    coverOpenAngle = 0.15; // Slight peek for ribbon & headband
  }

  // 6 user-requested core angles with numbering:
  // 1. Kover, 2. Buka Isi, 3. 3/4, 4. Punggung, 5. Sisi, 6. Pita
  const CAMERA_PRESETS = [
    { id: 'cover',  label: '01 Kover',     title: 'Fokus kover depan tertutup' },
    { id: 'inside', label: '02 Isi',       title: 'Buka kover untuk melihat isi dan warna kertas' },
    { id: 'base',   label: '03 3/4',       title: 'Sudut keseluruhan buku' },
    { id: 'spine',  label: '04 Punggung',  title: 'Fokus punggung, ketebalan, dan engsel' },
    { id: 'edges',  label: '05 Sisi',      title: 'Fokus sisi halaman' },
    { id: 'ribbon', label: '06 Pita',      title: 'Fokus pita penanda dan headband' },
  ];

  return (
    <aside className="sticky top-20 flex h-[540px] w-full flex-shrink-0 flex-col overflow-hidden border border-brand-800 bg-brand-950 shadow-[0_20px_48px_rgba(10,10,10,0.2)] lg:h-[calc(100vh-6.5rem)] lg:w-[380px] xl:w-[420px]">
      {/* 3D Canvas Header Bar */}
      <div className="z-10 flex items-center justify-between border-b border-brand-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-300" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-100">Preview 3D</span>
        </div>
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.11em] transition-colors ${
            autoRotate ? 'border-brand-50 bg-brand-50 text-brand-950' : 'border-brand-700 text-brand-200 hover:border-accent-300 hover:text-accent-100'
          }`}
          title="Toggle putar otomatis"
        >
          {autoRotate ? 'Hentikan putar' : 'Putar 360°'}
        </button>
      </div>

      {/* 6 Camera Angle Toolbar */}
      <div className="z-10 flex gap-1 overflow-x-auto border-b border-brand-800 px-3 py-2 no-scrollbar">
        {CAMERA_PRESETS.map((p) => {
          const isActive = activeAngle === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setCameraPreset(p.id)}
              title={p.title}
              className={`flex-shrink-0 border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-brand-50 bg-brand-50 text-brand-950'
                  : 'border-brand-800 bg-brand-900 text-brand-300 hover:border-brand-500 hover:text-brand-100'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* 3D Studio Canvas Container (Comfortable Dark Studio Backdrop) */}
      <div className="relative min-h-[280px] flex-1 bg-[#101010]">
        <Scene3D
          mode="orbit"
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
          coverOpenAngle={coverOpenAngle}
          layout={base.layout}
          paperCode={base.paperCode}
          endpaperCode={base.endpaperCode}
          autoRotate={autoRotate}
          autoRotateSpeed={0.4}
          phase={activeAngle}
          dpr={[1, 1.5]}
        />

        {/* Floating live specs and zoom controls */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="border border-brand-700 bg-brand-950/95 px-2.5 py-1 text-[10px] font-medium text-brand-200">
            {base.size} · {base.pages} hal ({base.layout === 'lined' ? 'Garis' : 'Polos'}) · Spine {spineWidthMm.toFixed(1)}mm
          </div>
          <div className="pointer-events-auto flex items-center gap-1.5 border border-brand-700 bg-brand-950/95 px-2.5 py-1 text-[10px] font-medium text-brand-300">
            <span>Scroll untuk zoom</span>
            <button
              onClick={() => setCameraPreset(activeAngle)}
              className="border border-brand-600 px-1.5 py-0.5 text-[10px] text-accent-100 transition-colors hover:border-accent-300 hover:text-brand-50"
              title="Reset Zoom & Posisi Kamera"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Footer step specs */}
      <div className="flex items-center justify-between border-t border-brand-800 px-4 py-2 text-[10px] text-brand-400">
        <span>Kertas: <strong className="font-medium text-brand-100">{base.paperCode}</strong></span>
        <span>Kover: <strong className="font-medium capitalize text-brand-100">{finish.coverFinish}</strong></span>
        <span>Sisi: <strong className="font-medium capitalize text-brand-100">{finish.edgeFinish.replace('_', ' ')}</strong></span>
      </div>
    </aside>
  );
}

interface WizardLayoutProps {
  children: React.ReactNode;
}

export function WizardLayout({ children }: WizardLayoutProps) {
  const phase = useCurrentPhase();

  return (
    <div className="flex min-h-screen flex-col bg-brand-50 text-brand-900">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 border-b border-brand-200 bg-brand-50/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <a href="/" className="font-serif text-2xl font-bold tracking-[-0.04em] text-brand-900 transition-opacity hover:opacity-70">
              Booxury
            </a>
            <span className="hidden border-l border-brand-300 pl-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-brand-500 sm:inline-block">
              Konfigurator
            </span>
          </div>
          <WizardProgress />
        </div>
      </header>

      {/* Main: persistent 3D sidebar + active step content */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-start gap-8 px-4 py-7 sm:px-6 lg:flex-row lg:gap-12 lg:py-10">
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
    <nav aria-label="Tahapan konfigurator" className="flex items-center gap-2 sm:gap-3">
      {PHASES.map((p, i) => {
        const done = i < currentIndex;
        const active = p.id === phase;
        return (
          <a
            key={p.id}
            href={`/customize/${p.id}`}
            className={[
              'flex items-center gap-1.5 border-b pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors sm:text-xs',
              active ? 'border-brand-900 text-brand-900' :
              done ? 'border-brand-300 text-brand-600 hover:border-brand-900 hover:text-brand-900' :
              'pointer-events-none border-brand-200 text-brand-400',
            ].join(' ')}
          >
            <span className={`flex h-4 w-4 items-center justify-center border text-[9px] ${
              active ? 'border-brand-900 bg-brand-900 font-bold text-brand-50' : done ? 'border-brand-600 bg-brand-600 text-brand-50' : 'border-brand-300 text-brand-500'
            }`}>
              {done ? <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="m2.4 6.1 2.1 2.1 5.1-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg> : i + 1}
            </span>
            <span>{p.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
