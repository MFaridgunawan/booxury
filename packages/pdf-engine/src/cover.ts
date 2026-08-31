import PDFDocument from 'pdfkit';
import { SpineOutput } from '@booxury/spine-calc';
import * as fs from 'fs';

export interface CoverInput {
  spine: SpineOutput;
  bookWidthMm: number;
  bookHeightMm: number;
  frontPanelImage?: string;
  backPanelImage?: string;
  spineText?: string;
  spineImage?: string;
  // Production metadata for the dual-audience guide
  sizeCode?: string;
  pages?: number;
  paperCode?: string;
  paperCaliperMm?: number;
  boardCode?: string;
  boardThicknessMm?: number;
  coverFinish?: string;
  coverColor?: string;
  endpaperThicknessMm?: number;
  hingeAllowanceMm?: number;
}

const MM_TO_PT = 2.83465;

function readImageBuffer(src: string | undefined): Buffer | undefined {
  if (!src) return undefined;
  try {
    if (src.startsWith('data:')) {
      return Buffer.from(src.split(',')[1] ?? '', 'base64');
    }
    return fs.readFileSync(src);
  } catch {
    return undefined;
  }
}

interface PanelBoxes {
  backX: number; spineX: number; frontX: number;
  bleed: number; turnIn: number; spineW: number; panelW: number; panelH: number;
  pageW: number; pageH: number;
}

function computeLayout(input: CoverInput): PanelBoxes {
  const { spine, bookWidthMm, bookHeightMm } = input;
  const totalSpreadMm = bookWidthMm * 2 + spine.spineWidthMm + spine.turnInMm * 2;
  const pageW = (totalSpreadMm + spine.bleedMm * 2) * MM_TO_PT;
  const pageH = (bookHeightMm + spine.bleedMm * 2) * MM_TO_PT;

  const bleed  = spine.bleedMm * MM_TO_PT;
  const turnIn = spine.turnInMm * MM_TO_PT;
  const spineW = spine.spineWidthMm * MM_TO_PT;
  const panelW = bookWidthMm * MM_TO_PT;
  const panelH = bookHeightMm * MM_TO_PT;

  return {
    backX: bleed,
    spineX: bleed + panelW + turnIn,
    frontX: bleed + panelW + turnIn + spineW + turnIn,
    bleed, turnIn, spineW, panelW, panelH,
    pageW, pageH,
  };
}

/**
 * Page 1: Cover spread — rendered to fit A4 landscape for browser PDF viewer
 * compatibility. Page shows scaled cover with actual dimensions labeled.
 */
