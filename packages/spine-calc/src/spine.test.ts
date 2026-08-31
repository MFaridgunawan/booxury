import { describe, it, expect } from 'vitest';
import { calculateSpine, validateSpine } from '../src/index.js';

describe('calculateSpine', () => {
  it('A5 160 hal HVS80 + BOARD18', () => {
    const result = calculateSpine(
      { pages: 160, paperCaliperMm: 0.105, boardThicknessMm: 1.8, endpaperThicknessMm: 0.12, hingeAllowanceMm: 2.0 },
      { widthMm: 148, heightMm: 210 }
    );
    expect(result.spineWidthMm).toBeCloseTo(14.28, 1);
  });

  it('B5 200 hal BOOK80 + BOARD25', () => {
    const result = calculateSpine(
      { pages: 200, paperCaliperMm: 0.095, boardThicknessMm: 2.5, endpaperThicknessMm: 0.12, hingeAllowanceMm: 2.0 },
      { widthMm: 176, heightMm: 250 }
    );
    // (200/2)*0.095 + 2.5*2 + 0.12*2 + 2.0 = 9.5 + 5.0 + 0.24 + 2.0 = 16.74
    expect(result.spineWidthMm).toBeCloseTo(16.74, 1);
  });

  it('A6 80 hal BOOK57 + BOARD14', () => {
    const result = calculateSpine(
      { pages: 80, paperCaliperMm: 0.075, boardThicknessMm: 1.4, endpaperThicknessMm: 0.12, hingeAllowanceMm: 2.0 },
      { widthMm: 105, heightMm: 148 }
    );
    // (80/2)*0.075 + 1.4*2 + 0.12*2 + 2.0 = 3.0 + 2.8 + 0.24 + 2.0 = 8.04
    expect(result.spineWidthMm).toBeCloseTo(8.04, 1);
  });
});

describe('validateSpine', () => {
  it('A5 spine 14.28mm is valid for 160 pages', () => {
    const result = validateSpine(14.28, 'A5', 160);
    expect(result.valid).toBe(true);
  });

  it('A5 spine 5mm is too thin for 200 pages', () => {
    const result = validateSpine(5.0, 'A5', 200);
    expect(result.valid).toBe(false);
  });

  it('B5 spine 50mm is too thick (max 45)', () => {
    const result = validateSpine(50.0, 'B5', 300);
    expect(result.valid).toBe(false);
  });
});
