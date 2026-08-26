'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { StaticFallback } from './landing-canvas';

const LandingCanvas = dynamic(
  () => import('./landing-canvas').then((m) => m.LandingCanvas),
  {
    ssr: false,
    loading: () => <StaticFallback />,
  }
);

// Module-level singleton: tracks which mode currently owns the active Canvas slot.
// Only ONE R3F Canvas can be mounted at a time to avoid WebGL context crashes.
type Mode = 'hero' | 'scroll-section';
type Waiter = { mode: Mode; resolve: (granted: boolean) => void };
let _activeMode: Mode | null = null;
const _waiters: Waiter[] = [];

function requestSlot(mode: Mode): Promise<boolean> {
  return new Promise((resolve) => {
    if (_activeMode === null) {
      _activeMode = mode;
      resolve(true);
    } else if (_activeMode === mode) {
      resolve(true);
    } else {
      _waiters.push({ mode, resolve });
      setTimeout(() => {
        const idx = _waiters.findIndex(w => w.resolve === resolve);
        if (idx >= 0) {
          _waiters.splice(idx, 1);
          resolve(false);
        }
      }, 60_000);
    }
  });
}

function releaseSlot(mode: Mode) {
  if (_activeMode !== mode) return;
  // Hero gets priority — if hero waiting, give it back
  const heroIdx = _waiters.findIndex(w => w.mode === 'hero');
  const scrollIdx = _waiters.findIndex(w => w.mode === 'scroll-section');
  const nextIdx = heroIdx >= 0 ? heroIdx : scrollIdx;
  if (nextIdx >= 0) {
    const next = _waiters.splice(nextIdx, 1)[0];
    _activeMode = next.mode;
    setTimeout(() => next.resolve(true), 50);
  } else {
    _activeMode = null;
  }
}

function LandingCanvasInner({ mode = 'hero', visible }: { mode?: 'hero' | 'scroll-section'; visible: boolean }) {
  const [showCanvas, setShowCanvas] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const hasSlot = useRef(false);

  // Detect reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Reserve slot + mount 3D canvas after LCP + idle — only when visible
  useEffect(() => {
    if (reducedMotion || !visible) return;

    let active = true;
    let rafId: number;
    let mountTimer: ReturnType<typeof setTimeout> | null = null;

    async function mountCanvas() {
      const granted = await requestSlot(mode);
      if (!granted || !active) return;
      hasSlot.current = true;

      const showAfterMount = () => {
        if (!active) return;
        setShowCanvas(true);
        rafId = requestAnimationFrame(() => {
          if (canvasMountRef.current) {
            canvasMountRef.current.style.opacity = '1';
          }
        });
      };

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(showAfterMount, { timeout: 1500 });
      } else {
        mountTimer = setTimeout(showAfterMount, 600);
      }
    }

    mountCanvas();

    return () => {
      active = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (mountTimer) clearTimeout(mountTimer);
      if (hasSlot.current) {
        hasSlot.current = false;
        releaseSlot(mode);
        setShowCanvas(false);
      }
    };
  }, [reducedMotion, mode, visible]);

  if (reducedMotion || !visible || !showCanvas) {
    return <StaticFallback />;
  }

  return (
    <div
      ref={canvasMountRef}
      className="w-full h-full"
      style={{ opacity: 0, transition: 'opacity 1.0s ease-out' }}
    >
      <LandingCanvas reducedMotion={reducedMotion} mode={mode} />
    </div>
  );
}

/**
 * Public wrapper with IntersectionObserver. Only mounts the 3D canvas when
 * its container is visible in viewport, and unmounts when scrolled away.
 * This prevents the 2-canvas crash AND saves GPU when not on screen.
 */
function LandingCanvasWrapper({ mode = 'hero' }: { mode?: 'hero' | 'scroll-section' }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(mode === 'hero'); // Hero is visible by default

  useEffect(() => {
    if (!ref.current || mode === 'hero') return;

    // Only observe for scroll-section
    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0]?.isIntersecting ?? false;
        setVisible(isVisible);
      },
      { threshold: 0.15 } // Mount when 15% visible
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [mode]);

  return (
    <div ref={ref} className="w-full h-full">
      <LandingCanvasInner mode={mode} visible={visible} />
    </div>
  );
}

export default LandingCanvasWrapper;