function drawCoverSpread(doc: PDFKit.PDFDocument, input: CoverInput, L: PanelBoxes) {
  const { spine, bookWidthMm, bookHeightMm, sizeCode } = input;

  // A4 landscape: 297 × 210 mm
  const a4W = 297 * MM_TO_PT;  // 841.89 pt
  const a4H = 210 * MM_TO_PT;  // 595.28 pt
  const spreadW = L.pageW - L.bleed;
  const spreadH = L.pageH - L.bleed;
  // Scale to fit A4 landscape, center on page
  const scale = Math.min(a4W / spreadW, a4H / spreadH);
  const scaledW = spreadW * scale;
  const scaledH = spreadH * scale;
  const offsetX = (a4W - scaledW) / 2;
  const offsetY = (a4H - scaledH) / 2;

  // Apply coordinate transform: shift + scale all drawing to fit A4
  doc.save();
  doc.translate(offsetX - L.bleed * scale, offsetY - L.bleed * scale);
  doc.scale(scale, scale);

  // ── 1. Artwork ─────────────────────────────────────────────────────────────
  const frontBuf = readImageBuffer(input.frontPanelImage);
  const backBuf  = readImageBuffer(input.backPanelImage);
  const spineBuf = readImageBuffer(input.spineImage);
  if (backBuf)  doc.image(backBuf,  L.backX,  L.bleed, { width: L.panelW, height: L.panelH, cover: [L.panelW, L.panelH] });
  if (spineBuf) doc.image(spineBuf, L.spineX, L.bleed, { width: L.spineW, height: L.panelH, cover: [L.spineW, L.panelH] });
  if (frontBuf) doc.image(frontBuf, L.frontX, L.bleed, { width: L.panelW, height: L.panelH, cover: [L.panelW, L.panelH] });

  // ── 2. Background tints ─────────────────────────────────────────────────
  if (!backBuf)  doc.rect(L.backX, L.bleed, L.panelW, L.panelH).fill('#f6f2ea');
  if (!spineBuf) doc.rect(L.spineX, L.bleed, L.spineW, L.panelH).fill('#ebe5d6');
  if (!frontBuf) doc.rect(L.frontX, L.bleed, L.panelW, L.panelH).fill('#faf7f0');

  // ── 3. Bleed boundary ────────────────────────────────────────────────────
  doc.strokeColor('#cccccc').lineWidth(0.5 / scale);
  doc.rect(L.bleed / 2, L.bleed / 2, L.pageW - L.bleed, L.pageH - L.bleed).stroke();

  // ── 4. Turn-in shading (opaque) ─────────────────────────────────────────
  doc.rect(L.spineX - L.turnIn, L.bleed, L.turnIn, L.panelH).fill('#d4cdc0');
  doc.rect(L.frontX, L.bleed, L.turnIn, L.panelH).fill('#d4cdc0');

  // ── 5. Fold lines ───────────────────────────────────────────────────────
  doc.strokeColor('#999999').lineWidth(0.4 / scale);
  doc.moveTo(L.spineX, L.bleed).lineTo(L.spineX, L.bleed + L.panelH).stroke();
  doc.moveTo(L.spineX + L.spineW, L.bleed).lineTo(L.spineX + L.spineW, L.bleed + L.panelH).stroke();

  // ── 6. Total spread dimension (bottom strip) ─────────────────────────────
  const totalY = L.pageH - 18;
  doc.fontSize(6 / scale).fillColor('#cc0000');
  doc.text(`${(bookWidthMm * 2 + spine.spineWidthMm + spine.turnInMm * 2).toFixed(1)} mm total spread`,
    L.bleed / 2, totalY - 10, { width: L.pageW - L.bleed, align: 'center', lineBreak: false });

  // ── 7. Panel labels ─────────────────────────────────────────────────────
  const lblSz = Math.min(11 / scale, Math.max(8 / scale, Math.floor(L.panelW / 20 / scale)));
  if (!backBuf) {
    doc.fontSize(lblSz).fillColor('#888888');
    doc.text('BACK', L.backX + 8, L.bleed + 10, { width: L.panelW - 16, lineBreak: false });
  }
  if (!frontBuf) {
    doc.fontSize(lblSz).fillColor('#888888');
    doc.text('FRONT', L.frontX + 8, L.bleed + 10, { width: L.panelW - 16, lineBreak: false });
  }
  if (!spineBuf && L.spineW > 18) {
    const ssz = Math.max(7 / scale, Math.min(10 / scale, Math.floor(L.spineW / 4 / scale)));
    doc.save();
    doc.translate(L.spineX + L.spineW / 2, L.bleed + L.panelH / 2);
    doc.rotate(90, { origin: [0, 0] });
    doc.fontSize(ssz).fillColor('#888888');
    doc.text('SPINE', -10, -4, { width: 20, align: 'center', lineBreak: false });
    doc.restore();
  }

  // ── 8. Spine text ───────────────────────────────────────────────────────
  if (input.spineText && L.spineW > 14) {
    const ssz = Math.max(7 / scale, Math.min(10 / scale, Math.floor(L.spineW * 0.38 / scale)));
    doc.save();
    doc.translate(L.spineX + L.spineW / 2, L.bleed + L.panelH / 2);
    doc.rotate(90, { origin: [0, 0] });
    doc.fontSize(ssz).fillColor('#333333');
    doc.text(input.spineText, -18, -4, { width: 36, align: 'center', lineBreak: false });
    doc.restore();
  }

  // ── 9. Size annotation at bottom of panels ──────────────────────────────
  const sfs = 7 / scale;
  const specY = L.bleed + L.panelH - 16 / scale;
  doc.fontSize(sfs).fillColor('#666666');
  doc.text(`${sizeCode ?? `${bookWidthMm}×${bookHeightMm}`} · ${bookWidthMm}×${bookHeightMm}mm`,
    L.backX + 8, specY, { width: L.panelW - 16, lineBreak: false });
  doc.text(`${sizeCode ?? `${bookWidthMm}×${bookHeightMm}`} · ${bookWidthMm}×${bookHeightMm}mm`,
    L.frontX + 8, specY, { width: L.panelW - 16, lineBreak: false });
  if (L.spineW > 18) {
    doc.save();
    doc.translate(L.spineX + L.spineW / 2, L.bleed + L.panelH / 2);
    doc.rotate(90, { origin: [0, 0] });
    doc.fontSize(sfs).fillColor('#777777');
    doc.text(`Spine ${spine.spineWidthMm.toFixed(1)} mm`, -22, -2, { width: 44, align: 'center', lineBreak: false });
    doc.restore();
  }

  doc.restore();
}

