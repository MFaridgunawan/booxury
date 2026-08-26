'use client';
import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { MeshStandardMaterialParameters } from 'three';
import {
  buildMaterial,
  buildEdgeMaterial,
  CORNER_RADIUS,
  SIZE_DIMS,
  HEADBAND_COLORS,
  RIBBON_COLORS,
  PAPER_COLORS,
  ENDPAPER_COLORS,
  COVER_PARAMS,
  COVER_COLOR,
} from './book-materials';
import type { CoverFinish, EdgeFinish, CornerShape } from './book-materials';

const MM_TO_UNITS = 0.01; // 1mm = 0.01 scene units
const BOARD_THICKNESS = 0.022; // ~2.2mm board thickness in scene units

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
  layout?: 'plain' | 'lined'; // Inside page layout
  paperCode?: string;         // Paper stock code (BOOK72, HVS80, etc.)
  endpaperCode?: string;      // Endpaper code
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  coverOpenAngle?: number; // 0 (closed) to Math.PI (open)
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
  layout = 'plain',
  paperCode = 'BOOK72',
  endpaperCode = 'ENDPLAIN',
  autoRotate = false,
  autoRotateSpeed = 0.3,
  coverOpenAngle = 0,
}: HardcoverModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [loadedTexture, setLoadedTexture] = useState<THREE.Texture | null>(null);

  const dims = SIZE_DIMS[sizeCode] ?? SIZE_DIMS.A5;
  const w = mmToUnits(dims.widthMm);
  const h = mmToUnits(dims.heightMm);
  const spineW = Math.max(0.04, mmToUnits(spineWidthMm));
  const boardT = BOARD_THICKNESS;
  const radius = CORNER_RADIUS[cornerShape] ?? 0;

  const currentTextureRef = useRef<THREE.Texture | null>(null);
  const pageTextureRef = useRef<THREE.Texture | null>(null);

  // Load dynamic cover texture when coverTextureUrl changes
  useEffect(() => {
    if (!coverTextureUrl) {
      setLoadedTexture(null);
      return;
    }

    let isCurrent = true;
    const loader = new THREE.TextureLoader();
    loader.load(
      coverTextureUrl,
      (tex) => {
        if (!isCurrent) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.needsUpdate = true;

        if (currentTextureRef.current && currentTextureRef.current !== tex) {
          currentTextureRef.current.dispose();
        }
        currentTextureRef.current = tex;
        setLoadedTexture(tex);
      },
      undefined,
      (err) => {
        console.warn('Failed to load cover texture in 3D scene:', err);
      }
    );

    return () => {
      isCurrent = false;
    };
  }, [coverTextureUrl]);

  // Clean up textures ONLY on component unmount
  useEffect(() => {
    return () => {
      if (currentTextureRef.current) currentTextureRef.current.dispose();
      if (pageTextureRef.current) pageTextureRef.current.dispose();
    };
  }, []);

  // Materials
  const finishParams = useMemo(() => {
    return buildMaterial({
      coverFinish,
      edgeFinish,
      cornerShape,
      hasDustJacket,
      headbandCode,
      ribbonCodes,
      spineWidthMm,
      sizeCode,
    });
  }, [coverFinish, edgeFinish, cornerShape, hasDustJacket, headbandCode, ribbonCodes, spineWidthMm, sizeCode]);

  // Page edge finish PBR params
  const edgeParams = useMemo(() => buildEdgeMaterial(edgeFinish), [edgeFinish]);

  // Procedural inside page texture (lined / plain + paper color)
  const pagePaperColor = paperCode ? PAPER_COLORS[paperCode] ?? '#f8f4e6' : '#f8f4e6';
  const endpaperColor = endpaperCode ? ENDPAPER_COLORS[endpaperCode] ?? '#f5eedc' : '#f5eedc';

  const pageTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 724;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Background paper color
    ctx.fillStyle = pagePaperColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Left gutter shadow for realism
    const grad = ctx.createLinearGradient(0, 0, 42, 0);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.12)');
    grad.addColorStop(0.3, 'rgba(0, 0, 0, 0.04)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 42, canvas.height);

    if (layout === 'lined') {
      // Horizontal ruled lines
      ctx.strokeStyle = 'rgba(70, 95, 130, 0.28)';
      ctx.lineWidth = 1.4;
      const startY = 65;
      const lineSpacing = 26;
      const numLines = Math.floor((canvas.height - 110) / lineSpacing);

      for (let i = 0; i < numLines; i++) {
        const y = startY + i * lineSpacing;
        ctx.beginPath();
        ctx.moveTo(35, y);
        ctx.lineTo(canvas.width - 25, y);
        ctx.stroke();
      }

      // Vertical left margin line (classic notebook rule)
      ctx.strokeStyle = 'rgba(215, 65, 65, 0.32)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(72, 35);
      ctx.lineTo(72, canvas.height - 35);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    pageTextureRef.current = tex;
    return tex;
  }, [layout, pagePaperColor]);

  // Auto rotation
  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * autoRotateSpeed;
    }
  });

  const headbandColor = headbandCode ? HEADBAND_COLORS[headbandCode] ?? '#b71c1c' : null;

  // Page block dimensions (slightly recessed inside cover boards for realistic hardcover look)
  const squareOverhang = 0.015; // 1.5mm standard overhang
  const pageW = Math.max(0.1, w - squareOverhang * 2);
  const pageH = Math.max(0.1, h - squareOverhang * 2);
  const pageT = Math.max(0.02, spineW - 0.004);

  // Position constants
  const spineX = -w / 2 + boardT / 2;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* ── Back Cover Board — hinged at spine, opens to the LEFT ───────────── */}
      <group position={[spineX, 0, 0]} rotation={[0, coverOpenAngle, 0]}>
        <group position={[-w / 2, 0, 0]}>
          <RoundedBox
            args={[w, h, boardT]}
            radius={radius}
            smoothness={4}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial {...finishParams} />
          </RoundedBox>
          {/* Inside back endpaper (visible when book is open) */}
          <mesh position={[0, 0, boardT / 2 + 0.0005]}>
            <planeGeometry args={[w * 0.96, h * 0.96]} />
            <meshStandardMaterial color={endpaperColor} roughness={0.92} metalness={0.0} />
          </mesh>
        </group>
      </group>

      {/* ── Page Block — fans open, hinged at spine ─────────────────────────── */}
      <BookPages
        pageW={pageW}
        pageH={pageH}
        pageT={pageT}
        spineW={spineW}
        totalSheets={12}
        coverOpenAngle={coverOpenAngle}
        pageTexture={pageTexture}
        pagePaperColor={pagePaperColor}
        endpaperColor={endpaperColor}
        spineX={spineX}
        edgeParams={edgeParams}
      />

      {/* ── Front Cover Board — hinged at spine, opens to the RIGHT ──────────── */}
      <group position={[spineX, 0, 0]} rotation={[0, -coverOpenAngle, 0]}>
        <group position={[w / 2, 0, 0]}>
          <RoundedBox
            args={[w, h, boardT]}
            radius={radius}
            smoothness={4}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial {...finishParams} />
          </RoundedBox>

          {/* Front Face Canvas Artwork Layer (Pixel-perfect 2D to 3D sync) */}
          {loadedTexture && (
            <mesh position={[0, 0, boardT / 2 + 0.0008]}>
              <planeGeometry args={[w - radius * 0.1, h - radius * 0.1]} />
              <meshStandardMaterial
                map={loadedTexture}
                roughness={finishParams.roughness ?? 0.85}
                metalness={finishParams.metalness ?? 0.01}
                toneMapped={false}
              />
            </mesh>
          )}

          {/* Inside front endpaper (visible when book is open) */}
          <mesh position={[0, 0, -boardT / 2 - 0.0005]}>
            <planeGeometry args={[w * 0.96, h * 0.96]} />
            <meshStandardMaterial color={endpaperColor} roughness={0.92} metalness={0.0} />
          </mesh>
        </group>
      </group>

      {/* ── Spine (Left Edge: -X) — static at center, between both covers ── */}
      <mesh position={[spineX, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[boardT, h, spineW]} />
        <meshStandardMaterial {...finishParams} />
      </mesh>

      {/* ── Headband (Top of spine) — visible when book is open ─── */}
      {headbandColor && (
        <mesh position={[spineX, pageH / 2 + 0.004, 0]} castShadow>
          <boxGeometry args={[boardT * 1.2, 0.008, pageT * 0.85]} />
          <meshStandardMaterial color={headbandColor} roughness={0.7} metalness={0.1} />
        </mesh>
      )}

      {/* ── Tailband (Bottom of spine) ────────── */}
      {headbandColor && (
        <mesh position={[spineX, -pageH / 2 - 0.004, 0]} castShadow>
          <boxGeometry args={[boardT * 1.2, 0.008, pageT * 0.85]} />
          <meshStandardMaterial color={headbandColor} roughness={0.7} metalness={0.1} />
        </mesh>
      )}

      {/* ── Ribbon Marker(s) — attached to spine, hang out from top of pages ── */}
      {ribbonCodes.slice(0, 2).map((code, i) => {
        const color = RIBBON_COLORS[code] ?? '#b71c1c';
        const zOffset = 0.01 + i * 0.02;
        const yTop = pageH / 2 + 0.008;
        return (
          <RibbonMarker
            key={`${code}-${i}`}
            color={color}
            startX={spineX + 0.005}
            startY={yTop}
            startZ={zOffset}
            bookHeight={h}
            bookWidth={w}
          />
        );
      })}

      {/* ── Dust Jacket (Wrap-around Paper Cover) ─────── */}
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

// Individual page sheets that fan open when cover opens.
// Architecture: each page is hinged at the spine (X = spineX).
// - Page i=0 glued to back cover, rotates with back cover (+openAngle = opens LEFT)
// - Page i=last glued to front cover, rotates with front cover (-openAngle = opens RIGHT)
// - Middle pages fan out progressively, forming a smooth dome/arch shape
function BookPages({
  pageW,
  pageH,
  pageT,
  spineW,
  totalSheets,
  coverOpenAngle,
  pageTexture,
  pagePaperColor,
  endpaperColor,
  spineX,
  edgeParams,
}: {
  pageW: number;
  pageH: number;
  pageT: number;
  spineW: number;
  totalSheets: number;
  coverOpenAngle: number;
  pageTexture: THREE.CanvasTexture | THREE.Texture | null;
  pagePaperColor: string;
  endpaperColor: string;
  spineX: number;
  edgeParams: MeshStandardMaterialParameters;
}) {
  // Cap at ~162° (90% of pi) to keep pages from clipping with covers
  const openAngle = Math.min(coverOpenAngle, Math.PI * 0.9);

  return (
    <group>
      {Array.from({ length: totalSheets }).map((_, i) => {
        // t = 0 → page glued to BACK cover (opens LEFT, +rotationY)
        // t = 1 → page glued to FRONT cover (opens RIGHT, -rotationY)
        // t = 0.5 → page near spine, doesn't move much
        const t = totalSheets <= 1 ? 0.5 : i / (totalSheets - 1);

        // Linear fan: pages spread smoothly from -openAngle (front side)
        //             through 0 (middle, near spine) to +openAngle (back side)
        const rotationY = (0.5 - t) * 2 * openAngle;

        // Each page slightly thinner than total page block
        const sheetThickness = (pageT / totalSheets) * 0.95;

        // Page sits at spine, extends to the RIGHT (positive X)
        // When it rotates, it pivots cleanly around the spine
        return (
          <group
            key={i}
            position={[spineX, 0, 0]}
            rotation={[0, rotationY, 0]}
          >
            <group position={[pageW / 2, 0, 0]}>
              {/* Page sheet body — thin box showing edge color */}
              <mesh castShadow receiveShadow>
                <boxGeometry args={[pageW, pageH, sheetThickness]} />
                <meshStandardMaterial {...edgeParams} />
              </mesh>

              {/* Top surface of page — shows layout (lined/plain) */}
              <mesh position={[0, 0, sheetThickness / 2 + 0.0004]}>
                <planeGeometry args={[pageW * 0.99, pageH * 0.98]} />
                <meshStandardMaterial
                  map={pageTexture ?? undefined}
                  color={pagePaperColor}
                  roughness={0.96}
                  metalness={0.0}
                />
              </mesh>

              {/* Bottom surface — same paper color */}
              <mesh position={[0, 0, -(sheetThickness / 2 + 0.0004)]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[pageW * 0.99, pageH * 0.98]} />
                <meshStandardMaterial
                  color={pagePaperColor}
                  roughness={0.97}
                  metalness={0.0}
                />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
}

// Organic draping Ribbon Marker
function RibbonMarker({
  color,
  startX,
  startY,
  startZ,
  bookHeight,
  bookWidth,
}: {
  color: string;
  startX: number;
  startY: number;
  startZ: number;
  bookHeight: number;
  bookWidth: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime;
      meshRef.current.rotation.z = Math.sin(t * 1.8 + startX * 10) * 0.03;
      meshRef.current.rotation.x = Math.sin(t * 1.4 + startZ * 5) * 0.02;
    }
  });

  return (
    <group position={[startX + 0.08, startY - bookHeight * 0.45, startZ + 0.008]}>
      <mesh ref={meshRef} castShadow>
        <planeGeometry args={[0.022, bookHeight * 0.9, 12, 1]} />
        <meshStandardMaterial
          color={color}
          roughness={0.5}
          metalness={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// Dust jacket wrap
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
  const jacketW = width * 0.85;
  const jacketH = height + 0.008;
  const jacketT = 0.003;
  const frontZ = spineWidth / 2 + boardThickness + jacketT;
  const backZ = -spineWidth / 2 - boardThickness - jacketT;
  const spineX = -width / 2 + boardThickness / 2;

  return (
    <group>
      {/* Front Jacket Sheet */}
      <mesh position={[-width / 2 + jacketW / 2 + 0.01, 0, frontZ]}>
        <planeGeometry args={[jacketW, jacketH]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.35}
          metalness={0.0}
          transparent
          opacity={0.88}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Spine Jacket Sheet */}
      <mesh position={[spineX - 0.002, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[spineWidth + boardThickness * 2 + jacketT * 2, jacketH]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.35}
          metalness={0.0}
          transparent
          opacity={0.88}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Back Jacket Sheet */}
      <mesh position={[-width / 2 + jacketW / 2 + 0.01, 0, backZ]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[jacketW, jacketH]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.35}
          metalness={0.0}
          transparent
          opacity={0.88}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
