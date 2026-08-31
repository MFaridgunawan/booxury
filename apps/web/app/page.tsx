'use client';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import LandingCanvasWrapper from '@/components/three/landing-canvas-wrapper';

const EDITORIAL_EASE = [0.16, 1, 0.3, 1] as const;

const MATERIAL_CHAPTERS = [
  {
    label: '01 · Kover depan',
    cardTitle: 'Matte & Hot Foil',
    lines: ['Tekstur yang terasa', 'sebelum buku dibuka.'],
    description: 'Pilih doff, kanvas, atau leatherette dengan karakter yang sesuai identitas brand Anda.',
  },
  {
    label: '02 · Buka isi',
    cardTitle: 'Kertas & Isi',
    lines: ['Dibuat untuk dipakai', 'setiap hari.'],
    description: 'Kertas, layout, dan ketebalan buku terasa nyata saat kover terbuka perlahan.',
  },
  {
    label: '03 · Punggung presisi',
    cardTitle: 'French Groove',
    lines: ['Presisi sampai ke', 'punggung buku.'],
    description: 'Ketebalan spine mengikuti spesifikasi isi agar setiap jilid tampil proporsional.',
  },
  {
    label: '04 · Sisi & pita',
    cardTitle: 'Finishing yang hidup',
    lines: ['Detail kecil yang', 'membuatnya berbeda.'],
    description: 'Sisi foil, headband, dan pita satin memberi penutup yang terasa dibuat dengan perhatian.',
  },
] as const;

function MaskedRevealLines({
  lines,
  delay = 0,
  primaryCoverClassName = 'bg-brand-900',
  secondaryCoverClassName = 'bg-brand-50',
  play = true,
}: {
  lines: readonly string[];
  delay?: number;
  primaryCoverClassName?: string;
  secondaryCoverClassName?: string;
  play?: boolean;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <>
      {lines.map((line, index) => (
        <span key={line} className="relative isolate block overflow-hidden pb-[0.08em]" aria-label={line}>
          <span className="block">{line}</span>
          <motion.span
            aria-hidden="true"
            initial={reducedMotion ? { scaleY: 0 } : { scaleY: 1 }}
            animate={{ scaleY: reducedMotion || play ? 0 : 1 }}
            transition={{ duration: reducedMotion ? 0.01 : 0.7, delay: reducedMotion ? 0 : delay + index * 0.12, ease: [0.76, 0, 0.24, 1] }}
            className={`absolute inset-0 z-10 origin-top ${primaryCoverClassName}`}
          />
          <motion.span
            aria-hidden="true"
            initial={reducedMotion ? { scaleY: 0 } : { scaleY: 1 }}
            animate={{ scaleY: reducedMotion || play ? 0 : 1 }}
            transition={{ duration: reducedMotion ? 0.01 : 0.7, delay: reducedMotion ? 0 : delay + index * 0.12 + 0.09, ease: [0.76, 0, 0.24, 1] }}
            className={`absolute inset-0 z-20 origin-bottom ${secondaryCoverClassName}`}
          />
        </span>
      ))}
    </>
  );
}

function useScrollSelectedIndex(length: number) {
  const sectionRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let frameId: number | null = null;

    const updateActiveItem = () => {
      frameId = null;
      const section = sectionRef.current;
      if (!section) return;
      const sectionRect = section.getBoundingClientRect();
      if (sectionRect.bottom < 0 || sectionRect.top > window.innerHeight) return;

      const focusLine = window.innerHeight * 0.46;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      itemRefs.current.slice(0, length).forEach((item, index) => {
        if (!item) return;
        const rect = item.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - focusLine);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex((current) => current === closestIndex ? current : closestIndex);
    };

    const requestUpdate = () => {
      if (frameId === null) frameId = window.requestAnimationFrame(updateActiveItem);
    };

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();

    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, [length]);

  return {
    sectionRef,
    activeIndex,
    registerItem: (index: number) => (element: HTMLElement | null) => {
      itemRefs.current[index] = element;
    },
  };
}

function NavigationBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 border-b border-brand-200/80 bg-brand-50/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-serif font-bold text-brand-900 tracking-[-0.04em]">
          Booxury
        </Link>
        <nav className="flex items-center gap-3 sm:gap-6">
          <a href="#eksplorasi" className="hidden text-sm font-medium text-brand-600 transition-colors hover:text-brand-900 md:inline-block">
            Eksplorasi 3D
          </a>
          <a href="#fitur" className="hidden text-sm font-medium text-brand-600 transition-colors hover:text-brand-900 sm:inline-block">
            Spesifikasi
          </a>
          <a href="#proses" className="hidden text-sm font-medium text-brand-600 transition-colors hover:text-brand-900 xl:inline-block">
            Proses
          </a>
          <a href="#faq" className="hidden text-sm font-medium text-brand-600 transition-colors hover:text-brand-900 xl:inline-block">
            FAQ
          </a>
          <Link
            href="/customize"
            className="rounded-full bg-brand-900 px-4 py-2 text-sm font-semibold text-brand-50 transition-colors hover:bg-brand-700 sm:px-5 sm:py-2.5"
          >
            Mulai Desain
          </Link>
          <Link
            href="/login"
            className="hidden text-sm font-medium text-brand-600 transition-colors hover:text-brand-900 lg:inline-block"
          >
            Masuk
          </Link>
        </nav>
      </div>
    </header>
  );
}

function HeroBookStill() {
  return (
    <div className="relative h-[350px] w-full sm:h-[430px] lg:h-[510px]" role="img" aria-label="Ilustrasi notebook hardcover matte dengan kertas ivory dan pita penanda satin">
      <div aria-hidden="true" className="absolute bottom-[7%] left-[3%] w-36 -rotate-[14deg] bg-brand-50 p-4 shadow-[10px_14px_20px_rgba(17,17,17,0.1)] sm:w-40">
        <p className="font-serif text-lg leading-none text-brand-900">Notes<br /><i>for today</i></p>
        <div className="mt-4 space-y-1.5">
          <span className="block h-px bg-brand-300" />
          <span className="block h-px bg-brand-300" />
          <span className="block h-px bg-brand-300" />
        </div>
      </div>

      <svg aria-hidden="true" viewBox="0 0 28 116" className="pointer-events-none absolute bottom-[1%] right-[25%] z-20 h-[27%] w-5 rotate-[7deg] drop-shadow-[3px_7px_7px_rgba(71,21,25,0.2)]" fill="none">
        <path d="M9 0c-3 19 5 33 1 52-4 20 4 34 1 54l3 10 4-9c-2-20 5-34 1-54C15 33 23 19 18 0H9Z" fill="#7c252b" />
        <path d="M11 2c-2 18 5 33 1 51-4 19 4 33 1 51" stroke="#d46b6c" strokeWidth="2.2" strokeLinecap="round" opacity=".7" />
        <path d="M17 2c4 18-4 32 0 51 4 19-3 33-1 51" stroke="#4b151c" strokeWidth="1.5" strokeLinecap="round" opacity=".42" />
      </svg>

      <div aria-hidden="true" className="absolute bottom-[3%] right-[7%] h-[84%] w-[61%] rotate-[-7deg] [perspective:1000px] sm:right-[9%] sm:w-[58%]">
        <div className="absolute bottom-0 left-1/2 h-[10%] w-[88%] -translate-x-1/2 rounded-full bg-black/20 blur-2xl" />
        <div className="absolute inset-y-[6%] right-[3%] w-[8%] rounded-r-sm bg-[#d2cdc2] shadow-[inset_-5px_0_8px_rgba(0,0,0,0.15)]" />
        <div className="absolute inset-x-[7%] bottom-[1%] h-[7%] bg-[#ebe7dd] [clip-path:polygon(0_0,100%_0,94%_100%,5%_100%)]" />
        <div className="absolute inset-x-[5%] top-[2%] bottom-[7%] overflow-hidden border border-brand-300 bg-brand-50 shadow-[-18px_24px_32px_rgba(0,0,0,0.22)]">
          <div className="absolute inset-y-0 left-0 w-[9%] bg-brand-200" />
          <div className="absolute right-[11%] top-[13%] h-px w-[27%] bg-accent-500" />
          <div className="absolute right-[11%] top-[18%] text-[7px] font-semibold tracking-[0.26em] text-accent-600">BOOXURY</div>
          <div className="absolute inset-x-[13%] top-[38%] border-y border-brand-900/80 py-3 text-center font-serif text-[clamp(21px,3vw,38px)] leading-[0.9] text-brand-900">Ruang<br /><i>Berbagi</i></div>
          <div className="absolute bottom-[13%] left-[13%] text-[6px] tracking-[0.17em] text-brand-600">CATATAN UNTUK YANG BERTUMBUH</div>
          <div className="absolute bottom-[7%] left-[13%] h-[3px] w-[3px] rounded-full bg-accent-300" />
        </div>
        <div className="absolute bottom-[3%] right-[2%] h-[38%] w-[3px] bg-[#8e222c]" />
      </div>
    </div>
  );
}