/**
 * Draw a dimension line with arrows at each end and a label centered above/beside it.
 * Used to mark precise cut/fold positions for the bindery.
 */
function drawDimensionLine(
  doc: PDFKit.PDFDocument,
  x1: number, y1: number,
  x2: number, y2: number,
  label: string,
  opts: { color?: string; fontSize?: number; vertical?: boolean } = {}
) {
  const color = opts.color ?? '#cc8800';
  const fontSize = opts.fontSize ?? 6;

  doc.save();
  doc.strokeColor(color).lineWidth(0.3);

  // Main line
  doc.moveTo(x1, y1).lineTo(x2, y2).stroke();

  // Arrow heads (small triangles) at each end
  const arrowLen = 4;
  const arrowAngle = Math.PI / 6; // 30°
  if (opts.vertical) {
    // Vertical line — arrows point left/right
    const dx = arrowLen * Math.cos(arrowAngle);
    const dy = arrowLen * Math.sin(arrowAngle);
    doc.moveTo(x1, y1).lineTo(x1 - dx, y1 - dy).stroke();
    doc.moveTo(x1, y1).lineTo(x1 - dx, y1 + dy).stroke();
    doc.moveTo(x2, y2).lineTo(x2 + dx, y2 - dy).stroke();
    doc.moveTo(x2, y2).lineTo(x2 + dx, y2 + dy).stroke();
    // Label (rotated to read along the line)
    doc.fontSize(fontSize).fillColor(color);
    doc.save();
    doc.translate(x1 - 8, (y1 + y2) / 2);
    doc.rotate(-90, { origin: [0, 0] });
    doc.text(label, 0, -3, { width: Math.abs(y2 - y1), align: 'center', lineBreak: false });
    doc.restore();
  } else {
    // Horizontal line — arrows point up/down
    const dx = arrowLen * Math.cos(arrowAngle);
    const dy = arrowLen * Math.sin(arrowAngle);
    doc.moveTo(x1, y1).lineTo(x1 - dx, y1 - dy).stroke();
    doc.moveTo(x1, y1).lineTo(x1 + dx, y1 - dy).stroke();
    doc.moveTo(x2, y2).lineTo(x2 - dx, y2 + dy).stroke();
    doc.moveTo(x2, y2).lineTo(x2 + dx, y2 + dy).stroke();
    // Label below the line (positive Y = down in PDF). Clamped so it never
    // escapes page bounds when dimension line sits in the bleed strip.
    doc.fontSize(fontSize).fillColor(color);
    const midX = (x1 + x2) / 2;
    let labelY = Math.max(y1, y2) + 1;
    const labelMaxY = doc.page.height - 2;
    if (labelY > labelMaxY) labelY = Math.min(y1, y2) - (fontSize + 1);
    doc.text(label, x1, labelY, { width: x2 - x1, align: 'center', lineBreak: false });
  }
  doc.restore();
}

/**
 * Page 2: Producer-facing technical sheet.
 * Materials, dimensions, fold/cut marks, tolerances — everything the bindery needs.
 */
