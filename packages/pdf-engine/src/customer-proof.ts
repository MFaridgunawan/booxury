import PDFDocument from 'pdfkit';
import { SpineOutput, calculateSpine } from '@booxury/spine-calc';
import * as fs from 'fs';
import { buildBookSvg, renderBookPng } from './book-visual';

// ── Input ──────────────────────────────────────────────────────────────────
export interface CustomerProofInput {
  sizeCode: string; bookWidthMm: number; bookHeightMm: number; pages: number;
  paperCode: string; boardCode: string; coverFinish: string; coverColor: string;
  coverTextureUrl?: string; spineText?: string; endpaperCode?: string;
  cornerShape?: string; edgeFinish?: string; hasDustJacket?: boolean;
  headbandCode?: string; ribbonCodes?: string[];
  paperCaliperMm?: number; boardThicknessMm?: number; layout?: string;
}

const MM_TO_PT = 2.83465;
const BOOXURY_GOLD  = '#C4A35A';
const BOOXURY_DARK  = '#1a1a1a';
const BOOXURY_CREAM = '#faf6ed';
const PAGE_BG       = '#fcfaf5';
const LINE_COLOR    = '#d4c9a8';

const LABEL: Record<string, string> = {
  doff:'Laminasi Doff',glossy:'Laminasi Glossy',canvas:'Kanvas / Linen',leatherette:'Leatherette',
  square:'Siku',round:'Membulat',
  plain:'Polos',lined:'Bergaris',
  gilded_gold:'Gilded Emas',gilded_silver:'Gilded Perak', sprayed_red:'Sprayed Merah',sprayed_blue:'Sprayed Biru',stenciled:'Stenciled',
  ENDPLAIN:'Polos',ENDFLAT:'Flat',ENDPAT:'Bermotif',
  hb_merah:'Merah',hb_hitam:'Hitam',hb_emas:'Emas',hb_putih:'Putih',
  rb_merah:'Merah',rb_emas:'Emas',rb_hijau:'Hijau',rb_biru:'Biru',rb_hitam:'Hitam',
  BOOK57:'Bookpaper 57 gsm',BOOK72:'Bookpaper 72 gsm',BOOK90:'Bookpaper 90 gsm',
  HVS70:'HVS 70 gsm',HVS80:'HVS 80 gsm',HVS100:'HVS 100 gsm',
  ART120:'Art Paper 120 gsm',ART150:'Art Paper 150 gsm',
  MATT120:'Matt Paper 120 gsm',MATT150:'Matt Paper 150 gsm',
  BOARD14:'Greyboard 1.4 mm',BOARD18:'Greyboard 1.8 mm',BOARD20:'Greyboard 2.0 mm',BOARD25:'Greyboard 2.5 mm',
};
function L(c:string|undefined):string{return c?LABEL[c]??c:'—'}

const RIBBON_COLORS: Record<string,string> = { rb_merah:'#b71c1c',rb_emas:'#d4af37',rb_hijau:'#1b5e20',rb_biru:'#1565c0',rb_hitam:'#333' };
const HEADBAND_COLORS: Record<string,string> = { hb_merah:'#b71c1c',hb_hitam:'#333',hb_emas:'#d4af37',hb_putih:'#f5f5f5' };
const EDGE_COLORS: Record<string,string> = { gilded_gold:'#d4af37',gilded_silver:'#c0c0c0',sprayed_red:'#b71c1c',sprayed_blue:'#1565c0',stenciled:'#8d6e63' };

function readImageBuffer(src: string | undefined): Buffer | undefined {
  if (!src) return undefined;
  try {
    if (src.startsWith('data:')) return Buffer.from(src.split(',')[1] ?? '', 'base64');
    return fs.readFileSync(src);
  } catch { return undefined; }
}

// ── Watermark ──────────────────────────────────────────────────────────────
function drawWatermark(doc: PDFKit.PDFDocument, pageW: number, pageH: number, opacity = 0.03) {
  doc.save();
  doc.fillColor('#000').fillOpacity(opacity);
  doc.font('Helvetica-Bold').fontSize(pageW * 0.13);
  const wm = 'BOOXURY';
  const tw = doc.widthOfString(wm);
  doc.text(wm, (pageW - tw) / 2, pageH / 2 - pageW * 0.06, { lineBreak: false });
  doc.fillOpacity(1);
  doc.restore();
}

