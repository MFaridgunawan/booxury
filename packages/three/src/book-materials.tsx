import type { MeshStandardMaterialParameters } from 'three';

export type CoverFinish = 'doff' | 'glossy' | 'canvas' | 'leatherette';
export type EdgeFinish = 'plain' | 'gilded_gold' | 'gilded_silver' | 'sprayed_red' | 'sprayed_blue' | 'stenciled';
export type CornerShape = 'square' | 'round';

// coverFinish → PBR roughness/metalness
export const COVER_PARAMS: Record<CoverFinish, MeshStandardMaterialParameters> = {
  doff:       { roughness: 0.85, metalness: 0.0 },
  glossy:     { roughness: 0.15, metalness: 0.05 },
  canvas:     { roughness: 0.90, metalness: 0.0 },
  leatherette: { roughness: 0.65, metalness: 0.12 },
};

// coverFinish → base color tint
export const COVER_COLOR: Record<CoverFinish, string> = {
  doff:       '#2a2010',
  glossy:     '#2a2010',
  canvas:     '#8B7355',
  leatherette: '#1a1008',
};

// edgeFinish → color (for gilded/sprayed sides)
export const EDGE_COLORS: Record<EdgeFinish, string> = {
  plain:          '',
  gilded_gold:    '#FFD700',
  gilded_silver:  '#C0C0C0',
  sprayed_red:     '#b71c1c',
  sprayed_blue:    '#1565c0',
  stenciled:      '#4a3410',
};

// headband color → hex
export const HEADBAND_COLORS: Record<string, string> = {
  hb_merah:  '#b71c1c',
  hb_hitam:  '#1a1a1a',
  hb_emas:   '#FFD700',
  hb_putih:  '#f5f5f5',
};

// ribbon marker color → hex
export const RIBBON_COLORS: Record<string, string> = {
  rb_merah:  '#b71c1c',
  rb_emas:   '#FFD700',
  rb_hijau:  '#1b5e20',
  rb_biru:   '#1565c0',
  rb_hitam:  '#1a1a1a',
};

// corner shape → RoundedBox radius (0 = square, >0 = round)
export const CORNER_RADIUS: Record<CornerShape, number> = {
  square: 0.0,
  round:  0.045,
};

// Book dimension map (mm → scene units, scaled by 0.01)
export const SIZE_DIMS: Record<string, { widthMm: number; heightMm: number }> = {
  A5: { widthMm: 148, heightMm: 210 },
  B5: { widthMm: 176, heightMm: 250 },
  A6: { widthMm: 105, heightMm: 148 },
};

export interface MaterialInputs {
  coverFinish: CoverFinish;
  edgeFinish: EdgeFinish;
  cornerShape: CornerShape;
  hasDustJacket: boolean;
  headbandCode?: string;
  ribbonCodes: string[];
  // Spine geometry data
  spineWidthMm: number;
  sizeCode: string;
}

export function buildMaterial(inputs: MaterialInputs): MeshStandardMaterialParameters {
  const cover = COVER_PARAMS[inputs.coverFinish];
  const color = COVER_COLOR[inputs.coverFinish];
  return {
    ...cover,
    color,
  };
}

// Endpaper color (cream/off-white)
export const ENDPAPER_COLOR = '#f6f1e7';
// Page block color
export const PAGE_COLOR = '#f8f4ec';
