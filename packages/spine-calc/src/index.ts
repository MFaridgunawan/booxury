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
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const TURN_IN_MM = 15;
const BLEED_MM = 3;

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
  };
}

export const SPINE_LIMITS: Record<string, { min: number; max: number }> = {
  A5: { min: 5, max: 35 },
  B5: { min: 6, max: 45 },
  A6: { min: 4, max: 25 },
};

export function validateSpine(spineMm: number, sizeCode: string) {
  const limits = SPINE_LIMITS[sizeCode];
  if (!limits) return { valid: false, reason: `Unknown size: ${sizeCode}` };
  if (spineMm < limits.min) return { valid: false, reason: `Terlalu tipis (${spineMm}mm)` };
  if (spineMm > limits.max) return { valid: false, reason: `Halaman terlalu banyak untuk ${sizeCode}` };
  return { valid: true };
}
