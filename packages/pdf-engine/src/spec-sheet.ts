import PDFDocument from 'pdfkit';
import * as fs from 'fs';

export interface SpecSheetInput {
  orderNumber: string;
  customerName: string;
  sizeCode: string;
  pages: number;
  paperCode: string;
  boardCode: string;
  coverFinishCode: string;
  accessories: Array<{ type: string; name: string }>;
  layout: string;
  spineWidthMm: number;
  totalPrice: number;
  placedAt: string;
}

const MM_TO_PT = 2.83465;

export function generateSpecSheetPdf(input: SpecSheetInput, outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = fs.createWriteStream(outPath);

    doc.pipe(stream);
    doc.on('error', reject);
    stream.on('finish', resolve);

    const pageW = doc.page.width - 80;

    // Header
    doc.fontSize(20).fillColor('#1a1a1a').font('Helvetica-Bold');
    doc.text('BOOXURY — Production Spec Sheet', 0, 40, { width: pageW, align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#666').font('Helvetica');
    doc.text(`Order: ${input.orderNumber}  |  ${input.placedAt}`, { width: pageW, align: 'center' });
    doc.moveDown(1);

    doc.moveTo(40, doc.y).lineTo(40 + pageW, doc.y).strokeColor('#ddd').lineWidth(1).stroke();
    doc.moveDown(1);

    // Customer info
    doc.fontSize(12).fillColor('#1a1a1a').font('Helvetica-Bold');
    doc.text('Customer');
    doc.fontSize(10).fillColor('#333').font('Helvetica');
    doc.text(input.customerName);
    doc.moveDown(1);

    // Specifications table
    const rows: [string, string][] = [
      ['Ukuran', input.sizeCode],
      ['Jumlah Halaman', `${input.pages} hal.`],
      ['Kertas Isi', input.paperCode],
      ['Board Kover', input.boardCode],
      ['Finish Kover', input.coverFinishCode],
      ['Layout', input.layout],
      ['Lebar Spine', `${input.spineWidthMm} mm`],
      ['Aksesoris', input.accessories.map(a => a.name).join(', ') || '-'],
      ['Total Harga', `Rp ${input.totalPrice.toLocaleString('id-ID')}`],
    ];

    doc.fontSize(12).fillColor('#1a1a1a').font('Helvetica-Bold');
    doc.text('Spesifikasi Produksi');
    doc.moveDown(0.5);

    const col1W = 160;
    const col2W = pageW - col1W;
    let y = doc.y;

    for (const [label, value] of rows) {
      doc.fontSize(10).fillColor('#555').font('Helvetica-Bold');
      doc.text(label, 40, y, { width: col1W, continued: true });
      doc.fillColor('#1a1a1a').font('Helvetica');
      doc.text(value, 40 + col1W, y, { width: col2W });
      y += 20;
    }

    doc.moveDown(1);
    y = doc.y;

    // Notes
    doc.fontSize(12).fillColor('#1a1a1a').font('Helvetica-Bold');
    doc.text('Catatan Produksi');
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('#666').font('Helvetica');
    doc.text([
      `• Spine width: ${input.spineWidthMm} mm — toleransi ±0.5mm`,
      '• Bleed: 3mm semua sisi',
      '• Turn-in: 15mm',
      '• CMYK conversion sesuai ICC profile percetakan',
      '• Font whitelist: Playfair Display, Lora, Open Sans, Roboto',
    ].join('\n'), { width: pageW });

    doc.end();
  });
}
