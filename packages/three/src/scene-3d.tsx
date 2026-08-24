'use client';
import { useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  Stage,
  PerformanceMonitor,
  AdaptiveDpr,
  AdaptiveEvents,
  BakeShadows,
  Environment,
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { HardcoverModel } from './hardcover-model';
import { OrbitRig, CinematicRig } from './camera-rigs';
import gsap from 'gsap';
import type { CoverFinish, EdgeFinish, CornerShape } from './book-materials';

gsap.registerPlugin();

export interface Scene3DProps {
  // Book geometry
  coverFinish?: CoverFinish;
  edgeFinish?: EdgeFinish;
  cornerShape?: CornerShape;
  hasDustJacket?: boolean;
  headbandCode?: string;
  ribbonCodes?: string[];
  spineWidthMm?: number;
  sizeCode?: string;
  coverTextureUrl?: string;

  // Camera mode
  mode?: 'orbit' | 'cinematic';
  phase?: string;

  // Performance
  dpr?: [number, number];

  // Auto rotation (landing page)
  autoRotate?: boolean;
  autoRotateSpeed?: number;

  // Postprocessing
  bloomIntensity?: number;
}

export function Scene3D({
  coverFinish = 'doff',
  edgeFinish = 'plain',
  cornerShape = 'square',
  hasDustJacket = false,
  headbandCode,
  ribbonCodes = [],
  spineWidthMm = 12,
  sizeCode = 'A5',
  coverTextureUrl,
  mode = 'orbit',
  phase = 'base',
  dpr = [1, 2],
  autoRotate = false,
  autoRotateSpeed = 0.3,
  bloomIntensity = 0.3,
}: Scene3DProps) {
  const [dprValue, setDpr] = useState(dpr[0]);

  return (
    <Canvas
      frameloop="always"
      dpr={dprValue}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        alpha: true,
      }}
      shadows
      style={{ width: '100%', height: '100%' }}
    >
      {/* Performance management */}
      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(dpr[1] ?? 2)}
        bounds={() => [55, 90]}
      />
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-3, 2, -2]} intensity={0.3} />

      {/* Stage — handles environment + shadows */}
      <Stage
        environment="studio"
        intensity={0.5}
        adjustCamera={false}
        shadows={{ type: 'accumulative', bias: -0.0001 }}
      >
        <HardcoverModel
          coverFinish={coverFinish}
          edgeFinish={edgeFinish}
          cornerShape={cornerShape}
          hasDustJacket={hasDustJacket}
          headbandCode={headbandCode}
          ribbonCodes={ribbonCodes}
          spineWidthMm={spineWidthMm}
          sizeCode={sizeCode}
          coverTextureUrl={coverTextureUrl}
          autoRotate={autoRotate}
          autoRotateSpeed={autoRotateSpeed}
        />
      </Stage>

      {/* Camera */}
      {mode === 'orbit' ? (
        <OrbitRig />
      ) : (
        <CinematicRig phase={phase} />
      )}

      {/* Postprocessing */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.7}
          luminanceSmoothing={0.3}
          intensity={bloomIntensity}
        />
        <Vignette eskil={false} offset={0.15} darkness={0.4} />
      </EffectComposer>
    </Canvas>
  );
}
