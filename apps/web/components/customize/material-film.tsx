'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { useRef } from 'react';
import { BookCover, BookFlat, BookOpen } from '@/components/ui/book-illustrations';
import { COVERS, EDGES, EXTRAS, PAPERS, SIZES } from '@/lib/customize-data';
import { EASE_EXPO_OUT } from '@/lib/motion-constants';

const FILM_DURATION = 4400;

const MATERIAL_STORIES = [
  {
    number: '01',
    eyebrow: 'Format buku',
    title: ['Satu bentuk.', 'Tiga skala.'],
    description: 'Pilih ukuran yang memberi ruang paling tepat untuk ide, catatan, dan cerita brand Anda.',
    kind: 'size',
    items: SIZES.map((item) => ({ label: item.name, detail: item.dims, note: item.desc })),
  },
  {
    number: '02',
    eyebrow: 'Material kover',
    title: ['Sebelum cerita,', 'ada tekstur.'],
    description: 'Permukaan pertama yang disentuh perlu terasa setepat identitas yang ingin Anda bawa.',
    kind: 'cover',
    items: COVERS.map((item) => ({ label: item.name, detail: item.desc, swatch: item.swatch, texture: item.texture })),
  },
  {
    number: '03',
    eyebrow: 'Kertas isi',
    title: ['Isi yang', 'menemani ide.'],
    description: 'Karakter kertas menentukan bagaimana tulisan, gambar, dan halaman kosong terasa setiap hari.',
    kind: 'paper',
    items: PAPERS.map((item) => ({ label: item.name, detail: item.desc, swatch: item.swatch, lines: item.lines })),
  },
  {
    number: '04',
    eyebrow: 'Finishing sisi',
    title: ['Cahaya di', 'setiap sisi.'],
    description: 'Natural, metalik, atau berwarna: detail tepi memberi karakter saat buku tertutup.',
    kind: 'edge',
    items: EDGES.map((item) => ({ label: item.name, detail: item.desc, edgeClass: item.swatch })),
  },
  {
    number: '05',
    eyebrow: 'Komponen pelengkap',
    title: ['Sentuhan kecil.', 'Kesan panjang.'],
    description: 'Pita, headband, dan dust jacket menyelesaikan pengalaman fisik sebuah hardcover.',
    kind: 'extra',
    items: EXTRAS.map((item) => ({ label: item.name, detail: item.detail })),
  },
] as const;

function Texture({ texture }: { texture?: string }) {
  if (texture === 'glossy') return <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.64),transparent_55%)]" />;
  if (texture === 'linen') return <span className="absolute inset-0 opacity-40 [background-image:repeating-linear-gradient(45deg,rgba(0,0,0,0.22)_0_1px,transparent_1px_5px)]" />;
  if (texture === 'leather') return <span className="absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(90deg,rgba(0,0,0,0.22)_0_1px,transparent_1px_4px),repeating-linear-gradient(0deg,rgba(0,0,0,0.16)_0_1px,transparent_1px_7px)]" />;
  return null;
}

function StoryIcon({ kind, index }: { kind: (typeof MATERIAL_STORIES)[number]['kind']; index: number }) {
  if (kind === 'size') {
    const Icon = index === 0 ? BookFlat : index === 1 ? BookOpen : BookCover;
    return <Icon className={index === 1 ? 'h-12 w-16' : 'h-12 w-12'} />;
  }

  if (kind === 'extra') {
    if (index === 0) return <span className="h-4 w-12 rounded-full border border-brand-400 bg-brand-50" />;
    if (index === 1) return <span className="h-12 w-2.5 rounded-b-sm bg-[#7c252b] shadow-[2px_5px_8px_rgba(71,21,25,0.2)]" />;
    return <span className="h-12 w-14 border border-brand-400 bg-brand-100 shadow-sm" />;
  }

  return null;
}

