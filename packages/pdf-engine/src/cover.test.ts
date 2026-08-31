import { describe, it, expect } from 'vitest';
import { generateCoverPdfBuffer } from '../src/cover';
import { calculateSpine } from '@booxury/spine-calc';
import * as fs from 'fs';
import { spawnSync } from 'child_process';

function countPdfPages(buf: Buffer): number {
  const text = buf.toString('latin1');
  const matches = text.match(/\/Type\s*\/Page(?!s)/g);
  return matches ? matches.length : 0;
}

function extractPdfText(buf: Buffer): string {
  const tmp = '/tmp/booxury-test.pdf';
  fs.writeFileSync(tmp, buf);
  const result = spawnSync('pdftotext', ['-layout', tmp, '-'], { encoding: 'utf8' });
  return result.stdout ?? '';
}

describe('generateCoverPdfBuffer — Blueprint PDF for customer + producer', () => {
  const a5 = { widthMm: 148, heightMm: 210 };

  function makeSpine() {
    return calculateSpine({
      pages: 100,
      paperCaliperMm: 0.095,
      boardThicknessMm: 2.0,
      endpaperThicknessMm: 0.12,
      hingeAllowanceMm: 2.0,
    }, a5);
  }

  const baseInput = {
    spine: null as any, // overwritten per test
    bookWidthMm: a5.widthMm,
    bookHeightMm: a5.heightMm,
    sizeCode: 'A5',
    pages: 100,
    paperCode: 'BOOK72',
    boardCode: 'BOARD20',
    coverFinish: 'doff',
    spineText: 'BOOXURY',
  };

  it('returns a Buffer (not undefined, not a Promise that never resolves)', async () => {
    const buf = await generateCoverPdfBuffer({ ...baseInput, spine: makeSpine() });
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
    expect(buf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('produces exactly 2 pages — cover spread + producer spec sheet', async () => {
    const buf = await generateCoverPdfBuffer({ ...baseInput, spine: makeSpine() });
    expect(countPdfPages(buf)).toBe(2);
  });

  it('page 1 (customer view) labels BACK / FRONT / spine area so customer reads the spread', async () => {
    const buf = await generateCoverPdfBuffer({ ...baseInput, spine: makeSpine() });
    const text = extractPdfText(buf);
    // pdftotext sometimes splits rotated text (SPINE → SPIN/E). Match leniently.
    expect(text).toMatch(/BACK/);
    expect(text).toMatch(/FRONT/);
    expect(text).toMatch(/SPIN/); // SPINE or SPIN — both indicate spine panel
    // Spine text the customer chose
    expect(text).toMatch(/BOOXURY/);
    // Total spread dimension (producer key metric on cover spread)
    expect(text).toMatch(/337\.0.*total spread/);
  });

  it('page 2 (producer view) carries the technical specs the bindery needs', async () => {
    const buf = await generateCoverPdfBuffer({ ...baseInput, spine: makeSpine() });
    const text = extractPdfText(buf);
    expect(text.toLowerCase()).toMatch(/safe zone/);
    // The rest of the producer view (Identitas, Bahan, Konstruksi, Rumus Spine, Tanda Potong)
    expect(text).toMatch(/A5/);
    expect(text).toMatch(/148.*210.*mm/);
    expect(text).toMatch(/100 halaman/);
    expect(text).toMatch(/BOOK72/);
    expect(text).toMatch(/BOARD20/);
    expect(text).toMatch(/Endpaper/);
    expect(text).toMatch(/Bleed/);
    expect(text).toMatch(/spineWidth/);
    expect(text).toMatch(/Tanda Potong/);
  });

  it('cover spread page embeds numeric dimension labels the bindery can measure from', async () => {
    const buf = await generateCoverPdfBuffer({ ...baseInput, spine: makeSpine() });
    const text = extractPdfText(buf);
    // A5 width × height
    expect(text).toMatch(/148×210/);
    // spine width number that came out of calculateSpine()
    expect(text).toMatch(/10\.99/);
    // total spread
    expect(text).toMatch(/337/);
  });

  it('embeds customer artwork on the front panel when given as base64 PNG', async () => {
    // 1×1 red PNG, base64-encoded. Just enough to verify the image renders.
    const png1x1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const buf = await generateCoverPdfBuffer({
      ...baseInput,
      spine: makeSpine(),
      frontPanelImage: `data:image/png;base64,${png1x1}`,
    });
    // When artwork is present, BACK/FRONT labels are suppressed, but the
    // image is embedded. Verify by checking the buffer grew (image bytes added).
    const noArt = await generateCoverPdfBuffer({ ...baseInput, spine: makeSpine() });
    expect(buf.length).toBeGreaterThan(noArt.length);
    // Also: pdftotext should no longer include FRONT label (replaced by image)
    const text = extractPdfText(buf);
    expect(text).not.toMatch(/^FRONT$/m);
  });

  it('B5 size flows through both cover spread dimensions and producer spec sheet', async () => {
    const b5 = { widthMm: 176, heightMm: 250 };
    const spine = calculateSpine({
      pages: 200,
      paperCaliperMm: 0.095,
      boardThicknessMm: 2.5,
      endpaperThicknessMm: 0.12,
      hingeAllowanceMm: 2.0,
    }, b5);

    const buf = await generateCoverPdfBuffer({
      spine,
      bookWidthMm: b5.widthMm,
      bookHeightMm: b5.heightMm,
      sizeCode: 'B5',
      pages: 200,
      paperCode: 'BOOK72',
      boardCode: 'BOARD25',
      coverFinish: 'glossy',
      spineText: 'CUSTOM',
    });
    const text = extractPdfText(buf);
    expect(countPdfPages(buf)).toBe(2);
    // Cover spread shows B5 size
    expect(text).toMatch(/176×250/);
    // Producer sheet reflects new config (200 halaman, BOARD25)
    expect(text).toMatch(/200 halaman/);
    expect(text).toMatch(/BOARD25/);
    expect(text).toMatch(/GLOSSY/);
    // Custom spine text shows on cover (rotated, pdftotext splits chars)
    expect(text).toMatch(/CUS/);
  });

  it('PDF is structurally valid (poppler pdfinfo parses without error)', async () => {
    const buf = await generateCoverPdfBuffer({ ...baseInput, spine: makeSpine() });
    fs.writeFileSync('/tmp/booxury-test.pdf', buf);
    const result = spawnSync('pdfinfo', ['/tmp/booxury-test.pdf'], { encoding: 'utf8' });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/Pages:\s+2/);
    // PDF metadata: title includes the size so the bindery can sort jobs
    expect(result.stdout).toMatch(/Title:.*A5/);
  });

  it('renders to PNG without error (visual smoke test)', async () => {
    const buf = await generateCoverPdfBuffer({ ...baseInput, spine: makeSpine() });
    fs.writeFileSync('/tmp/booxury-test.pdf', buf);
    const result = spawnSync('pdftoppm', ['-r', '50', '-png', '/tmp/booxury-test.pdf', '/tmp/booxury-page'], { encoding: 'utf8' });
    expect(result.status).toBe(0);
    expect(fs.existsSync('/tmp/booxury-page-1.png')).toBe(true);
    expect(fs.existsSync('/tmp/booxury-page-2.png')).toBe(true);
  });
});