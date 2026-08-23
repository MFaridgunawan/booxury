import { PrismaClient, Role, MaterialType, AccessoryType, Layout } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with print-shop accurate data...');

  // Size Presets
  await prisma.sizePreset.upsert({
    where: { code: 'A5' },
    update: {},
    create: { code: 'A5', name: 'A5 (148 × 210 mm)', widthMm: 148, heightMm: 210, basePrice: 35000 },
  });
  await prisma.sizePreset.upsert({
    where: { code: 'B5' },
    update: {},
    create: { code: 'B5', name: 'B5 (176 × 250 mm)', widthMm: 176, heightMm: 250, basePrice: 45000 },
  });
  await prisma.sizePreset.upsert({
    where: { code: 'A6' },
    update: {},
    create: { code: 'A6', name: 'A6 (105 × 148 mm)', widthMm: 105, heightMm: 148, basePrice: 25000 },
  });

  // Cover Finishes (pelapis luar hardcover)
  // sources: percetakan spec
  await prisma.coverFinish.upsert({
    where: { code: 'doff' },
    update: {},
    create: { code: 'doff', name: 'Matt / Laminasi Doff', priceModifier: 0 },
  });
  await prisma.coverFinish.upsert({
    where: { code: 'glossy' },
    update: {},
    create: { code: 'glossy', name: 'Glossy / Laminasi Glossy', priceModifier: 0 },
  });
  await prisma.coverFinish.upsert({
    where: { code: 'canvas' },
    update: {},
    create: { code: 'canvas', name: 'Kanvas / Linen', priceModifier: 15000 },
  });
  await prisma.coverFinish.upsert({
    where: { code: 'leatherette' },
    update: {},
    create: { code: 'leatherette', name: 'Leatherette (Kulit Sintetis)', priceModifier: 25000 },
  });

  // Cover Materials (bahan dasar kover)
  // Dust jacket adalah kertas luar yang bisa dilepas
  await prisma.accessory.upsert({
    where: { code: 'dust_jacket' },
    update: {},
    create: { code: 'dust_jacket', type: AccessoryType.STRAP, name: 'Dust Jacket (Sampul Luar)', colorHex: '#FFFFFF', price: 8000, isActive: true },
  });

  // Interior Paper Materials
  // gsm → caliper (mm): industry standard approximations
  const paperMaterials = [
    // Bookpaper — krem, nyaman untuk teks panjang (novel, biografi)
    { code: 'BOOK57', name: 'Bookpaper 57 gsm (Tipis)', type: MaterialType.PAPER, paperCaliperMm: 0.075, thicknessMm: null, pricePerUnit: 400 },
    { code: 'BOOK72', name: 'Bookpaper 72 gsm (Standar)', type: MaterialType.PAPER, paperCaliperMm: 0.090, thicknessMm: null, pricePerUnit: 500 },
    { code: 'BOOK90', name: 'Bookpaper 90 gsm (Tebal)', type: MaterialType.PAPER, paperCaliperMm: 0.115, thicknessMm: null, pricePerUnit: 700 },
    // HVS — putih bersih, untuk teks/formulir
    { code: 'HVS70', name: 'HVS 70 gsm', type: MaterialType.PAPER, paperCaliperMm: 0.088, thicknessMm: null, pricePerUnit: 400 },
    { code: 'HVS80', name: 'HVS 80 gsm (Standar)', type: MaterialType.PAPER, paperCaliperMm: 0.105, thicknessMm: null, pricePerUnit: 500 },
    { code: 'HVS100', name: 'HVS 100 gsm (Tebal)', type: MaterialType.PAPER, paperCaliperMm: 0.130, thicknessMm: null, pricePerUnit: 700 },
    // Art Paper — coated, untuk reproduksi warna tinggi (foto, coffee table book)
    { code: 'ART120', name: 'Art Paper 120 gsm (Glossy)', type: MaterialType.PAPER, paperCaliperMm: 0.100, thicknessMm: null, pricePerUnit: 1200 },
    { code: 'ART150', name: 'Art Paper 150 gsm (Glossy)', type: MaterialType.PAPER, paperCaliperMm: 0.130, thicknessMm: null, pricePerUnit: 1500 },
    // Matt Paper — coated but non-glossy, doff finish
    { code: 'MATT120', name: 'Matt Paper 120 gsm', type: MaterialType.PAPER, paperCaliperMm: 0.110, thicknessMm: null, pricePerUnit: 1200 },
    { code: 'MATT150', name: 'Matt Paper 150 gsm', type: MaterialType.PAPER, paperCaliperMm: 0.140, thicknessMm: null, pricePerUnit: 1500 },
  ];

  // Greyboard (Hardboard Cover)
  // standard industri: No.30 (1.4mm), No.35 (1.75mm), No.40 (2.0mm), No.50 (2.5mm)
  const boardMaterials = [
    { code: 'BOARD14', name: 'Greyboard No.30 — 1.4 mm (Tipis)', type: MaterialType.BOARD, paperCaliperMm: null, thicknessMm: 1.4, pricePerUnit: 1200 },
    { code: 'BOARD18', name: 'Greyboard No.35 — 1.8 mm', type: MaterialType.BOARD, paperCaliperMm: null, thicknessMm: 1.8, pricePerUnit: 1600 },
    { code: 'BOARD20', name: 'Greyboard No.40 — 2.0 mm (Standar)', type: MaterialType.BOARD, paperCaliperMm: null, thicknessMm: 2.0, pricePerUnit: 2000 },
    { code: 'BOARD25', name: 'Greyboard No.50 — 2.5 mm (Tebal)', type: MaterialType.BOARD, paperCaliperMm: null, thicknessMm: 2.5, pricePerUnit: 2500 },
  ];

  // Endpaper (Kertas Leks) — merekatkan book block ke hardboard
  // 150-200 gsm; thin endpaper untuk signature binding, thicker untuk durability
  const endpaperMaterials = [
    { code: 'ENDFLAT', name: 'Endpaper 120 gsm (Tipis)', type: MaterialType.ENDPAPER, paperCaliperMm: null, thicknessMm: 0.10, pricePerUnit: 200 },
    { code: 'ENDPLAIN', name: 'Endpaper 150 gsm (Standar)', type: MaterialType.ENDPAPER, paperCaliperMm: null, thicknessMm: 0.14, pricePerUnit: 300 },
    { code: 'ENDPAT', name: 'Endpaper 180 gsm + Motif (Premium)', type: MaterialType.ENDPAPER, paperCaliperMm: null, thicknessMm: 0.18, pricePerUnit: 500 },
  ];

  for (const mat of [...paperMaterials, ...boardMaterials, ...endpaperMaterials]) {
    await prisma.material.upsert({
      where: { code: mat.code },
      update: {},
      create: mat,
    });
  }

  // Accessories
  // Headband & Tailband — pita tenun di ujung punggung atas/bawah
  const headbandColors = [
    { code: 'hb_merah', type: AccessoryType.STRAP, name: 'Headband Merah', colorHex: '#b71c1c', price: 2000 },
    { code: 'hb_hitam', type: AccessoryType.STRAP, name: 'Headband Hitam', colorHex: '#1a1a1a', price: 2000 },
    { code: 'hb_emas', type: AccessoryType.STRAP, name: 'Headband Emas', colorHex: '#FFD700', price: 2000 },
    { code: 'hb_putih', type: AccessoryType.STRAP, name: 'Headband Putih', colorHex: '#f5f5f5', price: 2000 },
  ];

  // Ribbon Marker — penanda halaman (3-5mm, menjuntai 2-5cm dari tail)
  const ribbonMarkers = [
    { code: 'rb_merah', type: AccessoryType.RIBBON, name: 'Pita Pembatas Merah', colorHex: '#b71c1c', price: 3000 },
    { code: 'rb_emas', type: AccessoryType.RIBBON, name: 'Pita Pembatas Emas', colorHex: '#FFD700', price: 3000 },
    { code: 'rb_hijau', type: AccessoryType.RIBBON, name: 'Pita Pembatas Hijau', colorHex: '#1b5e20', price: 3000 },
    { code: 'rb_biru', type: AccessoryType.RIBBON, name: 'Pita Pembatas Biru', colorHex: '#1565c0', price: 3000 },
    { code: 'rb_hitam', type: AccessoryType.RIBBON, name: 'Pita Pembatas Hitam', colorHex: '#1a1a1a', price: 3000 },
  ];

  for (const acc of [...headbandColors, ...ribbonMarkers]) {
    await prisma.accessory.upsert({
      where: { code: acc.code },
      update: {},
      create: { ...acc, isActive: true },
    });
  }

  // Demo Users
  const demoHash = await bcrypt.hash('demo123', 12);
  const adminHash = await bcrypt.hash('admin123', 12);

  await prisma.user.upsert({
    where: { email: 'demo@booxury.local' },
    update: {},
    create: { email: 'demo@booxury.local', name: 'Demo User', passwordHash: demoHash, role: Role.CUSTOMER },
  });
  await prisma.user.upsert({
    where: { email: 'admin@booxury.local' },
    update: {},
    create: { email: 'admin@booxury.local', name: 'Admin', passwordHash: adminHash, role: Role.ADMIN },
  });

  console.log('Seeding complete — print-shop accurate data loaded.');
  console.log(`  Paper types: ${paperMaterials.length}`);
  console.log(`  Board types: ${boardMaterials.length}`);
  console.log(`  Endpaper types: ${endpaperMaterials.length}`);
  console.log(`  Accessories: ${headbandColors.length + ribbonMarkers.length + 1}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
