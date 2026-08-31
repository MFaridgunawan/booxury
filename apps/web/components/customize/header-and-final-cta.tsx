'use client';

import { useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, useInView, useReducedMotion } from 'motion/react';
import {
  EASE_EXPO_OUT,
  DURATION_SLOW,
  DURATION_NORMAL,
  CLIP_DURATION,
} from '@/lib/motion-constants';

/** FinalCTA — dark hero ending block before footer. */
export function FinalCTA({ onStart }: { onStart: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const rm = useReducedMotion();
  const handleStart = useCallback(() => onStart(), [onStart]);

  return (
    <section ref={ref} className="relative border-t border-brand-900/20 bg-brand-900 px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 24px), repeating-linear-gradient(-45deg, #fff 0 1px, transparent 1px 24px)' }} />

      <div className="relative mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: rm ? 0 : DURATION_SLOW, ease: EASE_EXPO_OUT }}
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: rm ? 0 : 0.1, duration: DURATION_NORMAL }}
            className="mb-4 font-serif text-[11px] font-bold uppercase tracking-[0.22em] text-accent-400"
          >
            Siap Memulai
          </motion.p>

          <div className="overflow-hidden">
            <motion.h2
              initial={rm ? false : { y: '105%' }}
              animate={inView ? { y: '0%' } : {}}
              transition={{ duration: rm ? 0 : CLIP_DURATION, delay: 0.2, ease: EASE_EXPO_OUT }}
              className="font-serif text-4xl font-bold leading-[0.9] tracking-[-0.04em] text-brand-50 sm:text-5xl lg:text-6xl"
            >
              Desain hardcover<br />impian Anda sekarang.
            </motion.h2>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: rm ? 0 : 0.5, duration: DURATION_NORMAL, ease: EASE_EXPO_OUT }}
            className="mt-5 text-sm text-brand-300 sm:mt-6"
          >
            Mulai dari Rp25.000 — transparan, presisi, siap cetak.
          </motion.p>

          <motion.button
            type="button"
            onClick={handleStart}
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: rm ? 0 : 0.7, duration: DURATION_NORMAL, ease: EASE_EXPO_OUT }}
            className="group mt-12 inline-flex items-center gap-3 rounded-full bg-brand-50 px-10 py-4 text-sm font-bold text-brand-950 shadow-[0_10px_28px_rgba(0,0,0,0.3)] transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_40px_rgba(0,0,0,0.35)] active:translate-y-0 sm:mt-14"
          >
            Mulai dari Spesifikasi
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2.5 8h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

/** Header — fixed top bar with home link, brand name, and CTA button. */
export function GuideHeader({ onStart }: { onStart: () => void }) {
  const handleStart = useCallback(() => onStart(), [onStart]);
  return (
    <header className="fixed left-0 right-0 top-0 z-30 border-b border-brand-200/80 bg-brand-50/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-brand-600 transition-colors hover:text-brand-900">
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Beranda
        </Link>
        <span className="absolute left-1/2 -translate-x-1/2 font-serif text-lg font-bold text-brand-900">Booxury</span>
        <button
          type="button"
          onClick={handleStart}
          className="rounded-full bg-brand-900 px-4 py-2 text-xs font-semibold text-brand-50 transition-colors hover:bg-brand-700"
        >
          Mulai Desain
        </button>
      </div>
    </header>
  );
}