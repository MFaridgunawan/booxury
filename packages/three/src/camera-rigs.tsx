'use client';
import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

type OrbitControlsRef = React.ComponentRef<typeof OrbitControls>;

// Perfectly calibrated camera presets for 6 core angles + review with generous framing padding:
// 1. cover  - Front cover face-on view
// 2. inside - Open book elevated reading perspective showing pages, lines & paper color
// 3. base   - Iconic 3/4 beauty isometric perspective
// 4. spine  - Left spine & French groove joint view
// 5. edges  - Right fore-edge gilded/sprayed page block view
// 6. ribbon - Bookmark ribbon marker and headband close-up
export const CAMERA_POSITIONS: Record<
  string,
  { position: [number, number, number]; target: [number, number, number]; fov?: number }
> = {
  cover:  { position: [0.0, 0.0, 5.0], target: [0.0, 0.0, 0.0], fov: 34 },
  inside: { position: [-0.15, 2.2, 4.8], target: [-0.15, -0.05, 0.0], fov: 34 },
  base:   { position: [2.6, 1.6, 4.4], target: [0.0, 0.0, 0.0], fov: 34 },
  spine:  { position: [-4.6, 0.05, 0.6], target: [-0.7, 0.0, 0.0], fov: 34 },
  edges:  { position: [4.6, 0.05, 0.7], target: [0.7, 0.0, 0.0], fov: 34 },
  ribbon: { position: [0.2, -0.4, 4.4], target: [0.05, -0.2, 0.0], fov: 34 },
  review: { position: [2.4, 1.4, 4.8], target: [0.0, 0.0, 0.0], fov: 34 },
};

// ── Cinematic Orbit Rig (Smooth camera glide with free orbit & interactive zoom)
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

  const targetPos = useRef<THREE.Vector3>(new THREE.Vector3(2.6, 1.6, 4.4));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const isTransitioning = useRef(true);
  const transitionProgress = useRef(0);

  // When phase changes, trigger a smooth cinematic camera glide
  useEffect(() => {
    const config = CAMERA_POSITIONS[phase] ?? CAMERA_POSITIONS.base;
    targetPos.current.set(config.position[0], config.position[1], config.position[2]);
    targetLookAt.current.set(config.target[0], config.target[1], config.target[2]);
    isTransitioning.current = true;
    transitionProgress.current = 0;
  }, [phase]);

  useFrame((_, delta) => {
    if (isTransitioning.current) {
      transitionProgress.current += delta * 2.5; // ~0.7s transition
      const t = Math.min(1, transitionProgress.current);
      // Smooth cubic ease out
      const ease = 1 - Math.pow(1 - t, 3);

      camera.position.lerp(targetPos.current, ease * 0.18);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookAt.current, ease * 0.18);
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
      enablePan={true}
      enableZoom={true}
      zoomSpeed={0.8}
      minDistance={1.6}
      maxDistance={9.0}
      minPolarAngle={Math.PI / 12}
      maxPolarAngle={Math.PI / 1.25}
      dampingFactor={0.06}
      enableDamping
      autoRotate={autoRotate || phase === 'review'}
      autoRotateSpeed={autoRotateSpeed}
      onStart={() => {
        // Stop transition immediately on manual interaction
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