export function MaterialFilm() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.55 });
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const story = MATERIAL_STORIES[activeIndex];

  useEffect(() => {
    if (!inView || reducedMotion || isPaused) return;
    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % MATERIAL_STORIES.length);
    }, FILM_DURATION);
    return () => window.clearTimeout(timer);
  }, [activeIndex, inView, isPaused, reducedMotion]);

  return (
    <section ref={sectionRef} id="material" aria-label="Panduan material Booxury" className="relative isolate min-h-[calc(100svh-3.5rem)] overflow-hidden border-y border-brand-200 bg-brand-50 px-4 py-12 sm:px-6 lg:py-16">
      <div aria-hidden="true" className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] [background-size:32px_32px]" />
      <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-[58vw] w-[58vw] max-h-[780px] max-w-[780px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-100/35 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100svh-10rem)] max-w-7xl flex-col justify-center">
        <div className="mb-7 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.18em] text-brand-500 sm:mb-10">
          <span>Panduan material</span>
          <span>{story.number} / {String(MATERIAL_STORIES.length).padStart(2, '0')}</span>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={story.number}
            initial={reducedMotion ? false : { opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -16, filter: 'blur(6px)' }}
            transition={{ duration: reducedMotion ? 0.01 : 0.72, ease: EASE_EXPO_OUT }}
            className="grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-20"
          >
            <div className="text-center lg:text-left">
              <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.2em] text-accent-600">{story.eyebrow}</p>
              <h2 className="text-balance font-serif text-[clamp(3.15rem,7.1vw,7.25rem)] font-bold leading-[0.82] tracking-[-0.065em] text-brand-900">
                {story.title.map((line) => <span key={line} className="block">{line}</span>)}
              </h2>
              <p className="mx-auto mt-7 max-w-md text-sm leading-7 text-brand-600 lg:mx-0 sm:text-base">{story.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-px border border-brand-200 bg-brand-200 sm:grid-cols-3 lg:grid-cols-2">
              {story.items.map((item, index) => (
                <motion.article
                  key={item.label}
                  initial={reducedMotion ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reducedMotion ? 0.01 : 0.42, delay: reducedMotion ? 0 : 0.12 + index * 0.075, ease: EASE_EXPO_OUT }}
                  className="group relative min-h-40 overflow-hidden bg-brand-50 p-4 sm:min-h-44 sm:p-5"
                >
                  <div className="flex h-14 items-start justify-between">
                    {item.swatch ? (
                      <div className="relative h-10 w-12 overflow-hidden border border-brand-300" style={{ backgroundColor: item.swatch }}><Texture texture={item.texture} /></div>
                    ) : item.edgeClass ? (
                      <div className={`h-3 w-12 rounded-full ${item.edgeClass}`} />
                    ) : item.lines ? (
                      <div className="w-14 space-y-1.5 border border-brand-300 p-2" style={{ backgroundColor: item.swatch }}>
                        {[0, 1, 2].map((line) => <span key={line} className="block h-px bg-brand-500/35" />)}
                      </div>
                    ) : item.swatch ? null : (
                      <StoryIcon kind={story.kind} index={index} />
                    )}
                    <span className="text-[10px] text-brand-400">0{index + 1}</span>
                  </div>
                  <h3 className="mt-5 font-serif text-xl font-bold leading-none tracking-[-0.03em] text-brand-900">{item.label}</h3>
                  <p className="mt-2 max-w-[15rem] text-[11px] leading-relaxed text-brand-500">{item.detail}</p>
                </motion.article>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex items-center gap-2" aria-label="Kemajuan panduan material">
          {MATERIAL_STORIES.map((item, index) => (
            <span key={item.number} className="h-px flex-1 overflow-hidden bg-brand-200">
              <motion.span
                className="block h-full bg-brand-900"
                initial={false}
                animate={{ scaleX: index < activeIndex ? 1 : index === activeIndex ? (reducedMotion ? 1 : 0) : 0 }}
                transition={index === activeIndex && !reducedMotion ? { duration: FILM_DURATION / 1000, ease: 'linear' } : { duration: 0.3, ease: EASE_EXPO_OUT }}
                style={{ transformOrigin: 'left' }}
              />
            </span>
          ))}
          <button
            type="button"
            onClick={() => setIsPaused((current) => !current)}
            className="ml-3 shrink-0 text-[10px] font-medium uppercase tracking-[0.14em] text-brand-500 transition-colors hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            {isPaused ? 'Lanjutkan' : 'Jeda'}
          </button>
        </div>
      </div>

      <p className="sr-only">Panduan ini menampilkan ukuran, material kover, kertas isi, finishing sisi, dan komponen pelengkap secara otomatis.</p>
    </section>
  );
}
