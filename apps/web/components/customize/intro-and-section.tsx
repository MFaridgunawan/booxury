'use client';

import { useRef, useEffect, useCallback } from 'react';
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { BookCover } from '@/components/ui/book-illustrations';
import { EASE_EXPO_OUT, DURATION_SLOW, DURATION_NORMAL } from '@/lib/motion-constants';
import { TOTAL_SECTIONS } from '@/lib/customize-data';

/**
 * IntroScene — full-viewport hero on the customize guide page.
 * Plays CSS keyframe intro once when in view (no replay on re-renders).
 * Adds subtle parallax on scroll for the headline (Framer Motion handles this — scroll-driven, not state-driven).
 */
export function IntroScene({ onStart }: { onStart: () => void }) {
  const rm = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const animatedRef = useRef(false);
  const sceneInView = useInView(containerRef, { once: true, amount: 0.3 });
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });

  useEffect(() => {
    if (sceneInView && !animatedRef.current) {
      animatedRef.current = true;
      containerRef.current?.classList.add('intro-play');
    }
  }, [sceneInView]);

  const contentY = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const sceneOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const handleStart = useCallback(() => onStart(), [onStart]);

  return (
    <section ref={containerRef} className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-brand-50 px-4">
      <div className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0 1px, transparent 1px 28px), repeating-linear-gradient(-45deg, #000 0 1px, transparent 1px 28px)' }} />

      <div className="intro-counter intro-fade-x absolute right-6 top-1/2 hidden -translate-y-1/2 text-right md:block">
        <div className="font-serif text-[11px] font-bold uppercase tracking-[0.2em] text-brand-300">00 / {TOTAL_SECTIONS}</div>
        <div className="mt-1 ml-auto h-px w-8 bg-brand-200" />
      </div>

      <div className="intro-book intro-scale mb-10 flex items-center justify-center sm:mb-14">
        <BookCover className="w-40 sm:w-56" />
      </div>

      <div style={{ y: (rm ? 0 : contentY) as unknown as number, opacity: (rm ? 1 : sceneOpacity) as unknown as number }} className="relative z-10 text-center">
        <p className="intro-text-1 mb-6 font-serif text-[11px] font-bold uppercase tracking-[0.22em] text-accent-600">Panduan Material</p>

        <div className="overflow-hidden">
          <h1 className="intro-wipe intro-wipe-1 font-serif text-5xl font-bold leading-[0.88] tracking-[-0.05em] text-brand-900 sm:text-6xl lg:text-7xl xl:text-8xl">
            Rancang hardcover
          </h1>
        </div>

        <div className="mt-1 overflow-hidden">
          <h1 className="intro-wipe intro-wipe-2 font-serif text-5xl font-bold leading-[0.88] tracking-[-0.05em] text-accent-700 sm:text-6xl lg:text-7xl xl:text-8xl">
            sesuai keinginan.
          </h1>
        </div>

        <p className="intro-text-2 mx-auto mt-8 max-w-sm text-sm leading-relaxed text-brand-500">
          Sebelum mulai, kenali pilihan material dan finishing yang tersedia.
        </p>
      </div>

      <div className="intro-text-3 mt-14 flex flex-col items-center gap-5 sm:mt-16 sm:flex-row">
        <button
          type="button"
          onClick={handleStart}
          className="group relative inline-flex items-center gap-3 rounded-full bg-brand-900 px-9 py-4 text-sm font-semibold text-brand-50 shadow-[0_10px_28px_rgba(17,17,17,0.22)] transition-all hover:-translate-y-0.5 hover:bg-brand-800 hover:shadow-[0_16px_36px_rgba(17,17,17,0.28)] active:translate-y-0"
        >
          Mulai Desain Sekarang
          <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2.5 8h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <a href="#material" className="group inline-flex items-center gap-2 text-sm font-medium text-brand-500 transition-colors hover:text-brand-900">
          Lihat pilihan
          <svg className="h-4 w-4 transition-transform group-hover:translate-y-0.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3v10m0-10 4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      <div className="intro-fade-1 absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
        <span className="font-serif text-[10px] font-bold uppercase tracking-[0.22em] text-brand-300">Scroll</span>
        <div className="scroll-line h-6 w-px bg-brand-300" />
      </div>
    </section>
  );
}

/**
 * SectionScene — reusable chapter block: ghost number + wipe-reveal title + subtitle + scene indicator.
 * Header animates once when in view (uses motion because wipe reveal needs y-percent transform).
 */
export function SectionScene({ id, num, title, subtitle, children }: {
  id?: string; num: string; title: string; subtitle?: string; children: React.ReactNode;
}) {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, amount: 0.5 });
  const rm = useReducedMotion();

  return (
    <section id={id} className="relative border-t border-brand-200 bg-brand-50 px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
      <div className="mx-auto max-w-6xl">
        <div ref={headerRef} className="mb-16 flex items-end gap-4 sm:mb-20 lg:gap-8">
          <motion.span
            initial={rm ? false : { opacity: 0, x: -20 }}
            animate={headerInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: rm ? 0 : DURATION_SLOW, delay: 0, ease: EASE_EXPO_OUT }}
            className="shrink-0 select-none font-serif text-[72px] font-bold leading-none tracking-tight text-brand-200 sm:text-[100px] lg:text-[130px]"
            style={{ willChange: headerInView ? 'transform, opacity' : 'auto' }}
          >
            {num}
          </motion.span>

          <div className="mb-3 flex-1">
            <div className="overflow-hidden">
              <motion.h2
                initial={rm ? false : { y: '105%' }}
                animate={headerInView ? { y: '0%' } : {}}
                transition={{ duration: rm ? 0 : 0.9, delay: 0.15, ease: EASE_EXPO_OUT }}
                className="font-serif text-4xl font-bold tracking-[-0.04em] text-brand-900 sm:text-5xl lg:text-6xl"
                style={{ willChange: headerInView ? 'transform' : 'auto' }}
              >
                {title}
              </motion.h2>
            </div>
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={headerInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: rm ? 0 : DURATION_NORMAL, delay: 0.35, ease: EASE_EXPO_OUT }}
                className="mt-3 text-sm leading-relaxed text-brand-500 sm:mt-4"
              >
                {subtitle}
              </motion.p>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={headerInView ? { opacity: 1 } : {}}
            transition={{ duration: rm ? 0 : DURATION_NORMAL, delay: 0.4 }}
            className="hidden shrink-0 text-right lg:block"
          >
            <div className="font-serif text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">
              {num} / {TOTAL_SECTIONS}
            </div>
          </motion.div>
        </div>

        {children}
      </div>
    </section>
  );
}