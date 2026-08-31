'use client';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { HardcoverModel } from './hardcover-model';
import { CinematicOrbitRig } from './camera-rigs';
import type { CoverFinish, EdgeFinish, CornerShape } from './book-materials';

export interface Scene3DProps {
  // Book geometry
  coverFinish?: CoverFinish;
  coverColor?: string;
  edgeFinish?: EdgeFinish;
  cornerShape?: CornerShape;
  hasDustJacket?: boolean;
  headbandCode?: string;
  ribbonCodes?: string[];
  spineWidthMm?: number;
  sizeCode?: string;
  coverTextureUrl?: string;
  coverOpenAngle?: number;
  layout?: 'plain' | 'lined';
  paperCode?: string;
  endpaperCode?: string;

  // Camera mode
  mode?: 'orbit' | 'cinematic';
  phase?: string;

  // Performance
  dpr?: [number, number];

  // Auto rotation
  autoRotate?: boolean;
  autoRotateSpeed?: number;

  // Optional backward compatibility
  bloomIntensity?: number;
}
export function Scene3D({
  coverFinish = 'doff',
  coverColor,
  edgeFinish = 'plain',
  cornerShape = 'square',
  hasDustJacket = false,
  headbandCode,
  ribbonCodes = [],
  spineWidthMm = 12,
  sizeCode = 'A5',
  coverTextureUrl,
  coverOpenAngle = 0,
  layout = 'plain',
  paperCode = 'BOOK72',
  endpaperCode = 'ENDPLAIN',
  mode = 'orbit',
  phase = 'base',
  dpr = [1, 2],
  autoRotate = false,
  autoRotateSpeed = 0.3,
}: Scene3DProps) {
  return (
    <Canvas
      frameloop="always"
      dpr={[dpr[0], Math.min(dpr[1], 1.5)]}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        alpha: true,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
      }}
      camera={{ position: [2.6, 1.6, 4.4], fov: 34 }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Deliberately simple studio lighting: it is faster and avoids remote
          environment-map loading in the configurator sidebar. */}
      <ambientLight intensity={0.75} />
      <directionalLight
        position={[5, 7, 5]}
        intensity={1.4}
        color="#fffaf0"
      />
      <directionalLight
        position={[-5, 3, -3]}
        intensity={0.55}
        color="#e8f0fe"
      />
      <pointLight
        position={[0, -2.5, 2.5]}
        intensity={0.35}
        color="#ffd7a8"
      />
      <group position={[0, 0, 0]}>
        <HardcoverModel
          coverFinish={coverFinish}
          coverColor={coverColor}
          edgeFinish={edgeFinish}
          cornerShape={cornerShape}
          hasDustJacket={hasDustJacket}
          headbandCode={headbandCode}
          ribbonCodes={ribbonCodes}
          spineWidthMm={spineWidthMm}
          sizeCode={sizeCode}
          coverTextureUrl={coverTextureUrl}
          coverOpenAngle={coverOpenAngle}
          layout={layout}
          paperCode={paperCode}
          endpaperCode={endpaperCode}
          autoRotate={autoRotate}
          autoRotateSpeed={autoRotateSpeed}
        />
        <mesh position={[0, -1.16, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.7, 0.8, 1]} renderOrder={-1}>
          <circleGeometry args={[1, 48]} />
          <meshBasicMaterial color="#050505" transparent opacity={0.32} depthWrite={false} />
        </mesh>
      </group>

      <CinematicOrbitRig
        phase={phase}
        autoRotate={autoRotate}
        autoRotateSpeed={autoRotateSpeed}
      />
    </Canvas>
  );
}
