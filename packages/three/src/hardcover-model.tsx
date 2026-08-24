'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import {
  buildMaterial,
  CORNER_RADIUS,
  SIZE_DIMS,
  ENDPAPER_COLOR,
  PAGE_COLOR,
  HEADBAND_COLORS,
  RIBBON_COLORS,
} from './book-materials';
import type { MaterialInputs, CoverFinish, EdgeFinish, CornerShape } from './book-materials';

const MM_TO_UNITS = 0.01; // 1mm = 0.01 scene units
const BOARD_THICKNESS = 0.02; // 2mm board thickness in scene units

export interface HardcoverModelProps {
  coverFinish?: CoverFinish;
  edgeFinish?: EdgeFinish;
  cornerShape?: CornerShape;
  hasDustJacket?: boolean;
  headbandCode?: string;
  ribbonCodes?: string[];
  spineWidthMm?: number;
  sizeCode?: string;
  coverTextureUrl?: string; // URL or data URL from Konva canvas
  autoRotate?: boolean;
  autoRotateSpeed?: number;
}

// Convert mm dimensions to scene units
function mmToUnits(mm: number) {
  return mm * MM_TO_UNITS;
}

export function HardcoverModel({
  coverFinish = 'doff',
  edgeFinish = 'plain',
  cornerShape = 'square',
  hasDustJacket = false,
  headbandCode,
  ribbonCodes = [],
  spineWidthMm = 12,
  sizeCode = 'A5',
  coverTextureUrl,
  autoRotate = false,
  autoRotateSpeed = 0.3,
}: HardcoverModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  const dims = SIZE_DIMS[sizeCode] ?? SIZE_DIMS.A5;
  const w = mmToUnits(dims.widthMm);
  const h = mmToUnits(dims.heightMm);
  const spineW = mmToUnits(spineWidthMm);
  const boardT = BOARD_THICKNESS;
  const radius = CORNER_RADIUS[cornerShape];

  // Material params derived from finish
  const materialParams = useMemo(
    () => buildMaterial({ coverFinish, edgeFinish, cornerShape, hasDustJacket, headbandCode, ribbonCodes, spineWidthMm, sizeCode }),
    [coverFinish, edgeFinish, cornerShape, hasDustJacket, headbandCode, ribbonCodes, spineWidthMm, sizeCode]
  );

  // Auto rotation
  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * autoRotateSpeed;
    }
  });

  // Cover texture (from Konva canvas or empty)
  const coverMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      ...materialParams,
      map: coverTextureUrl ? undefined : undefined, // TODO: load texture via useTexture
    });
    return mat;
  }, [materialParams, coverTextureUrl]);

  const spineMaterial = useMemo(
    () => new THREE.MeshStandardMaterial(materialParams),
    [materialParams]
  );

  const pageMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: PAGE_COLOR, roughness: 0.95, metalness: 0 }),
    []
  );

  const endpaperMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: ENDPAPER_COLOR, roughness: 0.9, metalness: 0 }),
    []
  );

  const headbandColor = headbandCode ? HEADBAND_COLORS[headbandCode] ?? '#b71c1c' : null;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* ── Back cover board ───────────────────────────── */}
      <RoundedBox
        args={[w, h, boardT]}
        radius={radius}
        smoothness={4}
        position={[-spineW / 2 - boardT / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...materialParams} />
      </RoundedBox>

      {/* ── Front cover board ─────────────────────────── */}
      <RoundedBox
        args={[w, h, boardT]}
        radius={radius}
        smoothness={4}
        position={[spineW / 2 + boardT / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...materialParams} />
      </RoundedBox>

      {/* ── Spine board ──────────────────────────────── */}
      <RoundedBox
        args={[spineW, h, boardT]}
        radius={radius * 0.5}
        smoothness={4}
        position={[0, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...materialParams} color="#1a1208" />
      </RoundedBox>

      {/* ── Page block ───────────────────────────────── */}
      <mesh
        position={[spineW / 2 + boardT / 2 - 0.001, 0, boardT / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[w - boardT * 2, h - boardT * 2, spineW - boardT * 2]} />
        <primitive object={pageMaterial} attach="material" />
      </mesh>

      {/* ── Endpaper (front) ─────────────────────────── */}
      <mesh position={[spineW / 2 + boardT / 2 - 0.002, 0, boardT / 2]}>
        <boxGeometry args={[w - boardT * 2 + 0.004, h - boardT * 2 + 0.004, 0.004]} />
        <primitive object={endpaperMaterial} attach="material" />
      </mesh>

      {/* ── Headband (top of spine) ─────────────────── */}
      {headbandColor && (
        <mesh position={[0, h / 2 + 0.006, 0]}>
          <boxGeometry args={[spineW, 0.012, boardT]} />
          <meshStandardMaterial color={headbandColor} roughness={0.8} metalness={0.1} />
        </mesh>
      )}

      {/* ── Headband (bottom of spine) ─────────────── */}
      {headbandColor && (
        <mesh position={[0, -h / 2 - 0.006, 0]}>
          <boxGeometry args={[spineW, 0.012, boardT]} />
          <meshStandardMaterial color={headbandColor} roughness={0.8} metalness={0.1} />
        </mesh>
      )}

      {/* ── Ribbon markers ──────────────────────────── */}
      {ribbonCodes.slice(0, 2).map((code, i) => {
        const color = RIBBON_COLORS[code] ?? '#b71c1c';
        const xOffset = spineW / 2 + boardT / 2 - 0.001;
        const zPos = boardT / 2 - 0.005;
        const yOffset = -h / 4 + i * (h / 3);
        return (
          <RibbonFlutter
            key={code}
            color={color}
            position={[xOffset, yOffset, zPos]}
          />
        );
      })}

      {/* ── Dust jacket ────────────────────────────── */}
      {hasDustJacket && (
        <DustJacket
          width={w}
          height={h}
          spineWidth={spineW}
          boardThickness={boardT}
          radius={radius}
        />
      )}
    </group>
  );
}

// Ribbon flutter animation component
function RibbonFlutter({
  color,
  position,
}: {
  color: string;
  position: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime;
      meshRef.current.rotation.z = Math.sin(t * 2 + position[1] * 10) * 0.08;
      meshRef.current.rotation.x = Math.sin(t * 1.5 + position[1] * 5) * 0.04;
    }
  });

  return (
    <mesh ref={meshRef} position={position} castShadow>
      <planeGeometry args={[0.015, 0.35, 8, 1]} />
      <meshStandardMaterial color={color} roughness={0.7} metalness={0.05} side={THREE.DoubleSide} />
    </mesh>
  );
}