function drawProducerSheet(doc: PDFKit.PDFDocument, input: CoverInput, L: PanelBoxes) {
  const { spine, bookWidthMm, bookHeightMm, sizeCode, pages, paperCode, paperCaliperMm, boardCode, boardThicknessMm, coverFinish, coverColor } = input;

  // A4 portrait: 210 × 297 mm
  const a4W = 210 * MM_TO_PT;
  const a4H = 297 * MM_TO_PT;
  const margin = 14 * MM_TO_PT;
  const contentW = a4W - margin * 2;
  const contentH = a4H - margin * 2;

  doc.addPage({ size: 'A4', margin });

  // Track our own y position. PDFKit's auto page-break interferes when we
  // position text absolutely — so we set doc.y/doc.x directly and avoid
  // text() doing its own lineBreak math.
  doc.x = margin;
  doc.y = margin;

  // Title
  doc.font('Helvetica-Bold').fontSize(16).fillColor('#1a1a1a');
  doc.text('BOOXURY — Production Spec Sheet', margin, margin, { width: contentW, lineBreak: false });
  doc.font('Helvetica').fontSize(9).fillColor('#666666');
  doc.text('Untuk tim produksi / bindery — acuan cetak, potong, dan lipat', margin, margin + 18, { width: contentW, lineBreak: false });

  // Divider
  doc.strokeColor('#cccccc').lineWidth(0.5);
  doc.moveTo(margin, margin + 32).lineTo(margin + contentW, margin + 32).stroke();

  let y = margin + 40;

  // Section: Identitas
  y = drawSection(doc, margin, y, contentW, 'Identitas', [
    ['Ukuran',         `${sizeCode ?? '—'} (${bookWidthMm} × ${bookHeightMm} mm)`],
    ['Jumlah halaman', pages != null ? `${pages} halaman` : '—'],
    ['Spine width',    `${spine.spineWidthMm.toFixed(2)} mm`],
    ['Total spread',   `${(bookWidthMm * 2 + spine.spineWidthMm + spine.turnInMm * 2).toFixed(1)} × ${(bookHeightMm + spine.bleedMm * 2).toFixed(1)} mm`],
  ]);

  // Section: Bahan
  y = drawSection(doc, margin, y + 8, contentW, 'Bahan', [
    ['Isi (kertas)',    paperCode ? `${paperCode}${paperCaliperMm ? ` · ${paperCaliperMm.toFixed(3)} mm` : ''}` : '—'],
    ['Hardcover board', boardCode ? `${boardCode}${boardThicknessMm ? ` · ${boardThicknessMm.toFixed(2)} mm` : ''}` : '—'],
    ['Cover finish',    coverFinish ? coverFinish.toUpperCase() : '—'],
    ['Warna cover',     coverColor ?? '—'],
  ]);

  // Section: Konstruksi
  y = drawSection(doc, margin, y + 8, contentW, 'Konstruksi', [
    ['Endpaper',     input.endpaperThicknessMm != null ? `${input.endpaperThicknessMm.toFixed(2)} mm × 2 lembar` : '0.12 mm × 2 lembar'],
    ['Hinge allowance', input.hingeAllowanceMm != null ? `${input.hingeAllowanceMm.toFixed(1)} mm` : '2.0 mm (PUR glue)'],
    ['Turn-in',      `${spine.turnInMm.toFixed(1)} mm di tiap sisi lipatan`],
    ['Bleed',        `${spine.bleedMm.toFixed(1)} mm di sekeliling cover luar`],
  ]);

  // Section: Rumus spine (for traceability)
  y = drawSection(doc, margin, y + 8, contentW, 'Rumus Spine (referensi)', [
    ['Formula',   'spineWidth = (pages/2)·caliper + board·2 + endpaper·2 + hinge'],
    ['Kalkulasi', `((${pages ?? 100}/2) × ${(paperCaliperMm ?? 0.095).toFixed(3)}) + (${(boardThicknessMm ?? 2.0).toFixed(2)} × 2) + (${(input.endpaperThicknessMm ?? 0.12).toFixed(2)} × 2) + ${(input.hingeAllowanceMm ?? 2.0).toFixed(1)} = ${spine.spineWidthMm.toFixed(2)} mm`],
  ]);

  // Section: Tanda potong & lipat (cut/fold marks)
  y += 12;
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#1a1a1a');
  doc.text('Tanda Potong & Lipat', margin, y, { width: contentW, lineBreak: false });
  y += 14;
  doc.font('Helvetica').fontSize(8).fillColor('#444444');
  const marks = [
    'Garis potong: di tepi luar bleed (3 mm di luar area artwork).',
    'Lipatan board ke endpaper: di sisi dalam panel belakang & depan.',
    'Lipatan spine: tepat di garis antara panel spine dan turn-in.',
    'Area aman (safe zone): artwork penting minimal 5 mm dari tepi potong.',
    'Warna bleed harus extend sampai batas bleed, bukan batas potong.',
  ];
  for (const line of marks) {
    doc.text('• ' + line, margin + 6, y, { width: contentW - 6, lineBreak: false });
    y += 10;
  }

  // Footer catatan (positioned at fixed bottom — within page bounds)
  doc.font('Helvetica-Oblique').fontSize(7.5).fillColor('#888888');
  doc.text(
    'Dokumen panduan cetak digital. Untuk produksi fisik, gunakan file artwork asli (300+ DPI).',
    margin, a4H - margin - 18, { width: contentW, lineBreak: false }
  );
  doc.text(
    `BOOXURY · ${sizeCode ?? ''} · ${pages ?? '?'} hal · Spine ${spine.spineWidthMm.toFixed(2)} mm`,
    margin, a4H - margin - 9, { width: contentW, align: 'right', lineBreak: false }
  );
}

