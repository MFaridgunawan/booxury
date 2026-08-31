'use client';
import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import {
  buildMaterial,
  buildEdgeMaterial,
  CORNER_RADIUS,
  SIZE_DIMS,
  HEADBAND_COLORS,
  RIBBON_COLORS,
  PAPER_COLORS,
  ENDPAPER_COLORS,
} from './book-materials';
import type { CoverFinish, EdgeFinish, CornerShape } from './book-materials';

const MM_TO_UNITS = 0.01; // 1mm = 0.01 scene units
const BOARD_THICKNESS = 0.022; // ~2.2mm greyboard thickness in scene units

export interface HardcoverModelProps {
  coverFinish?: CoverFinish;
  coverColor?: string;
  edgeFinish?: EdgeFinish;
  cornerShape?: CornerShape;
  hasDustJacket?: boolean;
  headbandCode?: string;
  ribbonCodes?: string[];
  ribbonSway?: boolean;
  spineWidthMm?: number;
  sizeCode?: string;
  coverTextureUrl?: string;
  coverLabel?: string;
  layout?: 'plain' | 'lined';
  paperCode?: string;
  endpaperCode?: string;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  coverOpenAngle?: number; // 0 (closed) to Math.PI (open)
}

function mmToUnits(mm: number) {
  return mm * MM_TO_UNITS;
}

