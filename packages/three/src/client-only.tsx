'use client';
import dynamic from 'next/dynamic';
import type { ComponentProps, ReactElement, ReactNode } from 'react';

// Generic SSR-safe wrapper — code-splits R3F components into a separate chunk
// and only loads them in the browser. Always use this for anything that imports
// @react-three/fiber, @react-three/drei, or three.
type LoadingComponent = () => ReactElement;

export function ClientOnly<P extends object>(
  loader: () => Promise<{ default: React.ComponentType<P> }>,
  loading?: LoadingComponent
) {
  const Loading = loading ?? (() => (
    <div
      className="animate-pulse rounded-xl bg-brand-100"
      style={{ width: '100%', height: '100%', minHeight: 200 }}
      aria-hidden="true"
    />
  ));

  return dynamic(loader, {
    ssr: false,
    loading: Loading,
  });
}

// Hook version — for when you need the component reference
export function useClientOnly<P extends object>(
  loader: () => Promise<{ default: React.ComponentType<P> }>
) {
  const Component = dynamic(loader, { ssr: false });
  return Component;
}

// Reduced-motion aware wrapper
export function MotionSensitiveCanvas({
  children,
  reducedMotion = false,
  fallback,
}: {
  children: ReactNode;
  reducedMotion?: boolean;
  fallback?: ReactNode;
}) {
  if (reducedMotion) {
    return <>{fallback ?? null}</>;
  }
  return <>{children}</>;
}