function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const bookY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 72]), { stiffness: 120, damping: 28 });
  const bookRotate = useTransform(scrollYProgress, [0, 1], [0, -3]);

  return (
    <section ref={heroRef} className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden bg-brand-50 px-4 pb-16 pt-28 sm:px-6 lg:flex lg:items-center">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] bg-brand-100 lg:block" style={{ clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0 100%)' }} />
      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-12 lg:gap-6">
        <div className="z-10 lg:col-span-6 lg:py-16">
          <h1 className="max-w-3xl font-serif text-5xl font-bold leading-[0.93] tracking-[-0.055em] text-brand-900 sm:text-6xl lg:text-7xl xl:text-[5.75rem]">
            <MaskedRevealLines lines={['Buku custom', 'untuk cerita brandmu.']} delay={0.1} />
          </h1>

          <motion.p
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.5, delay: reducedMotion ? 0 : 0.42, ease: EDITORIAL_EASE }}
            className="mt-7 max-w-xl text-base leading-relaxed text-brand-600 sm:text-lg"
          >
            Rancang notebook hardcover untuk tim, event, atau komunitas Anda—dari ukuran dan kertas hingga kover, foil, dan finishing yang terlihat nyata dalam 3D.
          </motion.p>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.45, delay: reducedMotion ? 0 : 0.56, ease: EDITORIAL_EASE }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <motion.div whileHover={reducedMotion ? undefined : { y: -2 }} whileTap={reducedMotion ? undefined : { scale: 0.98 }}>
              <Link href="/customize" className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-brand-900 px-7 py-4 text-base font-semibold text-brand-50 shadow-[0_12px_28px_rgba(17,17,17,0.16)] transition-colors hover:bg-brand-700 sm:w-auto">
                Mulai Kustomisasi
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 8h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </motion.div>
            <a href="#eksplorasi" className="inline-flex w-full items-center justify-center rounded-full border border-brand-300 px-7 py-4 text-base font-semibold text-brand-800 transition-colors hover:border-brand-700 hover:bg-brand-100 sm:w-auto">
              Jelajahi material
            </a>
          </motion.div>

          <motion.dl
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.45, delay: reducedMotion ? 0 : 0.7 }}
            className="mt-11 grid max-w-xl grid-cols-3 border-t border-brand-300 pt-5"
          >
            {[
              ['3 ukuran', 'A5 · B5 · A6'],
              ['Live 3D', 'Preview material'],
              ['Siap cetak', 'Spesifikasi presisi'],
            ].map(([term, detail]) => (
              <div key={term}>
                <dt className="text-sm font-semibold text-brand-900">{term}</dt>
                <dd className="mt-1 text-xs text-brand-500">{detail}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          style={reducedMotion ? undefined : { y: bookY, rotate: bookRotate }}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.96, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.8, delay: reducedMotion ? 0 : 0.16, ease: EDITORIAL_EASE }}
          className="relative lg:col-span-6 lg:col-start-7"
        >
          <div className="relative overflow-hidden">
            <HeroBookStill />
            <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-2 border border-brand-300 bg-brand-50/90 px-3 py-1.5 text-[11px] font-semibold text-brand-700 sm:left-5 sm:top-5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
              Komposisi material
            </div>
            <p className="pointer-events-none absolute bottom-4 right-4 text-right text-[10px] font-medium uppercase tracking-[0.12em] text-brand-500 sm:bottom-5 sm:right-5 sm:text-[11px]">Kover matte · kertas ivory · pita satin</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Interactive3DScrollSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [bookColor, setBookColor] = useState('#f5f1e9');
  const [activeStep, setActiveStep] = useState(0);
  const reducedMotion = useReducedMotion();

  const targetProgress = useMotionValue(0);
  // Spring handles the easing natively — no manual rAF lerp loop needed.
  const visualProgress = useSpring(targetProgress, { stiffness: 90, damping: 20 });

  // Sync visualProgress → activeStep React state for reactive JSX comparisons.
  // R3F canvas re-renders via LandingCanvas's own scrollProgress.on('change') → invalidate().
  useMotionValueEvent(visualProgress, 'change', (v) => {
    const step = v < 0.24 ? 0 : v < 0.54 ? 1 : v < 0.77 ? 2 : 3;
    setActiveStep((prev) => (prev === step ? prev : step));
  });

  const rafId = useRef<number>(0);
  const isInView = useInView(sectionRef, { once: false, amount: 0.16 });
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const storyY = useSpring(useTransform(scrollYProgress, [0, 0.24, 0.75, 1], [72, 0, 0, -54]), { stiffness: 120, damping: 28 });
  const storyOpacity = useTransform(scrollYProgress, [0, 0.13, 0.9, 1], [0.28, 1, 1, 0.45]);

  // Scroll handler: only updates targetProgress. rAF gate = one update per frame.
  useEffect(() => {
    let pending = false;

    const handleScroll = () => {
      if (pending) return;
      pending = true;
      rafId.current = requestAnimationFrame(() => {
        pending = false;
        const el = sectionRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        targetProgress.set(total > 0 ? Math.max(0, Math.min(1, -rect.top / total)) : 0);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [targetProgress]);

  // --- FIX: removed the hostile wheel pacing (paceWheelWhileStageCatchesUp).
  // Native scroll should never be blocked by 3D easing lag. */

  const textOnLeft = activeStep % 2 === 1;
  const activeChapter = MATERIAL_CHAPTERS[activeStep];

  return (
    <section ref={sectionRef} id="eksplorasi" className="relative min-h-[460vh] border-y border-brand-300 bg-brand-50 pt-8 text-brand-900">
      {/* Upward smooth gradient connector from Hero into 3D stage */}
      <div className="pointer-events-none absolute -top-16 left-0 right-0 z-10 h-16 bg-gradient-to-b from-brand-50/0 via-brand-50/90 to-brand-50" />

      {/* Sticky Fullscreen 3D Stage */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-between overflow-hidden p-4 sm:p-8 lg:p-10">
        {/* Canvas color picker */}
        <div className="relative z-20 flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-brand-500">Preview</span>
          <div className="flex items-center rounded-full border border-brand-300/60 bg-brand-50/80 backdrop-blur-sm px-2 py-1 gap-1.5 overflow-hidden">
            {(['#f5f1e9', '#1a3557', '#8c2f33', '#2d5016', '#1a1a1a', '#d4a853'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setBookColor(c)}
                className={`h-5 w-5 rounded-full border-2 transition-all ${
                  bookColor === c ? 'border-brand-900 scale-110' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Pilih warna ${c}`}
              />
            ))}
            <div className="w-px h-4 bg-brand-300/60 mx-0.5" />
            <div className="relative">
              <button
                type="button"
                onClick={() => colorInputRef.current?.click()}
                className="h-5 w-5 rounded-full border-2 border-dashed border-brand-400 bg-brand-50 text-brand-400 hover:border-brand-600 flex items-center justify-center"
                aria-label="Pilih warna custom"
              >
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
              <input
                ref={colorInputRef}
                type="color"
                value={bookColor}
                onChange={(e) => setBookColor(e.target.value)}
                className="sr-only"
              />
            </div>
          </div>
          <span className="text-[10px] text-brand-400 hidden sm:inline">Lihat tampilan akhir</span>
        </div>

        {/* Fullscreen 3D Canvas Layer */}
        <div className="absolute inset-0 z-0 h-full w-full">
          <LandingCanvasWrapper mode="scroll-section" priority="stage" scrollProgress={visualProgress} coverColor={bookColor} />
        </div>

        {/* Editorial story copy: text and the 3D pose change as one sequence. */}
        <motion.div style={reducedMotion ? undefined : { y: storyY, opacity: storyOpacity }} className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 items-center px-4 text-center pointer-events-none sm:px-8 lg:max-w-[92rem] lg:grid-cols-2 lg:px-6">
          <motion.div
            layout="position"
            transition={{ duration: reducedMotion ? 0.01 : 0.62, ease: EDITORIAL_EASE }}
            className={`max-w-xl px-2 pt-8 sm:px-6 lg:pt-0 ${textOnLeft ? 'lg:col-start-1 lg:mr-auto lg:text-left' : 'lg:col-start-2 lg:ml-auto lg:text-right'}`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeChapter.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: EDITORIAL_EASE }}
              >
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-accent-600">
                  {activeChapter.label}
                </p>
                <h3 className="font-serif text-4xl font-bold leading-[0.98] tracking-tight text-brand-900 sm:text-5xl lg:text-6xl">
                  <MaskedRevealLines lines={activeChapter.lines} delay={0.08} play={isInView} primaryCoverClassName="bg-brand-900" secondaryCoverClassName="bg-brand-50" />
                </h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.42, delay: 0.28, ease: EDITORIAL_EASE }}
                  className={`mt-5 max-w-md text-sm leading-relaxed text-brand-600 sm:text-base ${textOnLeft ? 'lg:mr-auto' : 'lg:ml-auto'}`}
                >
                  {activeChapter.description}
                </motion.p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Compact chapter rail synced with scroll rotation. */}
        <div className="relative z-10 mx-auto w-full max-w-5xl pb-4 pointer-events-none">
          <div className="grid grid-cols-2 border-y border-brand-300 lg:grid-cols-4 pointer-events-auto">
            {MATERIAL_CHAPTERS.map((chapter, index) => (
              <div
                key={chapter.label}
                className={`border-brand-300 px-3.5 py-3 text-center transition-colors duration-500 sm:px-4 sm:py-3.5 lg:border-r last:border-r-0 ${
                  activeStep === index
                    ? 'bg-brand-900 text-brand-50'
                    : 'bg-brand-50/80 opacity-65'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-widest ${activeStep === index ? 'text-accent-300' : 'text-brand-500'}`}>
                  {chapter.label}
                </span>
                <h4 className={`mt-1 text-xs font-bold sm:text-sm ${activeStep === index ? 'text-brand-50' : 'text-brand-900'}`}>{chapter.cardTitle}</h4>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 pt-3 text-center text-[11px] text-brand-500 pointer-events-none">
            <span>Scroll ke bawah untuk memutar &amp; menjelajahi setiap detail buku</span>
            <motion.span
              aria-hidden="true"
              animate={reducedMotion ? undefined : { opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              ↓
            </motion.span>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCardsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const animated = useRef(false);
  const inView = useInView(sectionRef, { once: true, amount: 0.2 });
  useEffect(() => {
    if (inView && !animated.current) {
      animated.current = true;
      sectionRef.current?.classList.add('section-play');
    }
  }, [inView]);

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
      title: '3 Ukuran Standar Presisi',
      desc: 'A5 (148×210 mm), B5 (176×250 mm), A6 (105×148 mm) sesuai standar industri buku hardcover.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
        </svg>
      ),
      title: 'Editor 2D & Preview 3D Real-time',
      desc: 'Upload foto, teks, gold foil, emboss, deboss, dan spot UV dengan rendering 3D seketika.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
        </svg>
      ),
      title: 'Spine Calc & Estimasi Transparan',
      desc: 'Formula ketebalan spine akurat dan kalkulasi harga instan sebelum checkout.',
    },
  ];

  return (
    <section ref={sectionRef} id="fitur" className="bg-brand-100 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="section-fade-up max-w-2xl">
          <h2 className="font-serif text-4xl font-bold leading-tight tracking-[-0.04em] text-brand-900 md:text-5xl">Setiap keputusan terlihat sebelum dicetak.</h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-brand-600 sm:text-base">
            Kombinasi kebebasan kustomisasi digital dan standar ketat pengerjaan jilid buku hardcover.
          </p>
        </div>
        <div className="section-fade-up mt-14 grid divide-y divide-brand-300 border-y border-brand-300 md:grid-cols-3 md:divide-x md:divide-y-0">
          {features.map((f, index) => (
            <article
              key={f.title}
              className="section-fade-up px-0 py-8 md:px-8 md:py-2 first:md:pl-0 last:md:pr-0"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-900 text-brand-50">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-brand-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-600">{f.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const animated = useRef(false);
  const inView = useInView(sectionRef, { once: true, amount: 0.2 });
  useEffect(() => {
    if (inView && !animated.current) {
      animated.current = true;
      sectionRef.current?.classList.add('section-play');
    }
  }, [inView]);
  const reducedMotion = useReducedMotion();
  const steps = [
    ['01', 'Tentukan fondasi', 'Pilih ukuran, jumlah halaman, isi, dan struktur hardcover yang paling tepat.'],
    ['02', 'Bangun kover', 'Atur komposisi desain Anda dalam editor 2D sebelum melihat bentuknya.'],
    ['03', 'Pilih karakter akhir', 'Kunci material, foil, sisi halaman, headband, dan pita penanda.'],
    ['04', 'Review siap cetak', 'Periksa spesifikasi akhir dan estimasi harga sebelum masuk keranjang.'],
  ];
  const { sectionRef: scrollSectionRef, activeIndex, registerItem } = useScrollSelectedIndex(steps.length);

  return (
    <section ref={(el) => {
      (sectionRef as React.MutableRefObject<HTMLElement | null>).current = el;
      (scrollSectionRef as React.MutableRefObject<HTMLElement | null>).current = el;
    }} id="proses" className="bg-brand-50 px-4 py-24 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
        <div className="section-fade-up lg:sticky lg:top-28 lg:self-start">
          <h2 className="max-w-md font-serif text-4xl font-bold leading-[0.96] tracking-[-0.04em] text-brand-900 sm:text-5xl">
            Dari gagasan menjadi buku yang siap dibuat.
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-brand-600 sm:text-base">
            Konfigurator dibuat untuk menjaga keputusan kreatif dan spesifikasi produksi tetap berada dalam satu alur yang jelas.
          </p>
          <Link href="/customize" className="mt-8 inline-flex items-center gap-3 border-b border-brand-900 pb-1 text-sm font-semibold text-brand-900 transition-colors hover:border-accent-600 hover:text-accent-600">
            Mulai dari spesifikasi
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 8h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        </div>
        <ol className="border-t border-brand-300">
          {steps.map(([number, title, description], index) => {
            const stepRef = useRef<HTMLLIElement>(null);
            return (
              <motion.li
                ref={(el) => {
                  registerItem(index)(el);
                  (stepRef as React.MutableRefObject<HTMLLIElement | null>).current = el;
                }}
                key={number}
                className="section-fade-up grid min-h-28 gap-3 border-b border-brand-300 px-4 py-5 sm:min-h-32 sm:grid-cols-[3.5rem_1fr] sm:gap-5 sm:px-6 sm:py-6"
                style={{ animationDelay: `${index * 60}ms` }}
                animate={{ backgroundColor: activeIndex === index ? '#171717' : 'rgba(0,0,0,0)' }}
                transition={{ duration: reducedMotion ? 0.01 : 0.35, ease: EDITORIAL_EASE }}
                aria-current={activeIndex === index ? 'step' : undefined}
              >
                <span className={`text-xs font-semibold tracking-[0.14em] ${activeIndex === index ? 'text-accent-300' : 'text-accent-600'}`}>{number}</span>
                <div>
                  <h3 className={`font-serif text-2xl font-bold tracking-[-0.02em] ${activeIndex === index ? 'text-brand-50' : 'text-brand-900'}`}>{title}</h3>
                  <p className={`mt-2 max-w-xl text-sm leading-relaxed ${activeIndex === index ? 'text-brand-300' : 'text-brand-600'}`}>{description}</p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const animated = useRef(false);
  const inView = useInView(sectionRef, { once: true, amount: 0.2 });
  useEffect(() => {
    if (inView && !animated.current) {
      animated.current = true;
      sectionRef.current?.classList.add('section-play');
    }
  }, [inView]);
  const questions = [
    ['Apa yang dapat dikustomisasi?', 'Ukuran, jumlah halaman, material kover, foil, emboss, dan finishing seperti headband dan pita.'],
    ['Bagaimana saya memastikan desain siap cetak?', 'Gunakan tahap Review untuk memeriksa spesifikasi dan estimasi sebelum checkout.'],
    ['Apakah preview 3D menggantikan proof cetak?', 'Preview membantu memahami bentuk dan material, tapi tahap Review tetap diperlukan.'],
    ['Kapan estimasi harga diperbarui?', 'Otomatis saat spesifikasi dasar atau finishing diubah.'],
  ];
  const { sectionRef: scrollSectionRef, activeIndex, registerItem } = useScrollSelectedIndex(questions.length);

  return (
    <section ref={(el) => {
      (sectionRef as React.MutableRefObject<HTMLElement | null>).current = el;
      (scrollSectionRef as React.MutableRefObject<HTMLElement | null>).current = el;
    }} id="faq" className="border-y border-brand-300 bg-brand-100 px-4 py-24 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.22fr_0.78fr] lg:gap-20">
        <div className="section-fade-up border-t border-brand-300">
          {questions.map(([question, answer], index) => {
            const isOpen = openIndex === index;
            const isActive = activeIndex === index;
            const contentId = `faq-answer-${index}`;

            return (
              <motion.article
                ref={registerItem(index)}
                key={question}
                animate={{ backgroundColor: isActive ? '#171717' : 'rgba(0,0,0,0)' }}
                transition={{ duration: reducedMotion ? 0.01 : 0.35, ease: EDITORIAL_EASE }}
                className="border-b border-brand-300 px-4 sm:px-5"
              >
                <button
                  type="button"
                  className={`flex w-full items-center justify-between gap-6 py-5 text-left text-base font-semibold transition-colors ${isActive ? 'text-brand-50 hover:text-accent-300' : 'text-brand-900 hover:text-accent-600'}`}
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                >
                  <span>{question}</span>
                  <svg className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`} viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2.75v10.5M2.75 8h10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={contentId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reducedMotion ? 0.01 : 0.24, ease: EDITORIAL_EASE }}
                      className="overflow-hidden"
                    >
                      <p className={`max-w-2xl pb-5 text-sm leading-relaxed ${isActive ? 'text-brand-300' : 'text-brand-600'}`}>{answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })}
        </div>
        <div className="section-fade-up lg:sticky lg:top-28 lg:self-start">
          <h2 className="max-w-sm font-serif text-3xl font-bold leading-[0.96] tracking-[-0.04em] text-brand-900 sm:text-4xl">Yang perlu Anda tahu sebelum mulai.</h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-brand-600 sm:text-base">Jawaban ringkas untuk membantu keputusan.</p>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const isInView = useInView(sectionRef, { once: false, amount: 0.45 });

  return (
    <section ref={sectionRef} className="bg-brand-900 px-4 py-24 text-brand-50 sm:px-6">
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0.01 : 0.65, ease: EDITORIAL_EASE }}
        className="mx-auto max-w-3xl text-center"
      >
        <h2 className="font-serif text-4xl font-bold tracking-[-0.04em] md:text-5xl">
          <MaskedRevealLines
            lines={['Buat buku hardcover', 'impianmu sekarang.']}
            play={isInView}
            primaryCoverClassName="bg-brand-50"
            secondaryCoverClassName="bg-brand-900"
          />
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base text-brand-300 md:text-lg">
          Mulai dari Rp25.000 — rancang kover dan bahan dalam hitungan menit dengan hasil cetak premium.
        </p>
        <div className="pt-8">
          <Link
            href="/customize"
            className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-8 py-4 text-base font-bold text-brand-950 transition-colors hover:bg-brand-200"
          >
            <span>Mulai Desain Sekarang</span>
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 8h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

function FooterSection() {
  const footerRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const isInView = useInView(footerRef, { once: false, amount: 0.45 });

  return (
    <footer ref={footerRef} className="overflow-hidden border-t border-brand-800 bg-brand-950 px-6 pb-8 pt-12 text-brand-300">
      <div className="mx-auto max-w-7xl">
        <div className="border-b border-brand-800 pb-10">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-300">Buku yang terasa personal</p>
          <div className="max-w-3xl font-serif text-5xl font-bold leading-[0.82] tracking-[-0.065em] text-brand-50 sm:text-7xl lg:text-8xl">
            <MaskedRevealLines
              lines={['Booxury.']}
              play={isInView}
              primaryCoverClassName="bg-brand-50"
              secondaryCoverClassName="bg-brand-950"
            />
          </div>
        </div>
        <div className="flex flex-col gap-5 pt-7 text-xs sm:flex-row sm:items-center sm:justify-between">
          <motion.p
            initial={reducedMotion ? false : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reducedMotion ? 0.01 : 0.5, delay: reducedMotion ? 0 : 0.16, ease: EDITORIAL_EASE }}
          >
            © {new Date().getFullYear()} Booxury — Custom Hardcover Notebook Platform.
          </motion.p>
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reducedMotion ? 0.01 : 0.5, delay: reducedMotion ? 0 : 0.24, ease: EDITORIAL_EASE }}
            className="flex items-center gap-4"
          >
            <Link href="/admin" className="transition-colors hover:text-brand-50">Admin Portal</Link>
            <span className="h-3 w-px bg-brand-700" aria-hidden="true" />
            <span>Demo: <code>demo@booxury.local</code></span>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-brand-50/20">
      <NavigationBar />
      <HeroSection />
      <Interactive3DScrollSection />
      <FeatureCardsSection />
      <ProcessSection />
      <FAQSection />
      <CTASection />
      <FooterSection />
    </main>
  );
}
