import { PrismaClient, Role, MaterialType, AccessoryType, Layout } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Size Presets
  await prisma.sizePreset.upsert({
    where: { code: 'A5' },
    update: {},
    create: { code: 'A5', name: 'A5 (148 x 210 mm)', widthMm: 148, heightMm: 210, basePrice: 35000 },
  });
  await prisma.sizePreset.upsert({
    where: { code: 'B5' },
    update: {},
    create: { code: 'B5', name: 'B5 (176 x 250 mm)', widthMm: 176, heightMm: 250, basePrice: 45000 },
  });
  await prisma.sizePreset.upsert({
    where: { code: 'A6' },
    update: {},
    create: { code: 'A6', name: 'A6 (105 x 148 mm)', widthMm: 105, heightMm: 148, basePrice: 25000 },
  });

  // Cover Finishes
  await prisma.coverFinish.upsert({
    where: { code: 'doff' },
    update: {},
    create: { code: 'doff', name: 'Laminasi Doff', priceModifier: 0 },
  });
  await prisma.coverFinish.upsert({
    where: { code: 'glossy' },
    update: {},
    create: { code: 'glossy', name: 'Laminasi Glossy', priceModifier: 0 },
  });
  await prisma.coverFinish.upsert({
    where: { code: 'canvas' },
    update: {},
    create: { code: 'canvas', name: 'Kanvas', priceModifier: 15000 },
  });

  // Materials
  const paperMaterials = [
    { code: 'HVS80', name: 'HVS 80 gsm', type: MaterialType.PAPER, paperCaliperMm: 0.105, thicknessMm: null, pricePerUnit: 500 },
    { code: 'HVS100', name: 'HVS 100 gsm', type: MaterialType.PAPER, paperCaliperMm: 0.130, thicknessMm: null, pricePerUnit: 700 },
    { code: 'BOOK70', name: 'Bookpaper 70 gsm', type: MaterialType.PAPER, paperCaliperMm: 0.082, thicknessMm: null, pricePerUnit: 600 },
    { code: 'BOOK80', name: 'Bookpaper 80 gsm', type: MaterialType.PAPER, paperCaliperMm: 0.095, thicknessMm: null, pricePerUnit: 800 },
  ];
  const boardMaterials = [
    { code: 'BOARD15', name: 'Greyboard 1.5 mm', type: MaterialType.BOARD, paperCaliperMm: null, thicknessMm: 1.5, pricePerUnit: 1500 },
    { code: 'BOARD20', name: 'Greyboard 2.0 mm', type: MaterialType.BOARD, paperCaliperMm: null, thicknessMm: 2.0, pricePerUnit: 2000 },
    { code: 'BOARD25', name: 'Greyboard 2.5 mm', type: MaterialType.BOARD, paperCaliperMm: null, thicknessMm: 2.5, pricePerUnit: 2500 },
    { code: 'BOARD30', name: 'Greyboard 3.0 mm', type: MaterialType.BOARD, paperCaliperMm: null, thicknessMm: 3.0, pricePerUnit: 3000 },
  ];
  const endpaperMaterials = [
    { code: 'ENDPLAIN', name: 'Endpaper Polos', type: MaterialType.ENDPAPER, paperCaliperMm: null, thicknessMm: 0.12, pricePerUnit: 300 },
    { code: 'ENDPAT', name: 'Endpaper Motif', type: MaterialType.ENDPAPER, paperCaliperMm: null, thicknessMm: 0.15, pricePerUnit: 500 },
  ];

  for (const mat of [...paperMaterials, ...boardMaterials, ...endpaperMaterials]) {
    await prisma.material.upsert({
      where: { code: mat.code },
      update: {},
      create: mat,
    });
  }

  // Accessories
  const strapColors = [
    { type: AccessoryType.STRAP, name: 'Tali Hitam', colorHex: '#1a1a1a', price: 5000 },
    { type: AccessoryType.STRAP, name: 'Tali Coklat', colorHex: '#8B4513', price: 5000 },
    { type: AccessoryType.STRAP, name: 'Tali Navy', colorHex: '#1a237e', price: 5000 },
  ];
  const ribbonColors = [
    { type: AccessoryType.RIBBON, name: 'Pita Merah', colorHex: '#b71c1c', price: 3000 },
    { type: AccessoryType.RIBBON, name: 'Pita Emas', colorHex: '#FFD700', price: 3000 },
    { type: AccessoryType.RIBBON, name: 'Pita Hijau', colorHex: '#1b5e20', price: 3000 },
  ];

  for (const acc of [...strapColors, ...ribbonColors]) {
    await prisma.accessory.upsert({
      where: { code: `${acc.type.toLowerCase()}_${acc.colorHex.replace('#', '')}` },
      update: {},
      create: { code: `${acc.type.toLowerCase()}_${acc.colorHex.replace('#', '')}`, ...acc, isActive: true },
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

  console.log('Seeding complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
