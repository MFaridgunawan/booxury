import * as fs from 'fs';
import * as path from 'path';
import { generateProductionZip } from '../src/index';

const OUT_DIR = path.join(__dirname, '..', '..', '..', 'output');
fs.mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  const job = {
    orderNumber: 'BX-0001',
    customerName: 'Demo User',
    placedAt: new Date().toISOString().split('T')[0],
    sizeCode: 'A5',
    pages: 100,
    paperCode: 'HVS80',
    boardCode: 'BOARD20',
    coverFinishCode: 'doff',
    accessories: [{ type: 'STRAP', name: 'Tali Hitam' }],
    layout: 'LINED' as const,
    totalPrice: 42500,
    spineText: 'My Notebook',
  };

  console.log('Generating PDFs for A5, 100 pages, HVS 80, Board 2.0mm...');

  const zipPath = await generateProductionZip(job, OUT_DIR);
  const zipStat = fs.statSync(zipPath);
  console.log(`✓ ZIP created: ${zipPath} (${(zipStat.size / 1024).toFixed(1)} KB)`);

  for (const f of ['cover.pdf', 'interior.pdf', 'spec-sheet.pdf']) {
    const fp = path.join(OUT_DIR, f);
    if (fs.existsSync(fp)) {
      const stat = fs.statSync(fp);
      console.log(`✓ ${f} — ${(stat.size / 1024).toFixed(1)} KB`);
    } else {
      console.log(`✗ ${f} — missing`);
    }
  }

  console.log('\nDone. Check:', OUT_DIR);
}

main().catch(console.error);