export function HardcoverModel({
  coverFinish = 'doff',
  coverColor,
  edgeFinish = 'plain',
  cornerShape = 'square',
  hasDustJacket = false,
  headbandCode,
  ribbonCodes = [],
  ribbonSway = true,
  spineWidthMm = 12,
  sizeCode = 'A5',
  coverTextureUrl,
  coverLabel,
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

  // Book engineering proportions
  const jointW = 0.035; // French groove hinge gap
  const boardW = Math.max(0.2, w - jointW);
  const spineX = -w / 2;
  const overhang = 0.018; // 1.8mm cover overhang over pages
  const pageW = Math.max(0.1, boardW - overhang);
  const pageH = Math.max(0.1, h - overhang * 2);
  const pageT = Math.max(0.02, spineW - 0.006);

  const currentTextureRef = useRef<THREE.Texture | null>(null);
  const pageTextureRef = useRef<THREE.Texture | null>(null);

  // Load dynamic cover texture
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

  // Clean up Three.js resources on unmount and on dependency changes
  useEffect(() => {
    return () => {
      if (currentTextureRef.current) {
        currentTextureRef.current.dispose();
        currentTextureRef.current = null;
      }
      if (pageTextureRef.current) {
        pageTextureRef.current.dispose();
        pageTextureRef.current = null;
      }
    };
  }, []);

  // Cover material
  const finishParams = useMemo(() => {
    return buildMaterial({
      coverFinish,
      coverColor,
      edgeFinish,
      cornerShape,
      hasDustJacket,
      headbandCode,
      ribbonCodes,
      spineWidthMm,
      sizeCode,
    });
  }, [coverFinish, coverColor, edgeFinish, cornerShape, hasDustJacket, headbandCode, ribbonCodes, spineWidthMm, sizeCode]);

  // A tiny transparent canvas carries the default studio title without a network font request.
  // Uploaded artwork still takes priority over this label.
  const coverLabelTexture = useMemo(() => {
    if (!coverLabel || typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 1260;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const brass = '#d1b27a';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = brass;
    ctx.globalAlpha = 0.82;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(210, 376);
    ctx.lineTo(690, 376);
    ctx.moveTo(210, 892);
    ctx.lineTo(690, 892);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = brass;
    ctx.font = '600 66px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(coverLabel.toUpperCase(), canvas.width / 2, 635);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, [coverLabel]);

  useEffect(() => () => coverLabelTexture?.dispose(), [coverLabelTexture]);

  // Page edge finish PBR params
  const edgeParams = useMemo(() => buildEdgeMaterial(edgeFinish, paperCode), [edgeFinish, paperCode]);

  // Procedural inside notebook page texture (with authentic Memo/Date header & ruled lines)
  const pagePaperColor = paperCode ? PAPER_COLORS[paperCode] ?? '#ebdcb2' : '#ebdcb2';
  const endpaperColor = endpaperCode ? ENDPAPER_COLORS[endpaperCode] ?? '#eee5cf' : '#eee5cf';

  const pageTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 840;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Paper Background Color
    ctx.fillStyle = pagePaperColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Subtle organic paper grain
    ctx.fillStyle = 'rgba(0, 0, 0, 0.012)';
    for (let i = 0; i < 500; i++) {
      const rx = Math.random() * canvas.width;
      const ry = Math.random() * canvas.height;
      ctx.fillRect(rx, ry, 1.2, 1.2);
    }

    // 3. Left spine gutter depth shadow
    const grad = ctx.createLinearGradient(0, 0, 56, 0);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.16)');
    grad.addColorStop(0.3, 'rgba(0, 0, 0, 0.04)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 56, canvas.height);

    if (layout === 'lined') {
      // 4. Notebook Header Bar (Memo No. & Date) as shown in reference image
      ctx.fillStyle = 'rgba(80, 95, 110, 0.75)';
      ctx.font = '13px sans-serif';
      ctx.fillText('Memo No.', 50, 48);
      ctx.fillText('Date:', canvas.width - 190, 48);

      // Memo line
      ctx.strokeStyle = 'rgba(120, 135, 150, 0.4)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(118, 50);
      ctx.lineTo(210, 50);
      ctx.stroke();

      // Date line
      ctx.beginPath();
      ctx.moveTo(canvas.width - 150, 50);
      ctx.lineTo(canvas.width - 45, 50);
      ctx.stroke();

      // Days of week indicators (Mo Tu We Th Fr Sa Su)
      const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'rgba(100, 115, 130, 0.6)';
      days.forEach((day, idx) => {
        const x = 235 + idx * 26;
        ctx.strokeStyle = 'rgba(140, 155, 170, 0.45)';
        ctx.strokeRect(x - 2, 38, 20, 14);
        ctx.fillText(day, x + 2, 49);
      });

      // Top separator line
      ctx.strokeStyle = 'rgba(120, 135, 150, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(45, 68);
      ctx.lineTo(canvas.width - 40, 68);
      ctx.stroke();

      // Horizontal ruled lines
      ctx.strokeStyle = 'rgba(90, 115, 145, 0.28)';
      ctx.lineWidth = 1.2;
      const startY = 102;
      const lineSpacing = 30;
      const numLines = Math.floor((canvas.height - 130) / lineSpacing);

      for (let i = 0; i < numLines; i++) {
        const y = startY + i * lineSpacing;
        ctx.beginPath();
        ctx.moveTo(45, y);
        ctx.lineTo(canvas.width - 40, y);
        ctx.stroke();
      }

      // Vertical left margin line (classic notebook rule)
      ctx.strokeStyle = 'rgba(220, 70, 70, 0.35)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(85, 68);
      ctx.lineTo(85, canvas.height - 40);
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
  const isOpen = coverOpenAngle > 0.05;
  const coverArtwork = loadedTexture ?? coverLabelTexture;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* ── Spine (Left edge: -X) ────────────────────────────────────────────── */}
      <group position={[spineX + boardT * 0.5, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[boardT, h, spineW + boardT * 2]} />
          <meshStandardMaterial {...finishParams} />
        </mesh>
      </group>

      {/* ── Back Cover Board (Bottom/Back at -Z) ──────────────────────────────── */}
      <group position={[spineX + jointW, 0, -spineW / 2 - boardT / 2]}>
        <group position={[boardW / 2, 0, 0]}>
          <RoundedBox
            args={[boardW, h, boardT]}
            radius={radius}
            smoothness={4}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial {...finishParams} />
          </RoundedBox>

          {/* Inside back endpaper */}
          <mesh position={[0, 0, boardT / 2 + 0.0006]}>
            <planeGeometry args={[boardW * 0.98, h * 0.98]} />
            <meshStandardMaterial color={endpaperColor} roughness={0.92} metalness={0.0} />
          </mesh>
        </group>
      </group>

      {/* ── Main Book Block (Pages & Edges) ─────────────────────────────────── */}
      <group position={[spineX + jointW + pageW / 2 + 0.005, 0, 0]}>
        {/* Main solid page block showing edge finish (gilded gold, sprayed, plain) */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[pageW, pageH, pageT]} />
          <meshStandardMaterial {...edgeParams} />
        </mesh>

        {/* Top page surface (Right page of open spread) */}
        <mesh position={[0, 0, pageT / 2 + 0.0006]}>
          <planeGeometry args={[pageW * 0.985, pageH * 0.985]} />
          <meshStandardMaterial
            map={pageTexture ?? undefined}
            color={pagePaperColor}
            roughness={0.95}
            metalness={0.0}
          />
        </mesh>
      </group>

      {/* ── Front Cover Board (Hinged at spine, opens forward to the left) ────── */}
      <group
        position={[spineX + jointW, 0, spineW / 2 + boardT / 2]}
        rotation={[0, -coverOpenAngle, 0]}
      >
        <group position={[boardW / 2, 0, 0]}>
          <RoundedBox
            args={[boardW, h, boardT]}
            radius={radius}
            smoothness={4}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial {...finishParams} />
          </RoundedBox>

          {/* Front Face Custom Artwork Layer (2D Canvas sync) */}
          {coverArtwork && (
            <mesh position={[0, 0, boardT / 2 + 0.0008]}>
              <planeGeometry args={[boardW - radius * 0.1, h - radius * 0.1]} />
              <meshStandardMaterial
                map={coverArtwork}
                roughness={finishParams.roughness ?? 0.85}
                metalness={finishParams.metalness ?? 0.01}
                // Canvas artwork intentionally has a transparent background.
                // This lets a later base-colour change remain visible below it.
                transparent
                alphaTest={0.01}
                toneMapped={false}
              />
            </mesh>
          )}

          {/* Inside front endpaper (visible when cover swings open) */}
          <mesh position={[0, 0, -boardT / 2 - 0.0006]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[boardW * 0.98, h * 0.98]} />
            <meshStandardMaterial color={endpaperColor} roughness={0.92} metalness={0.0} />
          </mesh>

          {/* Left Page (Front flyleaf page visible when book is opened) */}
          {isOpen && (
            <mesh position={[0, 0, -boardT / 2 - 0.0012]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[pageW * 0.97, pageH * 0.97]} />
              <meshStandardMaterial
                map={pageTexture ?? undefined}
                color={pagePaperColor}
                roughness={0.95}
                metalness={0.0}
              />
            </mesh>
          )}
        </group>
      </group>

      {/* ── Headband & Tailband (Top & Bottom of spine) ──────────────────────── */}
      {headbandColor && (
        <>
          {/* Top Headband */}
          <mesh position={[spineX + 0.016, pageH / 2 + 0.004, 0]} castShadow>
            <boxGeometry args={[boardT * 1.3, 0.012, pageT * 0.92]} />
            <meshStandardMaterial color={headbandColor} roughness={0.65} metalness={0.12} />
          </mesh>
          {/* Bottom Tailband */}
          <mesh position={[spineX + 0.016, -pageH / 2 - 0.004, 0]} castShadow>
            <boxGeometry args={[boardT * 1.3, 0.012, pageT * 0.92]} />
            <meshStandardMaterial color={headbandColor} roughness={0.65} metalness={0.12} />
          </mesh>
        </>
      )}

      {/* ── Satin Ribbon Marker(s) (Matching user reference photo!) ───────────── */}
      {ribbonCodes.slice(0, 2).map((code, i) => {
        const color = RIBBON_COLORS[code] ?? '#b71c1c';
        return (
          <RealisticRibbonMarker
            key={`${code}-${i}`}
            color={color}
            isOpen={isOpen}
            spineHingeX={spineX + jointW}
            pageW={pageW}
            pageH={pageH}
            pageT={pageT}
            index={i}
            animate={ribbonSway}
          />
        );
      })}

      {/* ── Dust Jacket (Wrap-around Paper Cover) ─────────────────────────────── */}
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

// Narrow satin marker with a relaxed, asymmetric drape.
function RealisticRibbonMarker({
  color,
  isOpen,
  spineHingeX,
  pageW,
  pageH,
  pageT,
  index,
  animate,
}: {
  color: string;
  isOpen: boolean;
  spineHingeX: number;
  pageW: number;
  pageH: number;
  pageT: number;
  index: number;
  animate: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const xOffset = index * 0.04;

  // Parametric curved spline geometry for a fabric-like marker.
  const geometry = useMemo(() => {
    let points: THREE.Vector3[] = [];

    if (isOpen) {
      // Open book: an asymmetric S-curve settles across the right page before the tail drops.
      const topZ = pageT / 2 + 0.004;
      points = [
        new THREE.Vector3(spineHingeX + 0.02 + xOffset, pageH / 2 + 0.01, topZ),
        new THREE.Vector3(spineHingeX + 0.07 + xOffset, pageH * 0.34, topZ + 0.006),
        new THREE.Vector3(spineHingeX + 0.17 + xOffset, pageH * 0.10, topZ + 0.012),
        new THREE.Vector3(spineHingeX + 0.08 + xOffset, -pageH * 0.12, topZ + 0.014),
        new THREE.Vector3(spineHingeX + 0.21 + xOffset, -pageH * 0.31, topZ + 0.018),
        new THREE.Vector3(spineHingeX + 0.13 + xOffset, -pageH / 2 - 0.045, topZ + 0.02),
        new THREE.Vector3(spineHingeX + 0.20 + xOffset, -pageH / 2 - 0.11, topZ + 0.016),
      ];
    } else {
      // Closed book: a compact fabric wave keeps the tail away from a rigid vertical drop.
      points = [
        new THREE.Vector3(spineHingeX + 0.03 + xOffset, pageH / 2 + 0.012, 0.0),
        new THREE.Vector3(spineHingeX + 0.08 + xOffset, pageH * 0.23, 0.012),
        new THREE.Vector3(spineHingeX + 0.02 + xOffset, -pageH * 0.02, 0.022),
        new THREE.Vector3(spineHingeX + 0.12 + xOffset, -pageH * 0.27, 0.03),
        new THREE.Vector3(spineHingeX + 0.05 + xOffset, -pageH / 2 - 0.04, 0.038),
        new THREE.Vector3(spineHingeX + 0.13 + xOffset, -pageH / 2 - 0.11, 0.032),
      ];
    }

    const curve = new THREE.CatmullRomCurve3(points);
    // Extrude as a thin flat satin strip. This geometry is memoized, never rebuilt per frame.
    const shape = new THREE.Shape();
    const ribbonWidth = 0.009;
    const ribbonThick = 0.0007;
    shape.moveTo(-ribbonWidth / 2, -ribbonThick / 2);
    shape.lineTo(ribbonWidth / 2, -ribbonThick / 2);
    shape.lineTo(ribbonWidth / 2, ribbonThick / 2);
    shape.lineTo(-ribbonWidth / 2, ribbonThick / 2);
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
      steps: 28,
      bevelEnabled: false,
      extrudePath: curve,
    });
  }, [isOpen, spineHingeX, pageH, pageT, xOffset]);

  // Dispose procedural ribbon geometry on unmount / dependency change
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrame((state) => {
    if (animate && meshRef.current) {
      const t = state.clock.elapsedTime;
      // A restrained, irregular-feeling fabric sway without geometry churn.
      meshRef.current.position.z = Math.sin(t * 1.08 + index * 0.9) * 0.002;
      meshRef.current.position.x = Math.sin(t * 0.72 + index * 1.7) * 0.0025;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow>
      <meshStandardMaterial
        color={color}
        roughness={0.42}
        metalness={0.05}
        side={THREE.DoubleSide}
      />
    </mesh>
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
  const jacketW = width * 0.88;
  const jacketH = height + 0.008;
  const jacketT = 0.003;
  const frontZ = spineWidth / 2 + boardThickness + jacketT;
  const backZ = -spineWidth / 2 - boardThickness - jacketT;
  const spineX = -width / 2 + boardThickness / 2;

  return (
    <group>
      {/* Front Jacket Sheet */}
      <mesh position={[-width / 2 + jacketW / 2 + 0.02, 0, frontZ]}>
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
      <mesh position={[-width / 2 + jacketW / 2 + 0.02, 0, backZ]} rotation={[0, Math.PI, 0]}>
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
