import { describe, it, expect } from 'vitest';
import { calculatePrice } from '../src/index.js';

describe('pricing-engine', () => {
  describe('calculatePrice — base size', () => {
    it('returns base price for A5', () => {
      const result = calculatePrice(
        { sizeCode: 'A5', pages: 100, paperCode: 'HVS80', boardCode: 'BOARD20', endpaperCode: 'ENDPLAIN', layout: 'plain' },
        { coverFinish: 'doff', cornerShape: 'square', edgeFinish: 'plain', hasDustJacket: false, ribbonCodes: [], accessories: [] },
        {}
      );
      expect(result.breakdown.find(b => b.item.includes('A5'))).toBeDefined();
    });

    it('returns base price for B5 > A5', () => {
      const a5 = calculatePrice(
        { sizeCode: 'A5', pages: 100, paperCode: 'HVS80', boardCode: 'BOARD20', endpaperCode: 'ENDPLAIN', layout: 'plain' },
        { coverFinish: 'doff', cornerShape: 'square', edgeFinish: 'plain', hasDustJacket: false, ribbonCodes: [], accessories: [] },
        {}
      );
      const b5 = calculatePrice(
        { sizeCode: 'B5', pages: 100, paperCode: 'HVS80', boardCode: 'BOARD20', endpaperCode: 'ENDPLAIN', layout: 'plain' },
        { coverFinish: 'doff', cornerShape: 'square', edgeFinish: 'plain', hasDustJacket: false, ribbonCodes: [], accessories: [] },
        {}
      );
      expect(b5.total).toBeGreaterThan(a5.total);
    });
  });

  describe('calculatePrice — paper', () => {
    it('increases price with more pages', () => {
      const p100 = calculatePrice(
        { sizeCode: 'A5', pages: 100, paperCode: 'HVS80', boardCode: 'BOARD20', endpaperCode: 'ENDPLAIN', layout: 'plain' },
        { coverFinish: 'doff', cornerShape: 'square', edgeFinish: 'plain', hasDustJacket: false, ribbonCodes: [], accessories: [] },
        {}
      );
      const p200 = calculatePrice(
        { sizeCode: 'A5', pages: 200, paperCode: 'HVS80', boardCode: 'BOARD20', endpaperCode: 'ENDPLAIN', layout: 'plain' },
        { coverFinish: 'doff', cornerShape: 'square', edgeFinish: 'plain', hasDustJacket: false, ribbonCodes: [], accessories: [] },
        {}
      );
      expect(p200.total).toBeGreaterThan(p100.total);
    });
  });

  describe('calculatePrice — cover finish', () => {
    it('canvas adds Rp15.000 surcharge', () => {
      const doff = calculatePrice(
        { sizeCode: 'A5', pages: 100, paperCode: 'HVS80', boardCode: 'BOARD20', endpaperCode: 'ENDPLAIN', layout: 'plain' },
        { coverFinish: 'doff', cornerShape: 'square', edgeFinish: 'plain', hasDustJacket: false, ribbonCodes: [], accessories: [] },
        {}
      );
      const canvas = calculatePrice(
        { sizeCode: 'A5', pages: 100, paperCode: 'HVS80', boardCode: 'BOARD20', endpaperCode: 'ENDPLAIN', layout: 'plain' },
        { coverFinish: 'canvas', cornerShape: 'square', edgeFinish: 'plain', hasDustJacket: false, ribbonCodes: [], accessories: [] },
        {}
      );
      const diff = canvas.total - doff.total;
      expect(diff).toBe(15000);
    });

    it('leatherette adds Rp25.000 surcharge', () => {
      const doff = calculatePrice(
        { sizeCode: 'A5', pages: 100, paperCode: 'HVS80', boardCode: 'BOARD20', endpaperCode: 'ENDPLAIN', layout: 'plain' },
        { coverFinish: 'doff', cornerShape: 'square', edgeFinish: 'plain', hasDustJacket: false, ribbonCodes: [], accessories: [] },
        {}
      );
      const leather = calculatePrice(
        { sizeCode: 'A5', pages: 100, paperCode: 'HVS80', boardCode: 'BOARD20', endpaperCode: 'ENDPLAIN', layout: 'plain' },
        { coverFinish: 'leatherette', cornerShape: 'square', edgeFinish: 'plain', hasDustJacket: false, ribbonCodes: [], accessories: [] },
        {}
      );
      expect(leather.total - doff.total).toBe(25000);
    });
  });

  describe('calculatePrice — corner shape', () => {
    it('round corners add Rp5.000', () => {
      const square = calculatePrice(
        { sizeCode: 'A5', pages: 100, paperCode: 'HVS80', boardCode: 'BOARD20', endpaperCode: 'ENDPLAIN', layout: 'plain' },
        { coverFinish: 'doff', cornerShape: 'square', edgeFinish: 'plain', hasDustJacket: false, ribbonCodes: [], accessories: [] },
        {}
      );
      const round = calculatePrice(
        { sizeCode: 'A5', pages: 100, paperCode: 'HVS80', boardCode: 'BOARD20', endpaperCode: 'ENDPLAIN', layout: 'plain' },
        { coverFinish: 'doff', cornerShape: 'round', edgeFinish: 'plain', hasDustJacket: false, ribbonCodes: [], accessories: [] },
        {}
      );
      expect(round.total - square.total).toBe(5000);
    });
  });

  describe('calculatePrice — edge finish', () => {
    it('gilded_gold adds Rp20.000', () => {
      const plain = calculatePrice(
        { sizeCode: 'A5', pages: 100, paperCode: 'HVS80', boardCode: 'BOARD20', endpaperCode: 'ENDPLAIN', layout: 'plain' },
        { coverFinish: 'doff', cornerShape: 'square', edgeFinish: 'plain', hasDustJacket: false, ribbonCodes: [], accessories: [] },
        {}
      );
      const gold = calculatePrice(
        { sizeCode: 'A5', pages: 100, paperCode: 'HVS80', boardCode: 'BOARD20', endpaperCode: 'ENDPLAIN', layout: 'plain' },
        { coverFinish: 'doff', cornerShape: 'square', edgeFinish: 'gilded_gold', hasDustJacket: false, ribbonCodes: [], accessories: [] },
        {}
      );
      expect(gold.total - plain.total).toBe(20000);
    });
  });

  describe('calculatePrice — dust jacket', () => {
    it('dust jacket adds Rp8.000', () => {
      const plain = calculatePrice(
        { sizeCode: 'A5', pages: 100, paperCode: 'HVS80', boardCode: 'BOARD20', endpaperCode: 'ENDPLAIN', layout: 'plain' },
        { coverFinish: 'doff', cornerShape: 'square', edgeFinish: 'plain', hasDustJacket: false, ribbonCodes: [], accessories: [] },
        {}
      );
      const withJacket = calculatePrice(
        { sizeCode: 'A5', pages: 100, paperCode: 'HVS80', boardCode: 'BOARD20', endpaperCode: 'ENDPLAIN', layout: 'plain' },
        { coverFinish: 'doff', cornerShape: 'square', edgeFinish: 'plain', hasDustJacket: true, ribbonCodes: [], accessories: [] },
        {}
      );
      expect(withJacket.total - plain.total).toBe(8000);
    });
  });

  describe('calculatePrice — ribbon markers', () => {
    it('ribbonCodes adds Rp3.000 per ribbon', () => {
      const noRibbon = calculatePrice(
        { sizeCode: 'A5', pages: 100, paperCode: 'HVS80', boardCode: 'BOARD20', endpaperCode: 'ENDPLAIN', layout: 'plain' },
        { coverFinish: 'doff', cornerShape: 'square', edgeFinish: 'plain', hasDustJacket: false, ribbonCodes: [], accessories: [] },
        {}
      );
      const withRibbon = calculatePrice(
        { sizeCode: 'A5', pages: 100, paperCode: 'HVS80', boardCode: 'BOARD20', endpaperCode: 'ENDPLAIN', layout: 'plain' },
        { coverFinish: 'doff', cornerShape: 'square', edgeFinish: 'plain', hasDustJacket: false, ribbonCodes: ['rb_merah'], accessories: [] },
        {}
      );
      expect(withRibbon.total - noRibbon.total).toBe(3000);
    });
  });

  describe('calculatePrice — volume discounts', () => {
    it('applies 5% discount for ≥200 pages', () => {
      const result = calculatePrice(
        { sizeCode: 'A5', pages: 200, paperCode: 'HVS80', boardCode: 'BOARD20', endpaperCode: 'ENDPLAIN', layout: 'plain' },
        { coverFinish: 'doff', cornerShape: 'square', edgeFinish: 'plain', hasDustJacket: false, ribbonCodes: [], accessories: [] },
        {}
      );
      expect(result.ruleApplied.some(r => r.includes('5%'))).toBe(true);
    });

    it('applies 8% discount for ≥300 pages', () => {
      const result = calculatePrice(
        { sizeCode: 'A5', pages: 300, paperCode: 'HVS80', boardCode: 'BOARD20', endpaperCode: 'ENDPLAIN', layout: 'plain' },
        { coverFinish: 'doff', cornerShape: 'square', edgeFinish: 'plain', hasDustJacket: false, ribbonCodes: [], accessories: [] },
        {}
      );
      expect(result.ruleApplied.some(r => r.includes('8%'))).toBe(true);
    });
  });

  describe('calculatePrice — accessories', () => {
    it('strap accessory adds Rp5.000', () => {
      const noAcc = calculatePrice(
        { sizeCode: 'A5', pages: 100, paperCode: 'HVS80', boardCode: 'BOARD20', endpaperCode: 'ENDPLAIN', layout: 'plain' },
        { coverFinish: 'doff', cornerShape: 'square', edgeFinish: 'plain', hasDustJacket: false, ribbonCodes: [], accessories: [] },
        {}
      );
      const withStrap = calculatePrice(
        { sizeCode: 'A5', pages: 100, paperCode: 'HVS80', boardCode: 'BOARD20', endpaperCode: 'ENDPLAIN', layout: 'plain' },
        { coverFinish: 'doff', cornerShape: 'square', edgeFinish: 'plain', hasDustJacket: false, ribbonCodes: [], accessories: [{ code: 'STRAP', type: 'STRAP' }] },
        {}
      );
      expect(withStrap.total - noAcc.total).toBe(5000);
    });
  });

  describe('calculatePrice — return shape', () => {
    it('returns all required fields', () => {
      const result = calculatePrice(
        { sizeCode: 'A5', pages: 100, paperCode: 'HVS80', boardCode: 'BOARD20', endpaperCode: 'ENDPLAIN', layout: 'plain' },
        { coverFinish: 'doff', cornerShape: 'square', edgeFinish: 'plain', hasDustJacket: false, ribbonCodes: [], accessories: [] },
        {}
      );
      expect(result).toHaveProperty('subtotal');
      expect(result).toHaveProperty('breakdown');
      expect(Array.isArray(result.breakdown)).toBe(true);
      expect(result).toHaveProperty('ruleApplied');
      expect(Array.isArray(result.ruleApplied)).toBe(true);
      expect(result).toHaveProperty('total');
      expect(typeof result.total).toBe('number');
      expect(result.total).toBeGreaterThan(0);
    });
  });
});
