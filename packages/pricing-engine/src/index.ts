import { calculateSpine } from '@booxury/spine-calc';

export interface BaseConfig {
  sizeCode: 'A5' | 'B5' | 'A6';
  pages: number;
  paperCode: string;
  boardCode: string;
  layout: 'PLAIN' | 'LINED';
}

export interface FinishConfig {
  coverFinishCode: 'doff' | 'glossy' | 'canvas';
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
  doff: 0,
  glossy: 0,
  canvas: 15000,
};

const ACCESSORY_PRICES: Record<string, number> = {
  STRAP: 5000,
  RIBBON: 3000,
};

const MATERIAL_PRICES: Record<string, number> = {
  HVS80: 500,
  HVS100: 700,
  BOOK70: 600,
  BOOK80: 800,
  BOARD15: 1500,
  BOARD20: 2000,
  BOARD25: 2500,
  BOARD30: 3000,
  ENDPLAIN: 300,
  ENDPAT: 500,
};

const PAPER_CALIPER: Record<string, number> = {
  HVS80: 0.105,
  HVS100: 0.130,
  BOOK70: 0.082,
  BOOK80: 0.095,
};

export function calculatePrice(
  base: BaseConfig,
  finish: FinishConfig,
  _materials: MaterialLookup
): PriceQuote {
  const breakdown: PriceBreakdownItem[] = [];
  const ruleApplied: string[] = [];
  let subtotal = 0;

  // Base price
  const basePrice = SIZE_PRICES[base.sizeCode]?.basePrice ?? 35000;
  subtotal += basePrice;
  breakdown.push({ item: `Base ${base.sizeCode}`, amount: basePrice });

  // Paper price (per page * pages)
  const paperPrice = MATERIAL_PRICES[base.paperCode] ?? 500;
  const paperTotal = paperPrice * base.pages;
  subtotal += paperTotal;
  breakdown.push({ item: `Kertas ${base.paperCode}`, amount: paperTotal });

  // Cover finish modifier
  const coverMod = COVER_MODIFIERS[finish.coverFinishCode] ?? 0;
  if (coverMod > 0) {
    subtotal += coverMod;
    breakdown.push({ item: `Cover Finish: ${finish.coverFinishCode}`, amount: coverMod });
  }

  // Accessories
  for (const acc of finish.accessories) {
    const price = ACCESSORY_PRICES[acc.type] ?? 0;
    subtotal += price;
    breakdown.push({ item: `${acc.type === 'STRAP' ? 'Tali' : 'Pita'}`, amount: price });
  }

  // Volume discount (5%+)
  if (base.pages >= 200) {
    const discount = Math.round(subtotal * 0.05);
    subtotal -= discount;
    ruleApplied.push('Diskon Hardcover Tebal 5%');
    breakdown.push({ item: 'Diskon 5%', amount: -discount });
  }

  return { subtotal, breakdown, ruleApplied, total: subtotal };
}

export function calculateSpineForPricing(
  pages: number,
  paperCode: string,
  boardCode: string
) {
  const caliper = PAPER_CALIPER[paperCode] ?? 0.105;
  const boardThickness = { BOARD15: 1.5, BOARD20: 2.0, BOARD25: 2.5, BOARD30: 3.0 }[boardCode] ?? 2.0;

  return calculateSpine({
    pages,
    paperCaliperMm: caliper,
    boardThicknessMm: boardThickness,
    endpaperThicknessMm: 0.12,
    hingeAllowanceMm: 2.0,
  }, SIZE_PRICES[paperCode] ?? SIZE_PRICES.A5);
}
