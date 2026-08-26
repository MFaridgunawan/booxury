'use client';
import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

type OrbitControlsRef = React.ComponentRef<typeof OrbitControls>;

// Camera presets for Game-like character customization flow (Zoomed out for spacious framing)
export const CAMERA_POSITIONS: Record<
  string,
  { position: [number, number, number]; target: [number, number, number]; fov?: number }
> = {
  base:   { position: [0.85, 0.5, 4.3], target: [0, 0, 0], fov: 34 },
  inside: { position: [0.5, 0.5, 4.5], target: [0, 0.05, 0], fov: 36 },
  cover:  { position: [0, 0, 3.6], target: [0, 0, 0], fov: 34 },
  finish: { position: [-1.35, 0.55, 3.2], target: [-0.25, 0.05, 0], fov: 34 },
  spine:  { position: [-2.1, 0.0, 2.7], target: [-0.45, 0, 0], fov: 32 },
  edges:  { position: [1.6, -0.45, 2.9], target: [0.35, -0.1, 0], fov: 32 },
  ribbon: { position: [0.3, -1.2, 2.9], target: [0, -0.35, 0], fov: 32 },
  review: { position: [0.95, 0.45, 4.0], target: [0, 0, 0], fov: 34 },
};

// ── Cinematic Orbit Rig (Game-like Camera Transition with Free Orbit) ────────
export function CinematicOrbitRig({
  phase = 'base',
  autoRotate = false,
  autoRotateSpeed = 0.4,
}: {
  phase?: string;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsRef>(null);

  const targetPos = useRef<THREE.Vector3>(new THREE.Vector3(0.85, 0.5, 4.3));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const isTransitioning = useRef(true);
  const transitionProgress = useRef(0);

  // When phase changes, trigger a smooth game-like camera glide
  useEffect(() => {
    const config = CAMERA_POSITIONS[phase] ?? CAMERA_POSITIONS.base;
    targetPos.current.set(config.position[0], config.position[1], config.position[2]);
    targetLookAt.current.set(config.target[0], config.target[1], config.target[2]);
    isTransitioning.current = true;
    transitionProgress.current = 0;
  }, [phase]);

  useFrame((_, delta) => {
    if (isTransitioning.current) {
      transitionProgress.current += delta * 2.2; // ~0.8s transition
      const t = Math.min(1, transitionProgress.current);
      // Smooth cubic ease out
      const ease = 1 - Math.pow(1 - t, 3);

      camera.position.lerp(targetPos.current, ease * 0.15);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookAt.current, ease * 0.15);
        controlsRef.current.update();
      }

      if (t >= 1 && camera.position.distanceTo(targetPos.current) < 0.02) {
        isTransitioning.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={2.0}
      maxDistance={6.5}
      minPolarAngle={Math.PI / 8}
      maxPolarAngle={Math.PI / 1.4}
      dampingFactor={0.06}
      enableDamping
      autoRotate={autoRotate || phase === 'review'}
      autoRotateSpeed={autoRotateSpeed}
      onStart={() => {
        // User manually interacted: stop automatic transition
        isTransitioning.current = false;
      }}
    />
  );
}

// ── Legacy Orbit Rig ────────────────────────────────────────────────────────
export function OrbitRig({ autoRotate = false, autoRotateSpeed = 0.4 }: { autoRotate?: boolean; autoRotateSpeed?: number }) {
  return <CinematicOrbitRig phase="base" autoRotate={autoRotate} autoRotateSpeed={autoRotateSpeed} />;
}

// ── Pure Cinematic Rig (Non-interactive) ────────────────────────────────────
export function CinematicRig({ phase = 'base' }: { phase?: string }) {
  return <CinematicOrbitRig phase={phase} />;
}

// ── Landing Page Scroll-Driven 3D Rig ───────────────────────────────────────
export function LandingScrollRig({
  onScrollProgress,
}: {
  onScrollProgress?: (progress: { scrollY: number; openAngle: number }) => void;
}) {
  const { camera } = useThree();
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const current = Math.max(0, Math.min(1, total > 0 ? window.scrollY / total : 0));
      setScrollProgress(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useFrame((state) => {
    const p = scrollProgress; // 0.0 (top) -> 1.0 (bottom)
    const time = state.clock.elapsedTime;

    // Idle breathing float
    const floatY = Math.sin(time * 1.2) * 0.04;
    const floatRotX = Math.cos(time * 0.9) * 0.03;

    // Dynamic camera and book staging based on scroll progress:
    // Scroll 0.0 - 0.25 (Hero section): Center stage, subtle angle
    // Scroll 0.25 - 0.70 (Features section): Rotating to show spine, edges, and gold foil
    // Scroll 0.70 - 1.00 (CTA section): Turnaround & beauty pose
    const targetCamX = THREE.MathUtils.lerp(0, 0.4, p);
    const targetCamY = THREE.MathUtils.lerp(0.1, -0.1, p) + floatY;
    const targetCamZ = THREE.MathUtils.lerp(2.8, 3.2, p);

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.08);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.08);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.08);
    camera.lookAt(0, 0, 0);

    // Calculate dynamic cover open angle on scroll (opens gently around 40-70% scroll)
    let openAngle = 0;
    if (p > 0.25 && p < 0.75) {
      const openT = (p - 0.25) / 0.5;
      openAngle = Math.sin(openT * Math.PI) * 0.45; // up to ~25 degrees open
    }

    if (onScrollProgress) {
      onScrollProgress({ scrollY: p, openAngle });
    }
  });

  return null;
}

// ── Cinematic Transition Hook ───────────────────────────────────────────────
export function useCinematicTransition() {
  const { camera } = useThree();
  const transition = (toPhase: string) => {
    const config = CAMERA_POSITIONS[toPhase] ?? CAMERA_POSITIONS.base;
    camera.position.set(...config.position);
    camera.lookAt(...config.target);
  };
  return { transition };
}
