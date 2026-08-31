export interface SpineInput {
  pages: number;
  paperCaliperMm: number;
  boardThicknessMm: number;
  endpaperThicknessMm: number;
  hingeAllowanceMm: number;
}

export interface SpineOutput {
  spineWidthMm: number;
  totalSheetWidthMm: number;
  totalSheetHeightMm: number;
  backPanelWidthMm: number;
  frontPanelWidthMm: number;
  bleedMm: number;
  turnInMm: number;
  /** Minimum valid pages for hardcover (40 sheets = 80 pages) */
  minPages: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const round4 = (n: number) => Math.round(n * 10000) / 10000;

const TURN_IN_MM = 15;
const BLEED_MM = 3;
/** Minimum 80 pages = 40 sheets for structural integrity of hardcover */
const MIN_PAGES = 80;
/** Signature-based binding: pages must be divisible by 4 */
const PAGE_STEP = 4;

export function calculateSpine(
  input: SpineInput,
  bookDims: { widthMm: number; heightMm: number }
): SpineOutput {
  const spineWidthMm =
    (input.pages / 2) * input.paperCaliperMm +
    input.boardThicknessMm * 2 +
    input.endpaperThicknessMm * 2 +
    input.hingeAllowanceMm;

  return {
    spineWidthMm: round2(spineWidthMm),
    backPanelWidthMm: bookDims.widthMm,
    frontPanelWidthMm: bookDims.widthMm,
    totalSheetWidthMm: round2(
      bookDims.widthMm + spineWidthMm + bookDims.widthMm
      + TURN_IN_MM * 2
      + BLEED_MM * 2
    ),
    totalSheetHeightMm: round2(
      bookDims.heightMm + TURN_IN_MM * 2 + BLEED_MM * 2
    ),
    bleedMm: BLEED_MM,
    turnInMm: TURN_IN_MM,
    minPages: MIN_PAGES,
  };
}

/** Convert gsm to caliper (mm) using approximate industry standard ratio */
export function gsmToCaliper(gsm: number, type: 'bookpaper' | 'hvs' | 'art' | 'matt'): number {
  const ratios: Record<string, number> = {
    bookpaper: 1.3,   // 57gsm → ~0.075mm, 72gsm → ~0.090mm, 90gsm → ~0.115mm
    hvs:        1.28, // 70gsm → ~0.088mm, 80gsm → ~0.105mm, 100gsm → ~0.130mm
    art:        0.85, // coated paper is denser: 120gsm → ~0.100mm, 150gsm → ~0.130mm
    matt:       0.90, // matt coated: 120gsm → ~0.110mm, 150gsm → ~0.140mm
  };
  return round4((gsm / 1000) * (ratios[type] ?? 1.3));
}

export const SPINE_LIMITS: Record<string, { min: number; max: number }> = {
  A5: { min: 6, max: 35 },
  B5: { min: 7, max: 45 },
  A6: { min: 5, max: 25 },
};

export interface SpineValidation {
  valid: boolean;
  reason?: string;
  warnings?: string[];
}

export function validateSpine(spineMm: number, sizeCode: string, pages: number): SpineValidation {
  const limits = SPINE_LIMITS[sizeCode];
  const warnings: string[] = [];

  if (!limits) return { valid: false, reason: `Unknown size: ${sizeCode}` };

  // Minimum pages check (40 sheets / 80 pages for structural integrity)
  if (pages < MIN_PAGES) {
    return {
      valid: false,
      reason: `Minimum ${MIN_PAGES} halaman (${MIN_PAGES / 2} lembar) untuk hardcover yang structurally sound.`,
    };
  }

  // Signature binding: pages must be divisible by 4
  if (pages % PAGE_STEP !== 0) {
    const snapped = Math.round(pages / PAGE_STEP) * PAGE_STEP;
    return {
      valid: false,
      reason: `Jumlah halaman harus kelipatan ${PAGE_STEP} (untuk signature binding). Coba ${snapped} halaman.`,
    };
  }

  // Spine width limits
  if (spineMm < limits.min) {
    return { valid: false, reason: `Spine terlalu tipis (${spineMm}mm < minimum ${limits.min}mm untuk ${sizeCode}).` };
  }
  if (spineMm > limits.max) {
    return { valid: false, reason: `Terlalu banyak halaman untuk ${sizeCode}. Max spine: ${limits.max}mm.` };
  }

  // Warnings
  if (spineMm > limits.max * 0.85) {
    warnings.push(`Spine width ${spineMm}mm接近 batas atas ${limits.max}mm untuk ${sizeCode}.`);
  }

  return { valid: true, warnings: warnings.length ? warnings : undefined };
}

/** Standard paper caliper in mm */
export const PAPER_CALIPER_MAP: Record<string, number> = {
  BOOK57: 0.075,
  BOOK72: 0.090,
  BOOK90: 0.115,
  HVS70: 0.088,
  HVS80: 0.105,
  HVS100: 0.130,
  ART120: 0.100,
  ART150: 0.130,
  MATT120: 0.110,
  MATT150: 0.140,
};

/** Standard board thickness in mm */
export const BOARD_THICKNESS_MAP: Record<string, number> = {
  BOARD14: 1.4,
  BOARD18: 1.8,
  BOARD20: 2.0,
  BOARD25: 2.5,
};

/** Standard endpaper thickness in mm */
export const ENDPAPER_THICKNESS_MAP: Record<string, number> = {
  ENDFLAT: 0.10,
  ENDPLAIN: 0.14,
  ENDPAT: 0.18,
};

/** Standard book dimensions in mm */
export const BOOK_SIZE_DIMS: Record<string, { widthMm: number; heightMm: number }> = {
  A5: { widthMm: 148, heightMm: 210 },
  B5: { widthMm: 176, heightMm: 250 },
  A6: { widthMm: 105, heightMm: 148 },
};

/** Calculate spine width from base configuration */
export function computeSpineWidth(params: {
  pages: number;
  paperCode?: string;
  boardCode?: string;
  endpaperCode?: string;
  sizeCode?: string;
}): number {
  const paperCaliperMm = (params.paperCode && PAPER_CALIPER_MAP[params.paperCode]) || 0.105;
  const boardThicknessMm = (params.boardCode && BOARD_THICKNESS_MAP[params.boardCode]) || 2.0;
  const endpaperThicknessMm = (params.endpaperCode && ENDPAPER_THICKNESS_MAP[params.endpaperCode]) || 0.14;
  const bookDims = (params.sizeCode && BOOK_SIZE_DIMS[params.sizeCode]) || BOOK_SIZE_DIMS.A5;

  const result = calculateSpine(
    {
      pages: params.pages,
      paperCaliperMm,
      boardThicknessMm,
      endpaperThicknessMm,
      hingeAllowanceMm: 2.0,
    },
    bookDims
  );

  return result.spineWidthMm;
}