// Dust jacket — slightly larger than cover, transparent
function DustJacket({
  width,
  height,
  spineWidth,
  boardThickness,
  radius,
}: {
  width: number;
  height: number;
  spineWidth: number;
  boardThickness: number;
  radius: number;
}) {
  const jacketW = width + 0.02; // slight overhang
  const jacketH = height + 0.02;
  const jacketD = boardThickness * 0.3;
  const jacketRadius = radius + 0.002;

  return (
    <group>
      {/* Front flap */}
      <RoundedBox
        args={[jacketW, jacketH, jacketD]}
        radius={jacketRadius}
        smoothness={4}
        position={[spineWidth / 2 + boardThickness / 2 + jacketD / 2, 0, 0]}
      >
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.4}
          metalness={0.0}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </RoundedBox>
      {/* Spine flap */}
      <RoundedBox
        args={[spineWidth, jacketH, jacketD]}
        radius={jacketRadius}
        smoothness={4}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.4}
          metalness={0.0}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </RoundedBox>
      {/* Back flap */}
      <RoundedBox
        args={[jacketW, jacketH, jacketD]}
        radius={jacketRadius}
        smoothness={4}
        position={[-spineWidth / 2 - boardThickness / 2 - jacketD / 2, 0, 0]}
      >
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.4}
          metalness={0.0}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </RoundedBox>
    </group>
  );
}
