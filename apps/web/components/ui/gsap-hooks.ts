'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { gsap as GsapType } from 'gsap';

gsap.registerPlugin(ScrollTrigger);

// useGSAP — scoped GSAP context with automatic cleanup
// Use this instead of raw useEffect for any GSAP animation
export function useGSAP(
  callback: (self: gsap.Context) => void,
  deps: React.DependencyList = []
) {
  const ctxRef = useRef<gsap.Context | null>(null);

  useEffect(() => {
    // Create a new context each time — gsap.context() returns a reusable ctx
    ctxRef.current = gsap.context(callback);

    return () => {
      ctxRef.current?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ctxRef;
}

// useScrollTrigger — creates a scroll-linked animation
export function useScrollTrigger(
  triggerRef: React.RefObject<HTMLElement | null>,
  animation: (
    animation: gsap.core.Animation,
    trigger: ScrollTrigger
  ) => void,
  options: ScrollTrigger.Vars = {}
) {
  const stRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    if (!triggerRef.current) return;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
    stRef.current = ScrollTrigger.create({
      trigger: triggerRef.current,
      animation: animation as any,
      start: 'top center',
      end: 'bottom center',
      ...options,
    });

    return () => {
      stRef.current?.kill();
    };
  }, [triggerRef, animation, options]);

  return stRef;
}
