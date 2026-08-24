'use client';
import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

// Camera positions per wizard phase
export const CAMERA_POSITIONS: Record<string, { position: [number, number, number]; target: [number, number, number] }> = {
  base:   { position: [0, 0, 3.5], target: [0, 0, 0] },
  cover:  { position: [1.2, 0.3, 2.8], target: [0.3, 0, 0] },
  finish: { position: [0.5, 0.8, 2.5], target: [0, 0, 0] },
  review: { position: [0, 0.2, 3.0], target: [0, 0, 0] },
};

// Orbit controls for interactive wizard preview
export function OrbitRig() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 3.5]} fov={30} />
      <OrbitControls
        enablePan={false}
        minDistance={1.5}
        maxDistance={5}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.5}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  );
}

// Cinematic rig — GSAP-tweened camera with dolly/zoom, no user control
export function CinematicRig({
  phase,
  onComplete,
}: {
  phase: string;
  onComplete?: () => void;
}) {
  const { camera } = useThree();
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const targetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const config = CAMERA_POSITIONS[phase] ?? CAMERA_POSITIONS.base;
    const targetPos = new THREE.Vector3(...config.position);
    const targetLookAt = new THREE.Vector3(...config.target);

    // Kill any existing tween
    tweenRef.current?.kill();

    // Tween camera position
    tweenRef.current = gsap.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 1.2,
      ease: 'power2.inOut',
      onComplete: () => onComplete?.(),
    });

    // Tween look-at target
    gsap.to(targetRef.current, {
      x: targetLookAt.x,
      y: targetLookAt.y,
      z: targetLookAt.z,
      duration: 1.2,
      ease: 'power2.inOut',
    });

    return () => {
      tweenRef.current?.kill();
    };
  }, [phase, camera]);

  // Apply look-at every frame
  useFrame(() => {
    camera.lookAt(targetRef.current);
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={[0, 0, 3.5]}
      fov={30}
    />
  );
}

// Phase transition hook — returns a function to trigger cinematic transition
export function useCinematicTransition() {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));
  const ctxRef = useRef<gsap.Context | null>(null);

  const transition = (toPhase: string, duration = 1.0) => {
    const config = CAMERA_POSITIONS[toPhase] ?? CAMERA_POSITIONS.base;
    const targetPos = new THREE.Vector3(...config.position);
    const targetLookAt = new THREE.Vector3(...config.target);

    ctxRef.current?.revert();

    ctxRef.current = gsap.context(() => {
      gsap.to(camera.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration,
        ease: 'power2.inOut',
      });
      gsap.to(targetRef.current, {
        x: targetLookAt.x,
        y: targetLookAt.y,
        z: targetLookAt.z,
        duration,
        ease: 'power2.inOut',
      });
    });

    return () => ctxRef.current?.revert();
  };

  useFrame(() => {
    camera.lookAt(targetRef.current);
  });

  return { transition };
}
