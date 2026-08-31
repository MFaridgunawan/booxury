'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { BookFlat, BookOpen, BookCover } from '@/components/ui/book-illustrations';
import { SectionScene } from '@/components/customize/intro-and-section';
import {
  EASE_EXPO_OUT,
  DURATION_SLOW,
  DURATION_NORMAL,
  DURATION_FAST,
  CLIP_DURATION,
  STAGGER_80MS,
  STAGGER_100MS,
} from '@/lib/motion-constants';
import { SIZES, COVERS, PAPERS, EDGES, EXTRAS } from '@/lib/customize-data';

/**
 * Cover texture overlays — applied as absolute-positioned layers on top of the swatch color.
 */
function TextureOverlay({ type }: { type: string }) {
  if (type === 'none') return null;
  const base: React.CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none' };
  if (type === 'glossy') return <div style={{ ...base, background: 'radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.55) 0%, transparent 55%)' }} />;
  if (type === 'linen') return <div style={{ ...base, backgroundImage: 'repeating-linear-gradient(45deg, #00000010 0 1px, transparent 1px 5px)', backgroundSize: '8px 8px' }} />;
  if (type === 'leather') return <div style={{ ...base, backgroundImage: 'repeating-linear-gradient(90deg, #00000010 0 1px, transparent 1px 4px), repeating-linear-gradient(0deg, #00000010 0 1px, transparent 1px 7px)', backgroundSize: '6px 10px' }} />;
  return null;
}

/** SizeScene — pick a hardcover size. Visual book illustration per option. */
function SizeBookIcon({ name }: { name: string }) {
  if (name === 'A5') return <BookFlat className="w-full max-w-[64px]" />;
  if (name === 'B5') return <BookOpen className="w-full max-w-[88px]" />;
  return <BookCover className="w-full max-w-[40px]" />;
}

