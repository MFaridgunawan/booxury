'use client';
import { useEffect, useRef, useState } from 'react';
import type { MotionValue } from 'motion/react';
import dynamic from 'next/dynamic';
import { BookStaticFallback } from './book-static-fallback';

const loadLandingCanvas = () => import('./landing-canvas').then((module) => module.LandingCanvas);

const LandingCanvas = dynamic(
  loadLandingCanvas,
  {
    ssr: false,
    loading: () => <BookStaticFallback />,
  }
);

interface LandingCanvasWrapperProps {
  mode?: 'hero' | 'scroll-section';
  scrollProgress?: MotionValue<number>;
  priority?: 'default' | 'stage';
  coverColor?: string;
}

type CanvasMode = NonNullable<LandingCanvasWrapperProps['mode']>;
let activeCanvasMode: CanvasMode | null = null;
const slotListeners = new Set<() => void>();

function claimCanvasSlot(mode: CanvasMode) {
  if (activeCanvasMode && activeCanvasMode !== mode) return false;
  activeCanvasMode = mode;
  return true;
}

function releaseCanvasSlot(mode: CanvasMode) {
  if (activeCanvasMode !== mode) return;
  activeCanvasMode = null;
  slotListeners.forEach((listener) => listener());
}

function LandingCanvasWrapper({ mode = 'hero', scrollProgress, priority = 'default', coverColor = '#f5f1e9' }: LandingCanvasWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hasCanvasSlot, setHasCanvasSlot] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries[0]?.isIntersecting ?? false;
        setVisible(isIntersecting);
      },
      { rootMargin: priority === 'stage' ? '240px 0px' : '160px 0px', threshold: 0.01 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [priority]);

  useEffect(() => {
    if (priority !== 'stage' || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        void loadLandingCanvas();
        observer.disconnect();
      },
      { rootMargin: '1200px 0px', threshold: 0.01 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [priority]);

  useEffect(() => {
    if (reducedMotion || !visible) {
      setHasCanvasSlot(false);
      return;
    }

    let ownsSlot = false;
    const requestSlot = () => {
      if (!claimCanvasSlot(mode)) return;
      ownsSlot = true;
      setHasCanvasSlot(true);
    };

    requestSlot();
    slotListeners.add(requestSlot);

    return () => {
      slotListeners.delete(requestSlot);
      if (ownsSlot) releaseCanvasSlot(mode);
      setHasCanvasSlot(false);
    };
  }, [mode, reducedMotion, visible]);

  useEffect(() => {
    if (!hasCanvasSlot) {
      setCanvasReady(false);
      return;
    }

    if (priority === 'stage') {
      setCanvasReady(true);
      return;
    }

    const timer = window.setTimeout(() => setCanvasReady(true), 180);
    return () => window.clearTimeout(timer);
  }, [hasCanvasSlot, priority]);

  if (reducedMotion) {
    return <BookStaticFallback />;
  }

  const bgStyle = { background: 'linear-gradient(145deg, #f5f4f0 0%, #ebe8e1 100%)' };

  return (
    <div ref={containerRef} className="w-full h-full relative" style={bgStyle}>
      {visible && hasCanvasSlot && canvasReady ? (
        <LandingCanvas reducedMotion={reducedMotion} mode={mode} scrollProgress={scrollProgress} coverColor={coverColor} />
      ) : (
        <BookStaticFallback />
      )}
    </div>
  );
}

export default LandingCanvasWrapper;
