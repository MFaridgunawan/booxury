import { describe, it, expect } from 'vitest';
import { generateCustomerProofPdf } from '../src/customer-proof';
import * as fs from 'fs';
import { spawnSync } from 'child_process';

function countPdfPages(buf: Buffer): number {
  return (buf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
}
function extractPdfText(buf: Buffer): string {
  fs.writeFileSync('/tmp/boox-cproof-test.pdf', buf);
  return spawnSync('pdftotext', ['-layout', '/tmp/boox-cproof-test.pdf', '-'], { encoding: 'utf8' }).stdout ?? '';
}

const a5 = { sizeCode:'A5',bookWidthMm:148,bookHeightMm:210,pages:100,paperCode:'BOOK72',boardCode:'BOARD20',coverFinish:'doff',coverColor:'#1d3557',paperCaliperMm:0.095,boardThicknessMm:2.0,spineText:'BOOXURY',layout:'plain' as const };

describe('Customer Proof PDF — 5-page blueprint estetik', () => {
  it('valid PDF, 5 halaman', async () => {
    const buf = await generateCustomerProofPdf(a5);
    expect(buf.subarray(0,5).toString('ascii')).toBe('%PDF-');
    expect(countPdfPages(buf)).toBe(5);
  });

  it('BOOXURY branding muncul', async () => {
    expect(extractPdfText(await generateCustomerProofPdf(a5))).toMatch(/BOOXURY/);
  });

  it('footer muncul minimal 3 halaman', async () => {
    expect((extractPdfText(await generateCustomerProofPdf(a5)).match(/Preview desain/g)??[]).length).toBeGreaterThanOrEqual(3);
  });

  it('page 2 spread: Belakang, Depan, Total spread, Fold line', async () => {
    const t = extractPdfText(await generateCustomerProofPdf(a5));
    expect(t).toMatch(/BELAKANG/); expect(t).toMatch(/belum/); expect(t).toMatch(/DEPAN/);
    expect(t).toMatch(/Total spread/); expect(t).toMatch(/Fold line/);
  });

  it('page 3 interior: Isi Buku, Area Gambar, Kertas Isi, Endsheet', async () => {
    const t = extractPdfText(await generateCustomerProofPdf(a5));
    expect(t).toMatch(/Isi Buku/); expect(t).toMatch(/Area Gambar/);
    expect(t).toMatch(/Bookpaper 72 gsm/); expect(t).toMatch(/Endsheet/);
  });

  it('page 4/5 spec: Spesifikasi Lengkap, greyboard, endsheet, headband, ribbon, dust jacket', async () => {
    const buf = await generateCustomerProofPdf({...a5,endpaperCode:'ENDPAT',cornerShape:'round',
      edgeFinish:'gilded_gold',hasDustJacket:true,headbandCode:'hb_emas',ribbonCodes:['rb_merah']});
    const t = extractPdfText(buf);
    expect(t).toMatch(/Spesifikasi/);
    expect(t).toMatch(/Greyboard/); expect(t).toMatch(/2\.0 mm/);
    expect(t).toMatch(/Endsheet/); expect(t).toMatch(/Bermotif/);
    expect(t).toMatch(/Headband/); expect(t).toMatch(/Emas/);
    expect(t).toMatch(/Pita/); expect(t).toMatch(/Merah/);
    expect(t).toMatch(/Dust Jacket/); expect(t).toMatch(/Gilded Emas/);
  });

  it('page 4 fullbook 3D: Tampak Buku + semua komponen bernomor', async () => {
    const buf = await generateCustomerProofPdf({...a5,endpaperCode:'ENDPAT',headbandCode:'hb_emas',ribbonCodes:['rb_merah'],edgeFinish:'gilded_gold'});
    const t = extractPdfText(buf);
    expect(t).toMatch(/Tampak Buku/);
    expect(t).toMatch(/Cover Depan/); expect(t).toMatch(/Spine \/ Punggung/);
    expect(t).toMatch(/Headband/); expect(t).toMatch(/Pita \/ Ribbon/);
    expect(t).toMatch(/Greyboard/); expect(t).toMatch(/Endsheet/);
    expect(t).toMatch(/Blok Isi/); expect(t).toMatch(/Edge/);
  });

  it('B5 & A6 work', async () => {
    const b5 = await generateCustomerProofPdf({...a5,sizeCode:'B5',bookWidthMm:176,bookHeightMm:250,pages:200,boardCode:'BOARD25'});
    expect(countPdfPages(b5)).toBe(5); expect(extractPdfText(b5)).toMatch(/176 × 250/);
    const a6 = await generateCustomerProofPdf({...a5,sizeCode:'A6',bookWidthMm:105,bookHeightMm:148,pages:80,boardCode:'BOARD14'});
    expect(countPdfPages(a6)).toBe(5); expect(extractPdfText(a6)).toMatch(/105 × 148/);
  });

  it('pdfinfo: 5 halaman, title benar', async () => {
    const buf = await generateCustomerProofPdf(a5);
    fs.writeFileSync('/tmp/boox-cproof-test.pdf', buf);
    const r = spawnSync('pdfinfo', ['/tmp/boox-cproof-test.pdf'], { encoding: 'utf8' });
    expect(r.status).toBe(0); expect(r.stdout).toMatch(/Pages:\s+5/); expect(r.stdout).toMatch(/Title:.*A5/);
  });

  it('pdftoppm renders 5 pages', async () => {
    const buf = await generateCustomerProofPdf(a5);
    fs.writeFileSync('/tmp/boox-cproof-test.pdf', buf);
    const r = spawnSync('pdftoppm', ['-r','50','-png','/tmp/boox-cproof-test.pdf','/tmp/boox-cproof-p'], { encoding: 'utf8' });
    expect(r.status).toBe(0);
    ['1','2','3','4','5'].forEach(n => expect(fs.existsSync(`/tmp/boox-cproof-p-${n}.png`)).toBe(true));
  });
});