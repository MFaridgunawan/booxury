'use client';

import { useEffect, useRef, useState } from 'react';
import type { MotionValue } from 'motion/react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { HardcoverModel } from '@booxury/three';
import * as THREE from 'three';
import { BookStaticFallback } from './book-static-fallback';

interface LandingCanvasProps {
  reducedMotion?: boolean;
  mode?: 'hero' | 'scroll-section';
  scrollProgress?: MotionValue<number>;
  coverColor?: string;
}

function SoftGroundShadow() {
  return (
    <mesh position={[0, -1.14, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.34, 0.68, 1]} renderOrder={-1}>
      <circleGeometry args={[1, 48]} />
      <meshBasicMaterial color="#4a4036" transparent opacity={0.17} depthWrite={false} />
    </mesh>
  );
}

function ScrollDrivenBook({
  reducedMotion,
  mode = 'hero',
  scrollProgress,
  coverColor = '#f5f1e9',
}: {
  reducedMotion: boolean;
  mode?: 'hero' | 'scroll-section';
  scrollProgress?: MotionValue<number>;
  coverColor?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera, invalidate } = useThree();
  const mouse = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);
  const visualProgressRef = useRef(0);
  const currentOpenAngle = useRef(0);
  const lastRenderedOpenAngle = useRef(0);
  const [openAngle, setOpenAngle] = useState(0);

  useEffect(() => {
    if (mode !== 'scroll-section' || !scrollProgress) return;

    const syncProgress = (nextProgress: number) => {
      scrollRef.current = nextProgress;
      invalidate();
    };

    syncProgress(scrollProgress.get());
    return scrollProgress.on('change', syncProgress);
  }, [invalidate, mode, scrollProgress]);

  useEffect(() => {
    if (mode === 'scroll-section' && scrollProgress) return;

    const onScroll = () => {
      if (mode === 'scroll-section') {
        const section = document.getElementById('eksplorasi');
        if (!section) return;
        const rect = section.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        scrollRef.current = Math.max(0, Math.min(1, total > 0 ? -rect.top / total : 0));
        return;
      }

      const total = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current = Math.max(0, Math.min(1, total > 0 ? window.scrollY / total : 0));
    };

    const onMouseMove = (event: MouseEvent) => {
      mouse.current.x = (event.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    if (mode === 'hero') window.addEventListener('mousemove', onMouseMove, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (mode === 'hero') window.removeEventListener('mousemove', onMouseMove);
    };
  }, [mode, scrollProgress]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const hasExternalProgress = mode === 'scroll-section' && scrollProgress !== undefined;
    if (hasExternalProgress) {
      visualProgressRef.current = scrollRef.current;
    } else {
      const response = reducedMotion || mode !== 'scroll-section' ? 1 : 1 - Math.exp(-delta * 1.65);
      visualProgressRef.current = THREE.MathUtils.lerp(visualProgressRef.current, scrollRef.current, response);
    }

    const progress = mode === 'scroll-section' ? visualProgressRef.current : scrollRef.current;
    const time = state.clock.elapsedTime;
    const floatY = mode === 'hero' ? Math.sin(time * 1.4) * 0.03 : 0;
    const floatRotation = mode === 'hero' ? Math.cos(time * 1.1) * 0.02 : 0;
    const mouseInfluence = mode === 'hero' ? 0.8 : 0;
    const targetMouseRotY = mouse.current.x * 0.35 * mouseInfluence;
    const targetMouseRotX = -mouse.current.y * 0.2 * mouseInfluence;

    let targetRotY = 0.35 + targetMouseRotY;
    let targetRotX = 0.12 + floatRotation + targetMouseRotX;
    let targetRotZ = 0;
    let targetOpen = 0;
    let targetPosX = 0;
    let targetPosY = floatY;
    let coverToInside = 0;
    let insideToSpine = 0;
    let spineToDetails = 0;

    if (mode === 'scroll-section') {
      coverToInside = THREE.MathUtils.smoothstep(progress, 0.22, 0.4);
      insideToSpine = THREE.MathUtils.smoothstep(progress, 0.52, 0.68);
      spineToDetails = THREE.MathUtils.smoothstep(progress, 0.78, 0.93);
      const storyPhase = progress < 0.24 ? 0 : progress < 0.54 ? 1 : progress < 0.77 ? 2 : 3;
      const phasePositions = [-1.14, 1.42, -0.92, 0.92] as const;

      targetRotY = THREE.MathUtils.lerp(0.28, 0.08, coverToInside);
      targetRotY = THREE.MathUtils.lerp(targetRotY, Math.PI / 2, insideToSpine);
      targetRotY = THREE.MathUtils.lerp(targetRotY, Math.PI * 1.5, spineToDetails);
      targetRotX = 0.12;
      targetRotZ = THREE.MathUtils.lerp(0, -0.08, spineToDetails);
      targetOpen = 2.88 * coverToInside * (1 - insideToSpine);
      // Horizontal composition is phase-driven, not scroll-scrubbed. This
      // leaves each detail stable until the next story chapter takes over.
      targetPosX = phasePositions[storyPhase];
      targetPosY = THREE.MathUtils.smoothstep(progress, 0.78, 0.89) * 0.17;
    } else {
      targetRotY = 0.35 + Math.sin(time * 0.6) * 0.22 + targetMouseRotY;
    }

    const targetCamZ = mode === 'scroll-section'
      ? THREE.MathUtils.lerp(THREE.MathUtils.lerp(4.75, 5.08, coverToInside), 4.5, insideToSpine)
      : 3.8;

    if (hasExternalProgress) {
      groupRef.current.rotation.set(targetRotX, targetRotY, targetRotZ);
      const nextPositionX = reducedMotion
        ? targetPosX
        : THREE.MathUtils.damp(groupRef.current.position.x, targetPosX, 8, delta);
      groupRef.current.position.set(nextPositionX, targetPosY, 0);
      camera.position.z = targetCamZ;
      currentOpenAngle.current = targetOpen;
      if (Math.abs(targetPosX - nextPositionX) > 0.001) invalidate();
    } else {
      const rate = mode === 'scroll-section' ? 2.1 : 4.5;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, delta * rate);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, delta * rate);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotZ, delta * rate);
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetPosX, delta * rate);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetPosY, delta * rate);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, delta * (mode === 'scroll-section' ? 1.8 : 3));
      currentOpenAngle.current = THREE.MathUtils.lerp(currentOpenAngle.current, targetOpen, delta * rate);
    }

    camera.lookAt(0, 0, 0);
    if (Math.abs(currentOpenAngle.current - lastRenderedOpenAngle.current) > 0.01) {
      lastRenderedOpenAngle.current = currentOpenAngle.current;
      setOpenAngle(currentOpenAngle.current);
    }
  });

  return (
    <group ref={groupRef}>
      <HardcoverModel
        sizeCode="A5"
        spineWidthMm={18}
        coverFinish="doff"
        coverColor={coverColor}
        coverLabel="Booxury"
        edgeFinish="gilded_gold"
        cornerShape="round"
        headbandCode="hb_hitam"
        ribbonCodes={['rb_merah']}
        ribbonSway={mode !== 'scroll-section'}
        layout="lined"
        paperCode="BOOK72"
        coverOpenAngle={reducedMotion ? 0 : openAngle}
        hasDustJacket={false}
        autoRotate={false}
      />
      <SoftGroundShadow />
    </group>
  );
}

export function LandingCanvas({ reducedMotion = false, mode = 'hero', scrollProgress, coverColor = '#f5f1e9' }: LandingCanvasProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (reducedMotion || !mounted) return <StaticFallback />;

  return (
    <div className="h-full w-full">
      <Canvas
        frameloop={mode === 'scroll-section' ? 'demand' : 'always'}
        dpr={mode === 'scroll-section' ? [1, 1.25] : [1, 1.5]}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
        camera={{ position: [0, 0, 3.8], fov: mode === 'scroll-section' ? 38 : 34 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.72} />
        <directionalLight position={[5, 7, 5]} intensity={1.35} color="#fffaf0" />
        <directionalLight position={[-4, 3, -3]} intensity={0.42} color="#d9c5b2" />
        <pointLight position={[0, 2.2, 3]} intensity={0.32} color="#c69a5d" />
        <ScrollDrivenBook reducedMotion={reducedMotion} mode={mode} scrollProgress={scrollProgress} coverColor={coverColor} />
      </Canvas>
    </div>
  );
}

export function StaticFallback() {
  return <BookStaticFallback />;
}
