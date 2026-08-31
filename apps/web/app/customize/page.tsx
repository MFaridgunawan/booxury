'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { IntroScene } from '@/components/customize/intro-and-section';
import { MaterialFilm } from '@/components/customize/material-film';
import { GuideHeader, FinalCTA } from '@/components/customize/header-and-final-cta';

/**
 * Customize guide page — the material overview is presented as one self-playing
 * editorial sequence instead of five scroll-controlled panels.
 */
export default function CustomizeGuidePage() {
  const router = useRouter();
  const goStart = useCallback(() => router.push('/customize/base'), [router]);

  return (
    <div className="min-h-screen bg-brand-50 pb-0">
      <style>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #faf9f7; }
        ::-webkit-scrollbar-thumb { background: #c4c1b9; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #9a968f; }
        ::selection { background: #c8bfb0; color: #1d1d1d; }
      `}</style>

      <GuideHeader onStart={goStart} />

      <main className="pt-14">
        <IntroScene onStart={goStart} />
        <MaterialFilm />
        <FinalCTA onStart={goStart} />
      </main>

      <footer className="border-t border-brand-200 bg-brand-50 px-6 py-5 text-center text-xs text-brand-400">
        Booxury — Custom Hardcover Notebook Platform
      </footer>
    </div>
  );
}
