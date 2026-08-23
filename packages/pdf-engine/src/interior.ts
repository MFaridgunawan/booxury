import PDFDocument from 'pdfkit';
import * as fs from 'fs';

export interface InteriorInput {
  pages: number;
  bookWidthMm: number;
  bookHeightMm: number;
  layout: 'PLAIN' | 'LINED';
  title?: string;
}

const MM_TO_PT = 2.83465;

function lineHeightMm(layout: 'PLAIN' | 'LINED'): number {
  return layout === 'LINED' ? 8 : 0;
}

export function generateInteriorPdf(input: InteriorInput, outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const { pages, bookWidthMm, bookHeightMm, layout } = input;

    const w = bookWidthMm * MM_TO_PT;
    const h = bookHeightMm * MM_TO_PT;
    const margin = 15 * MM_TO_PT;
    const contentW = w - margin * 2;
    const contentH = h - margin * 2;

    const doc = new PDFDocument({ size: [w, h], margin: 0 });
    const stream = fs.createWriteStream(outPath);

    doc.pipe(stream);
    doc.on('error', reject);
    stream.on('finish', resolve);

    for (let pageNum = 1; pageNum <= pages; pageNum++) {
      doc.addPage();

      // Background
      doc.rect(0, 0, w, h).fill('#fffef8');

      // Lined layout
      if (layout === 'LINED') {
        const lh = lineHeightMm(layout) * MM_TO_PT;
        doc.strokeColor('#d0e0f0').lineWidth(0.3);
        let y = margin;
        while (y + lh <= h - margin) {
          doc.moveTo(margin, y + lh).lineTo(w - margin, y + lh).stroke();
          y += lh;
        }
      }

      // Page number (bottom center)
      doc.fontSize(8).fillColor('#888');
      doc.text(`${pageNum}`, 0, h - margin / 2, {
        width: w,
        align: 'center',
        baseline: 'bottom',
      });
    }

    doc.end();
  });
}
