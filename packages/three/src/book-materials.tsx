import type { MeshStandardMaterialParameters } from 'three';

export type CoverFinish = 'doff' | 'glossy' | 'canvas' | 'leatherette';
export type EdgeFinish = 'plain' | 'gilded_gold' | 'gilded_silver' | 'sprayed_red' | 'sprayed_blue' | 'stenciled';
export type CornerShape = 'square' | 'round';

// coverFinish → PBR roughness/metalness (Soft tactile matte, zero plastic glare)
export const COVER_PARAMS: Record<CoverFinish, MeshStandardMaterialParameters> = {
  doff:        { roughness: 0.88, metalness: 0.02 }, // Tactile soft-touch matte
  glossy:      { roughness: 0.35, metalness: 0.08 }, // Refined satin gloss sheen
  canvas:      { roughness: 0.96, metalness: 0.0 },  // Raw linen/bookcloth tactile weave
  leatherette: { roughness: 0.80, metalness: 0.05 }, // Fine pebble grain matte leatherette
};

// coverFinish → base rich colorful hardcover notebook palette
export const COVER_COLOR: Record<CoverFinish, string> = {
  doff:        '#1d3557', // Deep Royal Navy Matte
  glossy:      '#1a2d48', // Deep Prussian Blue Satin
  canvas:      '#874828', // Warm Terracotta / Saddle Linen
  leatherette: '#173b2d', // British Racing Emerald Green Leather
};

// edgeFinish → PBR parameters for book block sides
export const EDGE_PARAMS: Record<EdgeFinish, MeshStandardMaterialParameters> = {
  plain:          { color: '#ebdcb2', roughness: 0.95, metalness: 0.0 },  // Warm Novel Bookpaper
  gilded_gold:    { color: '#d4af37', roughness: 0.28, metalness: 0.88 }, // Reflective Gold Leaf
  gilded_silver:  { color: '#d1d5db', roughness: 0.28, metalness: 0.88 }, // Brushed Silver Leaf
  sprayed_red:     { color: '#7f1d1d', roughness: 0.86, metalness: 0.02 }, // Matte Crimson Edge
  sprayed_blue:    { color: '#1e3a8a', roughness: 0.86, metalness: 0.02 }, // Matte Navy Edge
  stenciled:      { color: '#451a03', roughness: 0.88, metalness: 0.04 }, // Antique Ochre Pattern
};

// edgeFinish → color
export const EDGE_COLORS: Record<EdgeFinish, string> = {
  plain:          '#ebdcb2',
  gilded_gold:    '#d4af37',
  gilded_silver:  '#d1d5db',
  sprayed_red:     '#7f1d1d',
  sprayed_blue:    '#1e3a8a',
  stenciled:      '#451a03',
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

// paper code → color (Authentic bookbinding paper stocks)
export const PAPER_COLORS: Record<string, string> = {
  BOOK57:  '#f7eed7', // Warm Cream Ivory 57gsm
  BOOK72:  '#ebdcb2', // Classic Novel Bookpaper 72gsm (warm yellowish cream)
  BOOK90:  '#dfcba0', // Rich Antique Cream Bookpaper 90gsm
  HVS70:   '#ffffff', // Bright Pure White 70gsm
  HVS80:   '#fafafa', // Pure White 80gsm
  HVS100:  '#f6f6f6', // Crisp Heavy White 100gsm
  ART120:  '#f7f8fa', // Smooth Silk White Art Paper
  ART150:  '#f4f5f8', // Heavy Art Paper 150gsm
  MATT120: '#eeece4', // Soft Warm Matt Paper 120gsm
  MATT150: '#e8e5db', // Heavy Warm Matt Paper 150gsm
  KRAFT:   '#c09968', // Warm Artisan Brown Kraft Paper
  KRAFT80: '#c8a876', // Brown Kraft 80gsm
};

// endpaper code → color (Comprehensive easy-to-understand palette)
export const ENDPAPER_COLORS: Record<string, string> = {
  ENDFLAT:    '#ffffff', // Putih Bersih (HVS White)
  ENDPLAIN:   '#eee5cf', // Krem Novel (Novel Cream / Ivory)
  ENDKRAFT:   '#b88d57', // Kraft Coklat (Artisan Brown Kraft)
  ENDHITAM:   '#1a1a1a', // Hitam Elegan (Midnight Black)
  ENDABU:     '#555b6e', // Abu-Abu Doff (Charcoal Grey)
  ENDPAT:     '#dacdaf', // Motif Marmer Klasik (Vintage Marble)
  ENDMARBLE:  '#3e3025', // Vintage Dark Marble
  ENDTEXTURE: '#e4dac8', // Textured Linen
};

// corner shape → RoundedBox radius (0 = square, >0 = round)
export const CORNER_RADIUS: Record<CornerShape, number> = {
  square: 0.0,
  round:  0.035,
};

// Book dimension map (mm → scene units, scaled by 0.01)
export const SIZE_DIMS: Record<string, { widthMm: number; heightMm: number }> = {
  A5: { widthMm: 148, heightMm: 210 },
  B5: { widthMm: 176, heightMm: 250 },
  A6: { widthMm: 105, heightMm: 148 },
};

export interface MaterialInputs {
  coverFinish: CoverFinish;
  coverColor?: string;
  edgeFinish?: EdgeFinish;
  cornerShape?: CornerShape;
  hasDustJacket?: boolean;
  headbandCode?: string;
  ribbonCodes?: string[];
  spineWidthMm?: number;
  sizeCode?: string;
}

export function buildMaterial(inputs: MaterialInputs): MeshStandardMaterialParameters {
  const cover = COVER_PARAMS[inputs.coverFinish] ?? COVER_PARAMS.doff;
  // Use user-selected cover color, or fallback to finish default
  const color = inputs.coverColor || COVER_COLOR[inputs.coverFinish] || COVER_COLOR.doff;
  return {
    ...cover,
    color,
  };
}

export function buildEdgeMaterial(edgeFinish: EdgeFinish = 'plain', paperCode?: string): MeshStandardMaterialParameters {
  const base = EDGE_PARAMS[edgeFinish] ?? EDGE_PARAMS.plain;
  if (edgeFinish === 'plain' && paperCode && PAPER_COLORS[paperCode]) {
    return {
      ...base,
      color: PAPER_COLORS[paperCode],
    };
  }
  return base;
}

// Default Endpaper color
export const ENDPAPER_COLOR = '#eee5cf';
// Default Page block color
export const PAGE_COLOR = '#ebdcb2';