export function SizeScene() {
  const contentRef = useRef<HTMLDivElement>(null);
  const inView = useInView(contentRef, { once: true, amount: 0.2 });
  const rm = useReducedMotion();

  return (
    <SectionScene id="material" num="01" title="Ukuran" subtitle="Tiga ukuran standar hardcover — harga dan spine menyesuaikan.">
      <div ref={contentRef} className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {SIZES.map((s, i) => (
          <motion.div
            key={s.name}
            initial={rm ? false : { opacity: 0, y: 24, scale: 0.95 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: rm ? 0 : DURATION_NORMAL, delay: rm ? 0 : STAGGER_100MS * i, ease: EASE_EXPO_OUT }}
            className="group cursor-pointer"
          >
            <div className="mb-5 flex h-36 items-center justify-center bg-brand-100 px-4 transition-all duration-300 group-hover:bg-brand-200 sm:h-44">
              <motion.div whileHover={rm ? {} : { y: -6, scale: 1.05 }} transition={{ duration: 0.3, ease: EASE_EXPO_OUT }}>
                <SizeBookIcon name={s.name} />
              </motion.div>
            </div>
            <div className="text-center">
              <p className="font-serif text-xl font-bold text-brand-900 sm:text-2xl">{s.name}</p>
              <p className="mt-1 text-xs text-brand-400 sm:text-sm">{s.dims}</p>
              <p className="mt-1.5 text-xs font-semibold text-accent-700 sm:text-sm">{s.price}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionScene>
  );
}

export function CoverScene() {
  const contentRef = useRef<HTMLDivElement>(null);
  const inView = useInView(contentRef, { once: true, amount: 0.2 });
  const rm = useReducedMotion();

  return (
    <SectionScene num="02" title="Material Kover" subtitle="Dari matt doff sampai leatherette premium.">
      <div ref={contentRef} className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
        {COVERS.map((c, i) => (
          <motion.div
            key={c.name}
            initial={rm ? false : { opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: rm ? 0 : DURATION_FAST, delay: rm ? 0 : STAGGER_80MS * i, ease: EASE_EXPO_OUT }}
            className="group cursor-pointer"
          >
            <motion.div
              whileHover={rm ? {} : { scale: 1.03 }}
              transition={{ duration: 0.25, ease: EASE_EXPO_OUT }}
              className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 border-transparent transition-all duration-200 group-hover:border-brand-300 group-hover:shadow-lg"
            >
              <div className="absolute inset-0" style={{ backgroundColor: c.swatch }} />
              <TextureOverlay type={c.texture} />
              <div className="absolute inset-0 rounded-2xl ring-2 ring-brand-900/0 transition-all duration-200 group-hover:ring-brand-900/20" />
            </motion.div>
            <div className="text-center">
              <p className="text-sm font-semibold text-brand-900">{c.name}</p>
              <p className="mt-0.5 text-xs text-brand-400">{c.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionScene>
  );
}

/** PaperSwatch — visual representation of a paper stock (color + ruled lines). */
function PaperSwatch({ paper }: { paper: typeof PAPERS[number] }) {
  return (
    <div className="flex h-20 w-full items-center justify-center p-4 sm:h-24">
      <div className="w-full max-w-[140px] rounded-lg p-3" style={{ backgroundColor: paper.swatch }}>
        {paper.lines && (
          <div className="space-y-1.5">
            {[1, 2, 3, 4].map((l) => (
              <div key={l} className="h-1 rounded-sm bg-black/15" style={{ width: `${75 - l * 10}%` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function PaperScene() {
  const contentRef = useRef<HTMLDivElement>(null);
  const inView = useInView(contentRef, { once: true, amount: 0.2 });
  const rm = useReducedMotion();

  return (
    <SectionScene num="03" title="Kertas Isi" subtitle="Setiap kertas punya karakter sendiri untuk baca dan tulis.">
      <div ref={contentRef} className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
        {PAPERS.map((p, i) => (
          <motion.div
            key={p.name}
            initial={rm ? false : { opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: rm ? 0 : DURATION_FAST, delay: rm ? 0 : STAGGER_80MS * i, ease: EASE_EXPO_OUT }}
            className="group cursor-pointer overflow-hidden rounded-2xl border border-brand-200 transition-all duration-200 group-hover:border-brand-300 group-hover:shadow-md"
          >
            <PaperSwatch paper={p} />
            <div className="px-3 pb-3 text-center">
              <p className="text-sm font-semibold text-brand-900">{p.name}</p>
              <p className="mt-0.5 text-xs text-brand-400">{p.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionScene>
  );
}

export function EdgeScene() {
  const contentRef = useRef<HTMLDivElement>(null);
  const inView = useInView(contentRef, { once: true, amount: 0.2 });
  const rm = useReducedMotion();

  return (
    <SectionScene num="04" title="Finishing Sisi" subtitle="Sisi halaman bisa natural, metalik, atau dispray warna.">
      <div ref={contentRef} className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
        {EDGES.map((e, i) => (
          <motion.div
            key={e.name}
            initial={rm ? false : { opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: rm ? 0 : DURATION_FAST, delay: rm ? 0 : STAGGER_80MS * i, ease: EASE_EXPO_OUT }}
            className="group cursor-pointer overflow-hidden rounded-xl border border-brand-200 transition-all duration-200 group-hover:border-brand-300 group-hover:shadow-sm"
          >
            <div className="flex h-14 items-center justify-center bg-brand-100 p-3 sm:h-16">
              <div className={`h-5 w-full rounded ${e.swatch}`} />
            </div>
            <div className="px-2 py-2.5 text-center">
              <span className="text-xs font-semibold text-brand-900">{e.name}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionScene>
  );
}

/** ExtraIcon — minimal visual for headband, ribbon, or dust jacket. */
function ExtraIcon({ name }: { name: string }) {
  if (name === 'Headband') {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <div className="h-6 w-28 rounded-full border border-brand-300 bg-brand-50" />
          <div className="flex -space-x-1">
            {['#b71c1c', '#1a1a1a', '#FFD700', '#f5f5f5'].map((c, i) => (
              <div key={i} className="h-4 w-4 rounded-full border-2 border-brand-50" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (name === 'Pita') {
    return (
      <div className="flex flex-col items-center gap-2">
        <svg viewBox="0 0 60 36" className="h-10 w-16" aria-hidden="true">
          <rect x="4" y="4" width="52" height="32" rx="2" fill="#f5f1e9" stroke="#c4c1b9" />
          <path d="M50 14 Q66 18 66 24 Q66 30 50 34" stroke="#FFD700" strokeWidth="3" fill="none" />
        </svg>
        <div className="flex -space-x-1">
          {['#b71c1c', '#FFD700', '#1b5e20', '#1565c0', '#1a1a1a'].map((c, i) => (
            <div key={i} className="h-4 w-4 rounded-full border-2 border-brand-50" style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="relative h-14 w-24 rounded border border-brand-300 bg-brand-50 p-1">
      <div className="h-full w-full rounded-sm bg-brand-100" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[7px] font-bold uppercase tracking-wider text-brand-400">Dust Jacket</span>
      </div>
    </div>
  );
}

export function ExtraScene() {
  const contentRef = useRef<HTMLDivElement>(null);
  const inView = useInView(contentRef, { once: true, amount: 0.3 });
  const rm = useReducedMotion();

  return (
    <SectionScene num="05" title="Detail" subtitle="Headband, pita pembatas, dan dust jacket.">
      <div ref={contentRef} className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {EXTRAS.map((e, i) => (
          <motion.div
            key={e.name}
            initial={rm ? false : { opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: rm ? 0 : DURATION_FAST, delay: rm ? 0 : STAGGER_100MS * i, ease: EASE_EXPO_OUT }}
            className="group cursor-pointer overflow-hidden rounded-2xl border border-brand-200 bg-brand-50 transition-all duration-200 group-hover:border-brand-300 group-hover:shadow-md"
          >
            <div className="flex h-28 items-center justify-center bg-brand-100 sm:h-32">
              <ExtraIcon name={e.name} />
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-sm font-semibold text-brand-900">{e.name}</p>
              <p className="mt-0.5 text-xs text-brand-400">{e.detail}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionScene>
  );
}