// ── Gold accent line ───────────────────────────────────────────────────────
function goldLine(doc: PDFKit.PDFDocument, x: number, y: number, w: number) {
  doc.strokeColor(BOOXURY_GOLD).lineWidth(1.5);
  doc.moveTo(x, y).lineTo(x + w, y).stroke();
}

// ── Dimension arrows ───────────────────────────────────────────────────────
function dimH(doc: PDFKit.PDFDocument, x1: number, y: number, x2: number, label: string, color = '#0066cc', fs = 5) {
  const al = 5; doc.save(); doc.strokeColor(color).lineWidth(0.5).fillColor(color);
  doc.moveTo(x1, y).lineTo(x2, y).stroke();
  doc.moveTo(x1, y).lineTo(x1 + al, y - 3).lineTo(x1 + al, y + 3).fill();
  doc.moveTo(x2, y).lineTo(x2 - al, y - 3).lineTo(x2 - al, y + 3).fill();
  doc.fontSize(fs).text(label, x1, y - 10, { width: x2 - x1, align: 'center', lineBreak: false }); doc.restore();
}
function dimV(doc: PDFKit.PDFDocument, x: number, y1: number, y2: number, label: string, color = '#0066cc', fs = 5) {
  const al = 5; doc.save(); doc.strokeColor(color).lineWidth(0.5).fillColor(color);
  doc.moveTo(x, y1).lineTo(x, y2).stroke();
  doc.moveTo(x, y1).lineTo(x - 3, y1 + al).lineTo(x + 3, y1 + al).fill();
  doc.moveTo(x, y2).lineTo(x - 3, y2 - al).lineTo(x + 3, y2 - al).fill();
  doc.save(); doc.translate(x + 8, (y1 + y2) / 2); doc.rotate(-90, { origin: [0, 0] });
  doc.fontSize(fs).text(label, 0, -3, { width: Math.abs(y2 - y1), align: 'center', lineBreak: false });
  doc.restore(); doc.restore();
}

