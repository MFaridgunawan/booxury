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

// Singleton state — prevents 2 R3F Canvas instances from mounting simultaneously
// (which causes WebGL context crash: "Cannot read properties of null (reading 'alpha')")
let _canvasActive = false;
let _canvasQueue: Array<() => void> = [];
function reserveCanvasSlot(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!_canvasActive) {
      _canvasActive = true;
      resolve(true);
    } else {
      _canvasQueue.push(() => resolve(true));
      // Timeout fallback — release slot after 30s if queue stalls
      setTimeout(() => {
        const idx = _canvasQueue.indexOf(() => resolve(true));
        if (idx >= 0) {
          _canvasQueue.splice(idx, 1);
          resolve(true);
        }
      }, 30_000);
    }
  });
}
function releaseCanvasSlot() {
  const next = _canvasQueue.shift();
  if (next) {
    // Let next requester go on next tick
    setTimeout(next, 50);
  } else {
    _canvasActive = false;
  }
}

function LandingCanvasInner({ mode = 'hero' }: { mode?: 'hero' | 'scroll-section' }) {
  const [showCanvas, setShowCanvas] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const slotReleased = useRef(false);

  // Detect reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Reserve slot + mount 3D canvas after LCP + idle
  useEffect(() => {
    if (reducedMotion) return;

    let active = true;
    let rafId: number;
    let cleanup: (() => void) | undefined;

    async function mountCanvas() {
      const granted = await reserveCanvasSlot();
      if (!granted || !active) return;

      // Stagger mount: hero gets priority (immediate), scroll-section waits for hero to settle
      const delay = mode === 'scroll-section' ? 2000 : 0;

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        const idleId = window.requestIdleCallback(
          () => {
            const timerId = setTimeout(() => {
              if (active) {
                setShowCanvas(true);
                setIsReady(true);
                rafId = requestAnimationFrame(() => {
                  if (canvasMountRef.current) {
                    canvasMountRef.current.style.opacity = '1';
                  }
                });
              }
            }, delay);
            cleanup = () => clearTimeout(timerId);
          },
          { timeout: 1500 }
        );
        cleanup = cleanup
          ? () => { window.cancelIdleCallback(idleId); cleanup!(); }
          : () => window.cancelIdleCallback(idleId);
      } else {
        const timerId = setTimeout(() => {
          if (active) {
            setShowCanvas(true);
            setIsReady(true);
            rafId = requestAnimationFrame(() => {
              if (canvasMountRef.current) {
                canvasMountRef.current.style.opacity = '1';
              }
            });
          }
        }, 300 + delay);
        cleanup = () => clearTimeout(timerId);
      }
    }

    mountCanvas();

    return () => {
      active = false;
      if (rafId) cancelAnimationFrame(rafId);
      cleanup?.();
      if (!slotReleased.current && isReady) {
        slotReleased.current = true;
        releaseCanvasSlot();
      }
    };
  }, [reducedMotion, mode, isReady]);

  if (reducedMotion || !showCanvas) {
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

export default function LandingCanvasWrapper({ mode = 'hero' }: { mode?: 'hero' | 'scroll-section' }) {
  return <LandingCanvasInner mode={mode} />;
}
