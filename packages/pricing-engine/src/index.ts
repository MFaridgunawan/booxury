import { calculateSpine } from '@booxury/spine-calc';

export interface BaseConfig {
  sizeCode: 'A5' | 'B5' | 'A6';
  pages: number;
  paperCode: string;
  boardCode: string;
  endpaperCode: string;
  layout: 'plain' | 'lined';
}

export interface FinishConfig {
  coverFinish: 'doff' | 'glossy' | 'canvas' | 'leatherette';
  cornerShape: 'square' | 'round';
  edgeFinish: 'plain' | 'gilded_gold' | 'gilded_silver' | 'sprayed_red' | 'sprayed_blue' | 'stenciled';
  hasDustJacket: boolean;
  headbandCode?: string;
  ribbonCodes: string[];
  accessories: Array<{ code: string; type: 'STRAP' | 'RIBBON' }>;
}

export interface MaterialLookup {
  [code: string]: {
    pricePerUnit: number;
    paperCaliperMm?: number;
    thicknessMm?: number;
  };
}

export interface SizeLookup {
  [code: string]: {
    widthMm: number;
    heightMm: number;
    basePrice: number;
  };
}

export interface PriceBreakdownItem {
  item: string;
  amount: number;
}

export interface PriceQuote {
  subtotal: number;
  breakdown: PriceBreakdownItem[];
  ruleApplied: string[];
  total: number;
}

const SIZE_PRICES: SizeLookup = {
  A5: { widthMm: 148, heightMm: 210, basePrice: 35000 },
  B5: { widthMm: 176, heightMm: 250, basePrice: 45000 },
  A6: { widthMm: 105, heightMm: 148, basePrice: 25000 },
};

const COVER_MODIFIERS: Record<string, number> = {
  doff:       0,
  glossy:     0,
  canvas:     15000,
  leatherette: 25000,
};

const EDGE_MODIFIERS: Record<string, number> = {
  plain:          0,
  gilded_gold:    20000,
  gilded_silver:  20000,
  sprayed_red:     10000,
  sprayed_blue:    10000,
  stenciled:       8000,
};

const ACCESSORY_PRICES: Record<string, number> = {
  STRAP:      5000,
  RIBBON:     3000,
  hb_merah:   2000,  // headband
  hb_hitam:   2000,
  hb_emas:    2000,
  hb_putih:   2000,
  rb_merah:   3000,  // ribbon marker
  rb_emas:    3000,
  rb_hijau:   3000,
  rb_biru:    3000,
  rb_hitam:   3000,
  dust_jacket: 8000,
};

// Headband + ribbon share same price per unit
const HEADBAND_PRICE = 2000;
const RIBBON_PRICE    = 3000;