// ── Footer ─────────────────────────────────────────────────────────────────
function footer(doc: PDFKit.PDFDocument, pageW: number, pageH: number) {
  doc.y = 0;
  doc.font('Helvetica').fontSize(7).fillColor('#999');
  doc.text('Preview desain — belum file produksi', 20, pageH - 16, { width: pageW - 40, align: 'center', lineBreak: false });
  doc.y = 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE 1 — Cover Final (on its native size, rich presentation)
// ═══════════════════════════════════════════════════════════════════════════
function page1_CoverFinal(doc: PDFKit.PDFDocument, input: CustomerProofInput, spine: SpineOutput) {
  const { bookWidthMm, bookHeightMm, coverColor, coverTextureUrl } = input;
  const pageW = (bookWidthMm + spine.bleedMm * 2) * MM_TO_PT;
  const pageH = (bookHeightMm + spine.bleedMm * 2) * MM_TO_PT;
  const b = spine.bleedMm * MM_TO_PT;
  const pw = bookWidthMm * MM_TO_PT, ph = bookHeightMm * MM_TO_PT;

  // Background with subtle gradient bands
  doc.rect(0, 0, pageW, pageH).fill(coverColor);
  // subtle vignette
  doc.rect(b, b, pw, ph).fillOpacity(0.15).fill('#000'); doc.fillOpacity(1);

  // Artwork
  const art = readImageBuffer(coverTextureUrl);
  if (art) doc.image(art, b, b, { width: pw, height: ph, fit: [pw, ph], align: 'center', valign: 'center' });

  // Safe area
  const sm = 5 * MM_TO_PT; doc.save(); doc.strokeColor('#ffffff33').lineWidth(0.6); doc.dash(4, { space: 3 });
  doc.rect(b + sm, b + sm, pw - sm * 2, ph - sm * 2).stroke(); doc.restore();

  // Gold corner accents (4 corners)
  const cl = 20; doc.strokeColor(BOOXURY_GOLD).lineWidth(1.2).fillColor(BOOXURY_GOLD);
  const corners = [[b, b], [b + pw - cl, b], [b, b + ph - cl], [b + pw - cl, b + ph - cl]];
  corners.forEach(([cx, cy]) => {
    doc.moveTo(cx, cy).lineTo(cx + cl, cy).lineTo(cx + cl, cy + 3).lineTo(cx + 3, cy + 3).lineTo(cx + 3, cy + cl).lineTo(cx, cy + cl).fill();
  });

  // Title BOOXURY centered
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#ffffffcc');
  doc.text('B O O X U R Y', b, b + ph * 0.55, { width: pw, align: 'center', lineBreak: false });

  // Dimensions — subtle bottom-right
  doc.fontSize(6).fillColor('#ffffff55');
  doc.text(`${bookWidthMm} × ${bookHeightMm} mm  ·  ${input.sizeCode}`, b, pageH - 14, { width: pw, align: 'right', lineBreak: false });
  footer(doc, pageW, pageH);
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE 2 — Blueprint Spread (A4 Landscape)
// ═══════════════════════════════════════════════════════════════════════════
function page2_Spread(doc: PDFKit.PDFDocument, input: CustomerProofInput, spine: SpineOutput) {
  const { bookWidthMm, bookHeightMm, coverColor, spineText } = input;
  const pw = doc.page.width, ph = doc.page.height;
  const bM = spine.bleedMm, tM = spine.turnInMm, sM = spine.spineWidthMm, pWM = bookWidthMm, pHM = bookHeightMm;
  const totW = pWM * 2 + sM + tM * 2 + bM * 2, totH = pHM + bM * 2;
  const mg = 20; const sc = Math.min((pw - mg * 2) / totW, (ph - mg * 2) / totH);
  const ox = mg, oy = (ph - totH * sc) / 2;
  const s = (mm: number) => mm * sc;
  const bx = ox + s(bM), ssx = ox + s(bM + pWM + tM), fx = ox + s(bM + pWM + tM + sM + tM);
  const sPW = s(pWM), sPH = s(pHM), sSW = s(sM), sTI = s(tM), sBL = s(bM), sTW = s(totW), sTH = s(totH);

  // Blueprint paper bg
  doc.rect(0, 0, pw, ph).fill('#dbe2ea');
  drawWatermark(doc, pw, ph, 0.04);
  // Grid dots (blueprint feel)
  doc.fillColor('#8899aa22'); for (let gx = 20; gx < pw; gx += 30) for (let gy = 20; gy < ph; gy += 30) doc.circle(gx, gy, 1).fill();

  // Panels
  doc.rect(bx, oy + sBL, sPW, sPH).fill(coverColor);
  doc.fontSize(9).fillColor('#ffffffcc');
  doc.text('BELAKANG', bx, oy + sBL + sPH / 2 - 8, { width: sPW, align: 'center', lineBreak: false });
  doc.text('(belum dikustomisasi)', bx, oy + sBL + sPH / 2 + 3, { width: sPW, align: 'center', lineBreak: false });

  doc.rect(ssx, oy + sBL, sSW, sPH).fill(coverColor);
  if (spineText && sSW > 6) { doc.save(); doc.translate(ssx + sSW / 2, oy + sBL + sPH / 2); doc.rotate(90, { origin: [0, 0] });
    doc.fontSize(9).fillColor('#ffffffcc'); doc.text(spineText, -14, -3, { width: 28, align: 'center', lineBreak: false }); doc.restore(); }

  doc.rect(fx, oy + sBL, sPW, sPH).fill(coverColor);
  const art = readImageBuffer(input.coverTextureUrl);
  if (art) doc.image(art, fx, oy + sBL, { width: sPW, height: sPH, fit: [sPW, sPH], align: 'center', valign: 'center' });
  else { doc.fontSize(9).fillColor('#ffffffcc'); doc.text('DEPAN', fx, oy + sBL + sPH / 2 - 8, { width: sPW, align: 'center', lineBreak: false });
    doc.text('(cover desain)', fx, oy + sBL + sPH / 2 + 3, { width: sPW, align: 'center', lineBreak: false }); }

  // Turn-in + fold
  doc.rect(ssx - sTI, oy + sBL, sTI, sPH).fill('#00000022'); doc.rect(fx, oy + sBL, sTI, sPH).fill('#00000022');
  doc.strokeColor('#ff6600').lineWidth(0.6); doc.moveTo(ssx, oy + sBL).lineTo(ssx, oy + sBL + sPH).stroke();
  doc.moveTo(ssx + sSW, oy + sBL).lineTo(ssx + sSW, oy + sBL + sPH).stroke();

  // Safe / bleed
  const safeS = s(5); doc.strokeColor('#00cc00').lineWidth(0.3); doc.dash(2, { space: 2 });
  doc.rect(fx + safeS, oy + sBL + safeS, sPW - safeS * 2, sPH - safeS * 2).stroke(); doc.undash();
  doc.strokeColor('#cc0000').lineWidth(0.4); doc.rect(ox, oy, sTW, sTH).stroke();

  // Dimension labels
  const topY = oy + sBL - 12; if (topY > 0) { dimH(doc, fx, topY, fx + sPW, `${pWM} mm`); dimH(doc, ssx, topY, ssx + sSW, `${sM.toFixed(1)} mm`, '#cc6600'); }
  dimH(doc, ssx - sTI, oy + sBL - 6, ssx, `${tM} mm`, '#888', 4);
  dimV(doc, fx + sPW + 2, oy + sBL, oy + sBL + sPH, `${pHM} mm`);
  doc.fontSize(5).fillColor('#333');
  doc.text(`Total spread: ${totW.toFixed(1)} × ${totH.toFixed(1)} mm`, ox, oy + sTH + 4, { width: sTW, align: 'center', lineBreak: false });

  // Legend box
  const lgx = pw - 200, lgy = ph - 100;
  doc.rect(lgx, lgy, 180, 80).fill('#ffffffaa').stroke('#999');
  doc.fontSize(7).fillColor('#333');
  doc.text('🟠 Fold line    🟢 Safe area', lgx + 8, lgy + 8, { lineBreak: false });
  doc.text('🔴 Bleed        💛 BOOXURY', lgx + 8, lgy + 22, { lineBreak: false });

  footer(doc, pw, ph);
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE 3 — Interior + Paper + Endsheet detail (A4)
// ═══════════════════════════════════════════════════════════════════════════
function page3_Interior(doc: PDFKit.PDFDocument, input: CustomerProofInput) {
  const { bookWidthMm, bookHeightMm, pages, layout, paperCode, endpaperCode } = input;
  const pw = doc.page.width, ph = doc.page.height, mg = 36, cw = pw - mg * 2;

  doc.font('Helvetica-Bold').fontSize(18).fillColor(BOOXURY_DARK);
  doc.text('Isi Buku & Material', mg, 44, { width: cw, lineBreak: false }); doc.y = 0;
  goldLine(doc, mg, 64, cw * 0.35);
  doc.font('Helvetica').fontSize(9).fillColor('#666');
  doc.text(`${pages} halaman  ·  ${L(paperCode)}  ·  Layout ${L(layout)}`, mg, 72, { width: cw, lineBreak: false }); doc.y = 0;

  // Two sample pages side by side
  const sc = Math.min((cw - 16) / (bookWidthMm * 2 + 10), (ph - 220) / (bookHeightMm + 30));
  const pW = bookWidthMm * sc, pH = bookHeightMm * sc, pm = 8 * sc;
  const baseY = 92;

  for (let i = 0; i < 2; i++) {
    const x = mg + 8 + (i === 0 ? 0 : pW + 10);
    const y = baseY;
    doc.rect(x + 2, y + 2, pW, pH).fill('#e0d9c8'); doc.rect(x, y, pW, pH).fill(PAGE_BG);

    // Only draw writing lines for LINED layout
    if (layout === 'lined') {
      const lh = 8 * sc; doc.strokeColor('#d0c8b0').lineWidth(0.15);
      let ly = y + pm; while (ly + lh <= y + pH - pm) { doc.moveTo(x + pm, ly + lh).lineTo(x + pW - pm, ly + lh).stroke(); ly += lh; }
    }

    // Image placeholder
    const ix = x + pm, iy = y + pm, iw = pW - pm * 2, ih = pH * 0.3;
    doc.strokeColor('#c4b99a').lineWidth(0.3); doc.dash(3, { space: 2 }); doc.rect(ix, iy, iw, ih).stroke(); doc.undash();
    doc.fontSize(5 * sc).fillColor('#b0a68a'); doc.text('Area Gambar', ix, iy + ih / 2 - 4, { width: iw, align: 'center', lineBreak: false });

    // Text body below image — only for LINED, show paragraph lines; for PLAIN, leave blank area
    if (layout === 'lined') {
      const ty = iy + ih + 5 * sc; const lc = Math.floor((pH - pm - (ty - y)) / (5 * sc));
      doc.strokeColor('#d8cfb8').lineWidth(0.12);
      for (let l = 0; l < lc; l++) { const ly = ty + l * 5 * sc; doc.moveTo(ix, ly).lineTo(ix + (l === lc - 1 ? iw * 0.35 : iw), ly).stroke(); }
    } else {
      // Plain: show subtle paragraph block indicator (empty space, natural)
      const ty = iy + ih + 5 * sc;
      doc.fontSize(4 * sc).fillColor('#ccc');
      doc.text('(halaman polos — tanpa garis)', ix, ty + 8 * sc, { width: iw, align: 'center', lineBreak: false });
    }

    doc.fontSize(5 * sc).fillColor('#b0a68a'); doc.text(`${i === 0 ? 1 : pages}`, x, y + pH - 5 * sc, { width: pW, align: 'center', lineBreak: false });
    doc.fontSize(6).fillColor('#666'); doc.text(`Hlm ${i === 0 ? 1 : pages}`, x, y + pH + 4, { width: pW, align: 'center', lineBreak: false });
  }

  // ── Kertas detail ──
  const ky = baseY + pH + 28; doc.y = 0;
  goldLine(doc, mg, ky, cw * 0.2);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(BOOXURY_DARK);
  doc.text('Kertas Isi', mg, ky + 8, { width: cw, lineBreak: false }); doc.y = 0;
  doc.font('Helvetica').fontSize(9).fillColor('#444');
  doc.text(`Jenis      : ${L(paperCode)}`, mg, ky + 26, { lineBreak: false }); doc.y = 0;
  doc.text(`Ketebalan  : ${(input.paperCaliperMm ?? 0.095).toFixed(2)} mm per lembar`, mg, ky + 40, { lineBreak: false }); doc.y = 0;
  doc.text(`Warna      : ${paperCode?.startsWith('BOOK') ? 'Krem (kertas bookpaper)' : paperCode?.startsWith('HVS') ? 'Putih (HVS)' : paperCode?.startsWith('ART') ? 'Glossy putih' : 'Doff putih'}`, mg, ky + 54, { lineBreak: false }); doc.y = 0;
  doc.text(`Layout     : ${layout === 'lined' ? 'Bergaris — cocok untuk tulis tangan, jurnal, notes' : 'Polos — cocok untuk novel, biografi, teks panjang'}`, mg, ky + 68, { lineBreak: false }); doc.y = 0;

  // ── Endsheet ──
  const ey = ky + 96; doc.y = 0;
  goldLine(doc, mg, ey, cw * 0.2);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(BOOXURY_DARK);
  doc.text('Endsheet / Endpaper', mg, ey + 8, { width: cw, lineBreak: false }); doc.y = 0;
  doc.font('Helvetica').fontSize(9).fillColor('#444');
  const epType = endpaperCode === 'ENDPAT' ? 'Bermotif (full-color)' : endpaperCode === 'ENDFLAT' ? 'Flat — warna solid' : 'Polos — putih bersih';
  doc.text(`Tipe       : ${L(endpaperCode)} — ${epType}`, mg, ey + 26, { lineBreak: false }); doc.y = 0;
  doc.text(`Fungsi     : Perekat antara cover hardcover dan blok isi buku (2 lembar: depan + belakang)`, mg, ey + 40, { lineBreak: false }); doc.y = 0;
  doc.text(`Ketebalan  : 0.12 mm × 2 lembar`, mg, ey + 54, { lineBreak: false }); doc.y = 0;

  footer(doc, pw, ph);
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE 4 — Spec Summary with ribbon/headband/dustjacket/greyboard detail (A4)
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// PAGE 4 — Full Book 3D ISOMETRIC illustration with numbered callouts
// ═══════════════════════════════════════════════════════════════════════════
function page4_FullBook(doc: PDFKit.PDFDocument, input: CustomerProofInput, spine: SpineOutput, bookPng?: Buffer) {
  const mg = 40, pw = doc.page.width, ph = doc.page.height, cw = pw - mg * 2;

  doc.font('Helvetica-Bold').fontSize(18).fillColor(BOOXURY_DARK);
  doc.text('Tampak Buku — 3D View Semua Komponen', mg, 44, { width: cw, lineBreak: false }); doc.y = 0;
  goldLine(doc, mg, 64, cw * 0.3);
  doc.font('Helvetica').fontSize(9).fillColor('#888');
  doc.text('Render 3D isometrik dengan rincian setiap komponen', mg, 72, { width: cw, lineBreak: false }); doc.y = 0;

  const hc = input.headbandCode ? HEADBAND_COLORS[input.headbandCode] ?? '#b71c1c' : null;
  const firstRibbon = input.ribbonCodes?.[0];
  const rc = firstRibbon ? RIBBON_COLORS[firstRibbon] ?? '#b71c1c' : null;
  const art = input.coverTextureUrl ? readImageBuffer(input.coverTextureUrl) : undefined;

  // ═══ Render 3D book PNG (SVG → sharp) on the left ═══
  if (bookPng) {
    const imgW = 300;
    const imgH = Math.round(imgW * (511 / 617)); // aspect from book-visual viewBox
    doc.image(bookPng, mg + 6, 96, { width: imgW, height: imgH, fit: [imgW, imgH] });
  }

  // ═══ Legend list (right column) ═══
  const lx = 360, lw = pw - mg - lx;
  let ly = 96;
  const items: Array<[number, string, string]> = [
    [1, 'Cover Depan', `${L(input.coverFinish)} — ${input.coverColor}${art ? ' + artwork Anda' : ''}`],
    [2, 'Spine / Punggung', `${spine.spineWidthMm.toFixed(1)} mm — "${input.spineText ?? 'BOOXURY'}"`],
  ];
  if (hc) items.push([3, 'Headband', `${L(input.headbandCode)} — kain dekoratif ujung spine`]);
  if (rc) items.push([4, 'Pita / Ribbon', `${input.ribbonCodes?.map(c => L(c)).join(', ')} — penanda halaman`]);
  if (input.edgeFinish && input.edgeFinish !== 'plain') items.push([5, 'Edge Finish', `${L(input.edgeFinish)} — finishing sisi blok halaman`]);
  else items.push([5, 'Edge Blok', 'Polos — sisi halaman natural']);
  items.push([6, 'Greyboard', `${L(input.boardCode)} — ${input.boardThicknessMm ?? 2.0}mm, inti hardcover`]);
  items.push([7, 'Endsheet', `${L(input.endpaperCode)} — perekat cover-blok isi, 2 lembar`]);
  items.push([8, 'Blok Isi', `${input.pages} hlm — ${L(input.paperCode)}, ${L(input.layout)}`]);

  for (const [n, title, desc] of items) {
    doc.circle(lx + 8, ly + 6, 8).fill(BOOXURY_GOLD).stroke('#8a7340');
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#fff');
    doc.text(String(n), lx + 4, ly + 3, { width: 8, align: 'center', lineBreak: false }); doc.y = 0;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(BOOXURY_DARK);
    doc.text(title, lx + 22, ly, { width: lw - 22, lineBreak: false }); doc.y = 0;
    doc.font('Helvetica').fontSize(7).fillColor('#666');
    doc.text(desc, lx + 22, ly + 12, { width: lw - 22, lineBreak: false }); doc.y = 0;
    ly += (ly > 600 ? 32 : 34); // tighter spacing if running low
  }

  footer(doc, pw, ph);
  doc.y = 0;
}

function page4_Spec(doc: PDFKit.PDFDocument, input: CustomerProofInput, spine: SpineOutput) {
  const mg = 40, cw = doc.page.width - mg * 2, ph = doc.page.height;
  doc.font('Helvetica-Bold').fontSize(18).fillColor(BOOXURY_DARK);
  doc.text('Spesifikasi & Detail Komponen', mg, 44, { width: cw, lineBreak: false }); doc.y = 0;
  goldLine(doc, mg, 64, cw * 0.3);
  doc.font('Helvetica').fontSize(9).fillColor('#888');
  doc.text(`BOOXURY Proof  ·  ${input.sizeCode}  ·  ${input.pages} halaman`, mg, 72, { width: cw, lineBreak: false }); doc.y = 0;
  let y = 94;

  // ── Dimension ──
  y = section(doc, mg, y, cw, 'Dimensi & Cover');
  y = row(doc, mg, y, cw, 'Ukuran', `${input.sizeCode} — ${input.bookWidthMm} × ${input.bookHeightMm} mm`);
  y = row(doc, mg, y, cw, 'Halaman', `${input.pages} hlm (${input.pages / 2} lembar)`);
  y = row(doc, mg, y, cw, 'Spine', `${spine.spineWidthMm.toFixed(2)} mm`);
  y = row(doc, mg, y, cw, 'Cover Finish', `${L(input.coverFinish)} — ${input.coverColor}`);

  // Greyboard — mini illustration beside text
  y = section(doc, mg, y, cw, 'Greyboard');
  doc.rect(mg + 112, y - 6, 50, 10).fill('#9B8465').stroke('#6b5a42'); doc.y = 0;
  y = row(doc, mg, y, cw, 'Material', `${L(input.boardCode)} — ${(input.boardThicknessMm ?? 2.0).toFixed(1)} mm`);

  // Kertas
  y = section(doc, mg, y, cw, 'Kertas Isi');
  y = row(doc, mg, y, cw, 'Jenis', L(input.paperCode));
  y = row(doc, mg, y, cw, 'Ketebalan', `${(input.paperCaliperMm ?? 0.095).toFixed(3)} mm/lembar`);
  y = row(doc, mg, y, cw, 'Layout', L(input.layout));

  // Endsheet — mini illustration
  y = section(doc, mg, y, cw, 'Endsheet / Endpaper');
  const epCol = input.endpaperCode === 'ENDPAT' ? '#d4c9a8' : input.endpaperCode === 'ENDFLAT' ? '#c4b99a' : '#faf6ed';
  doc.rect(mg + 112, y - 6, 50, 10).fill(epCol).stroke('#c4b99a'); doc.y = 0;
  if (input.endpaperCode === 'ENDPAT') { doc.fillColor('#b0a080'); for (let px = mg + 116; px < mg + 156; px += 6) doc.circle(px, y - 1, 1).fill(); }
  y = row(doc, mg, y, cw, 'Tipe', L(input.endpaperCode));

  // Finishing
  const hasFin = input.cornerShape !== 'square' || input.edgeFinish !== 'plain' || input.hasDustJacket;
  if (hasFin) {
    y = section(doc, mg, y, cw, 'Finishing');
    if (input.cornerShape && input.cornerShape !== 'square') y = row(doc, mg, y, cw, 'Sudut', L(input.cornerShape));
    if (input.edgeFinish && input.edgeFinish !== 'plain') y = row(doc, mg, y, cw, 'Edge', L(input.edgeFinish));
    if (input.hasDustJacket) y = row(doc, mg, y, cw, 'Dust Jacket', 'Ya');
  }

  // Headband — illustration: spine + colored strip
  if (input.headbandCode) {
    y = section(doc, mg, y, cw, 'Headband');
    const hc = HEADBAND_COLORS[input.headbandCode] ?? '#333';
    doc.rect(mg + 112, y - 6, 8, 16).fill('#9B8465').stroke('#6b5a42'); doc.y = 0;
    doc.rect(mg + 110, y - 6, 12, 5).fill(hc).stroke('#6b5a42'); doc.y = 0;
    doc.rect(mg + 110, y + 5, 12, 5).fill(hc).stroke('#6b5a42'); doc.y = 0;
    y = row(doc, mg, y, cw, 'Warna', L(input.headbandCode));
  }

  // Ribbon — illustration: spine + hanging ribbon
  if (input.ribbonCodes && input.ribbonCodes.length > 0) {
    y = section(doc, mg, y, cw, 'Pita / Ribbon');
    input.ribbonCodes.forEach((rc, i) => {
      const rcx = mg + 112 + i * 30, rcy = y - 6;
      const rc2 = RIBBON_COLORS[rc] ?? '#b71c1c';
      doc.rect(rcx, rcy, 6, 20).fill('#9B8465').stroke('#6b5a42'); doc.y = 0;
      doc.strokeColor(rc2).lineWidth(2);
      doc.moveTo(rcx + 3, rcy + 4).lineTo(rcx + 6, rcy + 22).stroke(); doc.y = 0;
      doc.moveTo(rcx + 3, rcy + 4).lineTo(rcx, rcy + 20).stroke(); doc.y = 0;
      doc.moveTo(rcx + 6, rcy + 22).lineTo(rcx + 3, rcy + 28).lineTo(rcx + 9, rcy + 28).fill(rc2); doc.y = 0;
      y = row(doc, mg, y, cw, `Pita ${i + 1}`, L(rc));
    });
  }

  y += 8; doc.y = 0;
  doc.font('Helvetica-Oblique').fontSize(7).fillColor('#aaa');
  doc.text('Disclaimer: Proof desain — bukan file produksi siap cetak. Warna monitor dapat berbeda dari hasil cetak.', mg, y, { width: cw, lineBreak: false }); doc.y = 0;
  footer(doc, doc.page.width, ph - 40); // -40: respect page bottom margin
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE 5 — Illustrated Component Breakdown (greyboard, endpaper, ribbon, headband)
// ═══════════════════════════════════════════════════════════════════════════
// ── Section / Row helpers ──────────────────────────────────────────────────
function section(doc: PDFKit.PDFDocument, x: number, y: number, w: number, title: string): number {
  doc.font('Helvetica-Bold').fontSize(10).fillColor(BOOXURY_DARK);
  doc.text(title, x, y, { width: w, lineBreak: false });
  doc.y = 0; // CRITICAL: prevent auto-page-break accumulation
  doc.strokeColor(BOOXURY_GOLD).lineWidth(0.6);
  doc.moveTo(x, y + 12).lineTo(x + w * 0.25, y + 12).stroke();
  return y + 18;
}
function row(doc: PDFKit.PDFDocument, x: number, y: number, w: number, lbl: string, val: string): number {
  const lw = 100; doc.font('Helvetica').fontSize(9).fillColor('#555');
  doc.text(lbl, x, y, { width: lw, lineBreak: false });
  doc.fillColor('#222').text(val, x + lw, y, { width: w - lw, lineBreak: false });
  doc.y = 0; return y + 17;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
export async function generateCustomerProofPdf(input: CustomerProofInput): Promise<Buffer> {
  const dims = { widthMm: input.bookWidthMm, heightMm: input.bookHeightMm };
  const spine = calculateSpine({
    pages: input.pages, paperCaliperMm: input.paperCaliperMm ?? 0.095,
    boardThicknessMm: input.boardThicknessMm ?? 2.0, endpaperThicknessMm: 0.12, hingeAllowanceMm: 2.0,
  }, dims);

  const coverW = (input.bookWidthMm + spine.bleedMm * 2) * MM_TO_PT;
  const coverH = (input.bookHeightMm + spine.bleedMm * 2) * MM_TO_PT;

  // Build the 3D book illustration synchronously to PNG (SVG → sharp)
  let bookPng: Buffer | undefined;
  try {
    const firstRibbon = input.ribbonCodes?.[0];
    const svg = buildBookSvg({
      bookWidthMm: input.bookWidthMm, bookHeightMm: input.bookHeightMm, spineMm: spine.spineWidthMm,
      coverColor: input.coverColor || '#1a1a1a', coverTextureUrl: input.coverTextureUrl,
      spineText: input.spineText || 'BOOXURY', edgeFinish: input.edgeFinish,
      headbandColor: input.headbandCode ? HEADBAND_COLORS[input.headbandCode] : undefined,
      ribbonColor: firstRibbon ? RIBBON_COLORS[firstRibbon] : undefined,
      boardThicknessMm: input.boardThicknessMm,
    });
    bookPng = await renderBookPng(svg, 560);
  } catch (e) {
    console.warn('3D book render failed:', (e as Error)?.message);
  }

  return new Promise((resolve) => {
    const doc = new PDFDocument({ autoFirstPage: false, margin: 0,
      info: { Title: `BOOXURY Proof — ${input.sizeCode} ${input.pages}hal`, Author: 'BOOXURY', Subject: 'Customer Design Proof', Creator: 'BOOXURY PDF Engine', Producer: 'BOOXURY PDF Engine' } });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.addPage({ size: [coverW, coverH], margin: 0 }); page1_CoverFinal(doc, input, spine);
    doc.addPage({ size: [297 * MM_TO_PT, 210 * MM_TO_PT], margin: 0 }); page2_Spread(doc, input, spine);
    doc.addPage({ size: 'A4', margin: 0 }); page3_Interior(doc, input);
    doc.addPage({ size: 'A4', margin: 0 }); page4_FullBook(doc, input, spine, bookPng);
    doc.addPage({ size: 'A4', margin: 40 }); page4_Spec(doc, input, spine);

    doc.end();
  });
}