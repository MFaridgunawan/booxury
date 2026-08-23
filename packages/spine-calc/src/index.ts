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

/** Snap page count to nearest valid signature-multiple */
export function snapPagesToSignature(pages: number): number {
  if (pages < MIN_PAGES) return MIN_PAGES;
  const snapped = Math.round(pages / PAGE_STEP) * PAGE_STEP;
  return Math.max(MIN_PAGES, snapped);
}