export function calculatePrice(
  base: BaseConfig,
  finish: FinishConfig,
  _materials: MaterialLookup
): PriceQuote {
  const breakdown: PriceBreakdownItem[] = [];
  const ruleApplied: string[] = [];
  let subtotal = 0;

  // ── Base size price ─────────────────────────────────────────────────────────
  const sizeBase = SIZE_PRICES[base.sizeCode]?.basePrice ?? 35000;
  subtotal += sizeBase;
  breakdown.push({ item: `Base hardcover ${base.sizeCode}`, amount: sizeBase });

  // ── Paper (per page × pages) ───────────────────────────────────────────────
  const paperUnit = MATERIAL_PRICES[base.paperCode] ?? 500;
  const paperTotal = paperUnit * base.pages;
  subtotal += paperTotal;
  breakdown.push({ item: `Kertas ${base.paperCode} × ${base.pages} hal`, amount: paperTotal });

  // ── Board ───────────────────────────────────────────────────────────────────
  const boardUnit = BOARD_PRICES[base.boardCode] ?? 2000;
  subtotal += boardUnit;
  breakdown.push({ item: `Greyboard ${base.boardCode}`, amount: boardUnit });

  // ── Endpaper ───────────────────────────────────────────────────────────────
  const endpaperUnit = ENDPAPER_PRICES[base.endpaperCode] ?? 300;
  subtotal += endpaperUnit * 2; // 2 endpapers (front + back)
  breakdown.push({ item: `Endpaper ${base.endpaperCode} × 2`, amount: endpaperUnit * 2 });

  // ── Cover finish modifier ───────────────────────────────────────────────────
  const coverMod = COVER_MODIFIERS[finish.coverFinish] ?? 0;
  if (coverMod > 0) {
    subtotal += coverMod;
    breakdown.push({ item: `Cover finish: ${finish.coverFinish}`, amount: coverMod });
  }

  // ── Corner shape (round corners need extra machining) ─────────────────────
  if (finish.cornerShape === 'round') {
    subtotal += 5000;
    breakdown.push({ item: 'Corner shaping: round', amount: 5000 });
  }

  // ── Edge finish ────────────────────────────────────────────────────────────
  const edgeMod = EDGE_MODIFIERS[finish.edgeFinish] ?? 0;
  if (edgeMod > 0) {
    subtotal += edgeMod;
    breakdown.push({ item: `Edge finish: ${finish.edgeFinish.replace('_', ' ')}`, amount: edgeMod });
  }

  // ── Dust jacket ─────────────────────────────────────────────────────────────
  if (finish.hasDustJacket) {
    subtotal += 8000;
    breakdown.push({ item: 'Dust jacket', amount: 8000 });
  }

  // ── Headband ───────────────────────────────────────────────────────────────
  if (finish.headbandCode) {
    subtotal += HEADBAND_PRICE;
    breakdown.push({ item: `Headband ${finish.headbandCode}`, amount: HEADBAND_PRICE });
  }

  // ── Ribbon markers ─────────────────────────────────────────────────────────
  for (const code of finish.ribbonCodes ?? []) {
    subtotal += RIBBON_PRICE;
    breakdown.push({ item: `Ribbon marker ${code}`, amount: RIBBON_PRICE });
  }

  // ── Volume discounts ───────────────────────────────────────────────────────
  // 5% discount for thick books (>200 pages)
  if (base.pages >= 200) {
    const discount = Math.round(subtotal * 0.05);
    subtotal -= discount;
    ruleApplied.push('Diskon Buku Tebal 5% (≥200 hal)');
    breakdown.push({ item: 'Diskon 5%', amount: -discount });
  }

  // 8% discount for very thick books (>300 pages)
  if (base.pages >= 300) {
    const discount = Math.round(subtotal * 0.08);
    subtotal -= discount;
    ruleApplied.push('Diskon Buku Sangat Tebal 8% (≥300 hal)');
    breakdown.push({ item: 'Diskon 8%', amount: -discount });
  }

  return { subtotal, breakdown, ruleApplied, total: subtotal };
}

// ── Material price lookups (mirrors seed.ts) ───────────────────────────────────

const MATERIAL_PRICES: Record<string, number> = {
  BOOK57:  400,
  BOOK72:  500,
  BOOK90:  700,
  HVS70:   400,
  HVS80:   500,
  HVS100:  700,
  ART120: 1200,
  ART150: 1500,
  MATT120:1200,
  MATT150:1500,
};

const BOARD_PRICES: Record<string, number> = {
  BOARD14: 1200,
  BOARD18: 1600,
  BOARD20: 2000,
  BOARD25: 2500,
};

const ENDPAPER_PRICES: Record<string, number> = {
  ENDFLAT:  200,
  ENDPLAIN: 300,
  ENDPAT:   500,
};

export function calculateSpineForPricing(
  pages: number,
  paperCode: string,
  boardCode: string,
  endpaperCode: string
) {
  const paperCaliperMm = PAPER_CALIPER_MM[paperCode] ?? 0.105;
  const boardThicknessMm = BOARD_THICKNESS_MM[boardCode] ?? 2.0;
  const endpaperThicknessMm = ENDPAPER_THICKNESS_MM[endpaperCode] ?? 0.14;

  return calculateSpine({
    pages,
    paperCaliperMm,
    boardThicknessMm,
    endpaperThicknessMm,
    hingeAllowanceMm: 2.0,
  }, SIZE_PRICES.A5);
}

const PAPER_CALIPER_MM: Record<string, number> = {
  BOOK57:  0.075,
  BOOK72:  0.090,
  BOOK90:  0.115,
  HVS70:   0.088,
  HVS80:   0.105,
  HVS100:  0.130,
  ART120:  0.100,
  ART150:  0.130,
  MATT120: 0.110,
  MATT150: 0.140,
};

const BOARD_THICKNESS_MM: Record<string, number> = {
  BOARD14: 1.4,
  BOARD18: 1.8,
  BOARD20: 2.0,
  BOARD25: 2.5,
};

const ENDPAPER_THICKNESS_MM: Record<string, number> = {
  ENDFLAT:  0.10,
  ENDPLAIN: 0.14,
  ENDPAT:   0.18,
};
