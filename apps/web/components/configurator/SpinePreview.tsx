'use client';
import { useMemo } from 'react';
import { calculateSpine } from '@booxury/spine-calc';

const SIZE_DIMS: Record<string, { widthMm: number; heightMm: number }> = {
  A5: { widthMm: 148, heightMm: 210 },
  B5: { widthMm: 176, heightMm: 250 },
  A6: { widthMm: 105, heightMm: 148 },
};

const PAPER_CALIPER: Record<string, number> = {
  BOOK57: 0.075, BOOK72: 0.090, BOOK90: 0.115,
  HVS70: 0.088, HVS80: 0.105, HVS100: 0.130,
  ART120: 0.100, ART150: 0.130, MATT120: 0.110, MATT150: 0.140,
};

const BOARD_THICKNESS: Record<string, number> = {
  BOARD14: 1.4, BOARD18: 1.8, BOARD20: 2.0, BOARD25: 2.5,
};

const ENDPAPER_THICKNESS: Record<string, number> = {
  ENDFLAT: 0.10, ENDPLAIN: 0.14, ENDPAT: 0.18,
};

const PREVIEW_SCALE = 0.6; // px per mm for display

interface SpinePreviewProps {
  sizeCode: string;
  pages: number;
  paperCode: string;
  boardCode: string;
  endpaperCode: string;
}

export function SpinePreview({ sizeCode, pages, paperCode, boardCode, endpaperCode }: SpinePreviewProps) {
  const dims = SIZE_DIMS[sizeCode] ?? SIZE_DIMS.A5;
  const paperCaliperMm = PAPER_CALIPER[paperCode] ?? 0.105;
  const boardThicknessMm = BOARD_THICKNESS[boardCode] ?? 2.0;
  const endpaperThicknessMm = ENDPAPER_THICKNESS[endpaperCode] ?? 0.14;

  const spine = useMemo(() =>
    calculateSpine({
      pages,
      paperCaliperMm,
      boardThicknessMm,
      endpaperThicknessMm,
      hingeAllowanceMm: 2.0,
    }, dims),
  [pages, paperCaliperMm, boardThicknessMm, endpaperThicknessMm, dims]
  );

  const backPx = Math.round(dims.widthMm * PREVIEW_SCALE);
  const spinePx = Math.round(spine.spineWidthMm * PREVIEW_SCALE);
  const heightPx = Math.round(dims.heightMm * PREVIEW_SCALE);
  const totalPx = backPx + spinePx + backPx;

  const coverColors = ['#8B7355', '#A0522D', '#CD853F'];
  const spineColor = '#6B5344';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h3 className="font-semibold text-sm text-gray-700 mb-4">Preview Ukuran Buku</h3>

      {/* Scale label */}
      <div className="text-xs text-gray-400 mb-2">Skala: 1mm = {PREVIEW_SCALE}px</div>

      {/* Book visual */}
      <div className="flex items-stretch rounded overflow-hidden border border-gray-300 shadow-sm mb-4" style={{ height: heightPx }}>
        {/* Back panel */}
        <div
          className="flex-shrink-0 flex flex-col items-center justify-center text-white text-xs font-bold select-none"
          style={{ width: backPx, background: coverColors[0] }}
          title={`Back panel: ${dims.widthMm} × ${dims.heightMm}mm`}
        >
          <span>BACK</span>
          <span className="text-[9px] font-normal opacity-75">{dims.widthMm}×{dims.heightMm}</span>
        </div>
        {/* Spine */}
        <div
          className="flex-shrink-0 flex flex-col items-center justify-center text-white text-xs font-bold border-x border-gray-700 select-none"
          style={{ width: spinePx, background: spineColor }}
          title={`Spine: ${spine.spineWidthMm}mm`}
        >
          <span className="tracking-widest text-[9px]">SPINE</span>
          <span className="text-[8px] font-normal opacity-75">{spine.spineWidthMm}mm</span>
        </div>
        {/* Front panel */}
        <div
          className="flex-shrink-0 flex flex-col items-center justify-center text-white text-xs font-bold select-none"
          style={{ width: backPx, background: coverColors[1] }}
          title={`Front panel: ${dims.widthMm} × ${dims.heightMm}mm`}
        >
          <span>FRONT</span>
          <span className="text-[9px] font-normal opacity-75">{dims.widthMm}×{dims.heightMm}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 rounded-lg p-2">
          <span className="text-gray-500">Lebar punggung</span>
          <p className="font-bold text-brand-800">{spine.spineWidthMm} mm</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <span className="text-gray-500">Tebal halaman</span>
          <p className="font-bold text-brand-800">{pages} hal</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <span className="text-gray-500">Kertas</span>
          <p className="font-bold text-brand-800">{paperCaliperMm}mm/lembar</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <span className="text-gray-500">Board</span>
          <p className="font-bold text-brand-800">{boardThicknessMm}mm</p>
        </div>
      </div>

      {/* Total sheet dimensions */}
      <div className="mt-3 text-xs text-gray-500 bg-brand-50 rounded-lg p-2">
        <span className="font-medium">Ukuran lembar kover:</span>{' '}
        {spine.totalSheetWidthMm} × {spine.totalSheetHeightMm} mm
        <span className="ml-2 text-gray-400">(termasuk bleed {spine.bleedMm}mm + turn-in {spine.turnInMm}mm)</span>
      </div>
    </div>
  );
}
