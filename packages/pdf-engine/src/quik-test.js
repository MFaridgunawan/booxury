import { generateCustomerProofPdf } from './customer-proof';
import { spawnSync } from 'fs';
import * as fs from 'fs';
async function main() {
  const buf = await generateCustomerProofPdf({
    sizeCode: 'A5', bookWidthMm: 148, bookHeightMm: 210, pages: 100,
    paperCode: 'BOOK72', boardCode: 'BOARD20', coverFinish: 'doff',
    coverColor: '#1d3557', paperCaliperMm: 0.095, boardThicknessMm: 2.0,
    spineText: 'BOOXURY', layout: 'plain',
  });
  fs.writeFileSync('/tmp/quik.pdf', buf);
  const r = spawnSync('pdfinfo', ['/tmp/quik.pdf'], { encoding: 'utf8' });
  console.log(r.stdout.match(/Pages:.*/)?.[0]);
}
main();