/**
 * Draw a 2-column "label : value" section block.
 */
function drawSection(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  title: string,
  rows: Array<[string, string]>,
): number {
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#1a1a1a');
  doc.text(title, x, y, { width: w, lineBreak: false });
  y += 14;

  const labelW = 90;
  const valueW = w - labelW;

  doc.font('Helvetica').fontSize(9).fillColor('#333333');
  for (const [label, value] of rows) {
    doc.font('Helvetica').fillColor('#666666');
    doc.text(label, x, y, { width: labelW, lineBreak: false });
    doc.font('Helvetica').fillColor('#1a1a1a');
    doc.text(value, x + labelW, y, { width: valueW, lineBreak: false });
    y += 13;
  }
  return y;
}

/**
 * Generate a 2-page Blueprint PDF:
 *   Page 1: Cover spread with artwork (customer view)
 *   Page 2: Production spec sheet (producer view)
 * Returns as Buffer. No file I/O — caller decides how to dispose.
 */
export function generateCoverPdfBuffer(input: CoverInput): Promise<Buffer> {
  return new Promise((resolve) => {
    const L = computeLayout(input);

    const doc = new PDFDocument({
      size: [L.pageW, L.pageH],
      margin: 0,
      info: {
        Title: `BOOXURY Blueprint — ${input.sizeCode ?? `${input.bookWidthMm}x${input.bookHeightMm}`}`,
        Author: 'BOOXURY',
        Subject: 'Cover Blueprint & Production Spec Sheet',
        Creator: 'BOOXURY PDF Engine',
        Producer: 'BOOXURY PDF Engine',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    drawCoverSpread(doc, input, L);
    drawProducerSheet(doc, input, L);

    doc.end();
  });
}

export function generateCoverPdf(input: CoverInput, outPath: string): Promise<void> {
  return generateCoverPdfBuffer(input).then(buf => {
    fs.writeFileSync(outPath, buf);
  });
}

/**
 * Render the cover spread page (page 1) to a PNG Buffer.
 * Uses pdftoppm — requires poppler-utils installed on the system.
 * Returns undefined if pdftoppm is not available.
 */
export async function generateCoverPreviewPng(input: CoverInput, dpi = 150): Promise<Buffer | undefined> {
  const pdfBuf = await generateCoverPdfBuffer(input);
  const ts = Date.now();
  const tmpPdf = `/tmp/bp-pdf-${ts}.pdf`;
  const tmpPng = `/tmp/bp-png-${ts}.png`;
  const outBase = `/tmp/bp-png-${ts}`;
  fs.writeFileSync(tmpPdf, pdfBuf);
  let pngPath = '';
  try {
    const { spawnSync } = require('child_process');
    const result = spawnSync('/usr/bin/pdftoppm', ['-r', String(dpi), '-png', '-f', '1', '-l', '1', tmpPdf, outBase], { encoding: 'utf8' });
    // pdftoppm outputs: {outBase}-1.png (e.g. /tmp/bp-png-123-1.png)
    const pngPath = outBase + '-1.png';
    if (result.status !== 0 || !fs.existsSync(pngPath)) {
      return undefined;
    }
    const pngBuf = fs.readFileSync(pngPath);
    return pngBuf;
  } catch (e) {
    console.error('pdftoppm exception:', e);
    return undefined;
  } finally {
    try { fs.unlinkSync(tmpPdf); } catch { /* ok */ }
    try { fs.unlinkSync(pngPath); } catch { /* ok */ }
  }
}
