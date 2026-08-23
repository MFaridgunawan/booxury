import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import { generateCoverPdf } from './cover';
import { generateInteriorPdf } from './interior';
import { generateSpecSheetPdf } from './spec-sheet';
import { calculateSpine } from '@booxury/spine-calc';

export { generateCoverPdf, generateInteriorPdf, generateSpecSheetPdf };

export interface ProductionJob {
  orderNumber: string;
  customerName: string;
  placedAt: string;
  sizeCode: string;
  pages: number;
  paperCode: string;
  boardCode: string;
  coverFinishCode: string;
  accessories: Array<{ type: string; name: string }>;
  layout: 'PLAIN' | 'LINED';
  totalPrice: number;
  spineText?: string;
}

const SIZE_DIMS: Record<string, { widthMm: number; heightMm: number }> = {
  A5: { widthMm: 148, heightMm: 210 },
  B5: { widthMm: 176, heightMm: 250 },
  A6: { widthMm: 105, heightMm: 148 },
};

const PAPER_CALIPER: Record<string, number> = {
  HVS80: 0.105, HVS100: 0.130, BOOK70: 0.082, BOOK80: 0.095,
};
const BOARD_THICKNESS: Record<string, number> = {
  BOARD15: 1.5, BOARD20: 2.0, BOARD25: 2.5, BOARD30: 3.0,
};

export async function generateProductionZip(job: ProductionJob, outDir: string): Promise<string> {
  const dims = SIZE_DIMS[job.sizeCode] ?? SIZE_DIMS.A5;
  const caliper = PAPER_CALIPER[job.paperCode] ?? 0.105;
  const board = BOARD_THICKNESS[job.boardCode] ?? 2.0;

  const spine = calculateSpine({
    pages: job.pages,
    paperCaliperMm: caliper,
    boardThicknessMm: board,
    endpaperThicknessMm: 0.12,
    hingeAllowanceMm: 2.0,
  }, dims);

  const coverPath = path.join(outDir, 'cover.pdf');
  const interiorPath = path.join(outDir, 'interior.pdf');
  const specPath = path.join(outDir, 'spec-sheet.pdf');
  const zipPath = path.join(outDir, `${job.orderNumber}.zip`);

  await Promise.all([
    generateCoverPdf({ spine, bookWidthMm: dims.widthMm, bookHeightMm: dims.heightMm, spineText: job.spineText }, coverPath),
    generateInteriorPdf({ pages: job.pages, bookWidthMm: dims.widthMm, bookHeightMm: dims.heightMm, layout: job.layout }, interiorPath),
    generateSpecSheetPdf({ ...job, spineWidthMm: spine.spineWidthMm }, specPath),
  ]);

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => resolve(zipPath));
    archive.on('error', reject);
    archive.pipe(output);
    archive.file(coverPath, { name: 'cover.pdf' });
    archive.file(interiorPath, { name: 'interior.pdf' });
    archive.file(specPath, { name: 'spec-sheet.pdf' });
    archive.finalize();
  });
}
