'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { StaticFallback } from './landing-canvas';

gsap.registerPlugin(ScrollTrigger);

function LandingCanvasInner() {
  const [showCanvas, setShowCanvas] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  // Detect reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Mount 3D canvas after LCP + idle
  useEffect(() => {
    if (reducedMotion) return;

    const id = requestIdleCallback(
      () => {
        setShowCanvas(true);
        requestAnimationFrame(() => {
          if (canvasMountRef.current) {
            canvasMountRef.current.style.opacity = '1';
          }
        });
      },
      { timeout: 2000 }
    );

    return () => cancelIdleCallback(id);
  }, [reducedMotion]);

  // GSAP scroll animation for hero
  useEffect(() => {
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      if (heroRef.current) {
        gsap.to(heroRef.current, {
          y: -60,
          opacity: 0,
          ease: 'power2.in',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });
      }
    });

    return () => ctx.revert();
  }, [reducedMotion]);

  if (reducedMotion || !showCanvas) {
    return <StaticFallback />;
  }

  const LandingCanvas = dynamic(
    () => import('./landing-canvas').then((m) => m.LandingCanvas),
    {
      ssr: false,
      loading: () => <StaticFallback />,
    }
  );

  return (
    <div
      ref={canvasMountRef}
      className="w-full h-full"
      style={{ opacity: 0, transition: 'opacity 1.5s ease' }}
    >
      <LandingCanvas reducedMotion={reducedMotion} />
    </div>
  );
}

export default function LandingCanvasWrapper() {
  return <LandingCanvasInner />;
}
