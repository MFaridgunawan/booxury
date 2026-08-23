import PDFDocument from 'pdfkit';
import { SpineOutput } from '@booxury/spine-calc';
import * as fs from 'fs';
import * as path from 'path';

export interface CoverInput {
  spine: SpineOutput;
  bookWidthMm: number;
  bookHeightMm: number;
  frontPanelImage?: string;   // base64 or file path
  backPanelImage?: string;
  spineText?: string;
  spineImage?: string;
  label?: string;             // "BACK" | "SPINE" | "FRONT" for dev
}

const MM_TO_PT = 2.83465;

export function generateCoverPdf(input: CoverInput, outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const { spine, bookWidthMm, bookHeightMm } = input;
    const w = spine.totalSheetWidthMm * MM_TO_PT;
    const h = spine.totalSheetHeightMm * MM_TO_PT;
    const bleed = spine.bleedMm * MM_TO_PT;
    const turnIn = spine.turnInMm * MM_TO_PT;

    const spineW = spine.spineWidthMm * MM_TO_PT;
    const panelW = bookWidthMm * MM_TO_PT;
    const panelH = bookHeightMm * MM_TO_PT;

    // Panel positions (from left edge)
    const backX = bleed;
    const spineX = backX + panelW + turnIn;
    const frontX = spineX + spineW + turnIn;
    const panelY = bleed;

    const doc = new PDFDocument({ size: [w, h], margin: 0 });
    const stream = fs.createWriteStream(outPath);

    doc.pipe(stream);
    doc.on('error', reject);
    stream.on('finish', resolve);

    // Background panels
    doc.rect(backX, panelY, panelW, panelH).fill('#f5f5f0');
    doc.rect(spineX, panelY, spineW, panelH).fill('#e8e4d9');
    doc.rect(frontX, panelY, panelW, panelH).fill('#f5f5f0');

    // Labels
    doc.fontSize(10).fillColor('#888').font('Helvetica');
    doc.text('BACK', backX + 4, panelY + 4, { width: panelW - 8 });
    doc.text('SPINE', spineX + 4, panelY + 4, { width: spineW - 8 });
    doc.text('FRONT', frontX + 4, panelY + 4, { width: panelW - 8 });

    // Spine text (vertical, centered)
    if (input.spineText) {
      doc.save();
      doc.translate(spineX + spineW / 2, panelY + panelH / 2);
      doc.rotate(90, { origin: [0, 0] });
      doc.fontSize(10).fillColor('#333');
      doc.text(input.spineText, -20, -4, { width: 40, align: 'center' });
      doc.restore();
    }

    // Bleed lines (dashed, for production reference)
    doc.strokeColor('#ccc').lineWidth(0.5).dash(4, { space: 4 });
    doc
      .rect(bleed / 2, bleed / 2, w - bleed, h - bleed)
      .stroke();

    doc.end();
  });
}
