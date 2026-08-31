/**
 * Demo Seed — creates sample designs and orders for demo day
 *
 * Run AFTER packages/database/prisma/seed.ts
 * Run: cd packages/database && pnpm prisma db seed
 *
 * Make sure NEXTAUTH_SECRET env var is set to the same value as in .env
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data...');

  // ── Find demo user ──────────────────────────────────────────
  const demoUser = await prisma.user.findUnique({ where: { email: 'demo@booxury.local' } });
  if (!demoUser) { console.error('Demo user not found. Run packages/database/prisma/seed.ts first.'); return; }

  // ── Find material IDs ───────────────────────────────────────
  const sizeA5 = await prisma.sizePreset.findUnique({ where: { code: 'A5' } });
  const sizeB5 = await prisma.sizePreset.findUnique({ where: { code: 'B5' } });
  const coverDoff = await prisma.coverFinish.findUnique({ where: { code: 'doff' } });
  const coverCanvas = await prisma.coverFinish.findUnique({ where: { code: 'canvas' } });
  const paperBOOK72 = await prisma.material.findUnique({ where: { code: 'BOOK72' } });
  const paperHVS80 = await prisma.material.findUnique({ where: { code: 'HVS80' } });
  const boardBOARD18 = await prisma.material.findUnique({ where: { code: 'BOARD18' } });
  const boardBOARD20 = await prisma.material.findUnique({ where: { code: 'BOARD20' } });

  if (!sizeA5 || !sizeB5 || !coverDoff || !coverCanvas || !paperBOOK72 || !paperHVS80 || !boardBOARD18 || !boardBOARD20) {
    console.error('Missing seed data. Run packages/database/prisma/seed.ts first.');
    return;
  }

  // ── Sample Designs ──────────────────────────────────────────
  const designs = [
    {
      name: 'Buku Catatan Harian',
      sizePresetId: sizeA5.id,
      coverFinishId: coverDoff.id,
      paperMaterialId: paperBOOK72.id,
      boardMaterialId: boardBOARD20.id,
      pages: 120,
      layout: 'PLAIN' as const,
      designPayload: { front: [{ id: 'layer1', type: 'text', text: 'Daily Journal', x: 50, y: 80, fill: '#333', fontSize: 24, fontFamily: 'serif' }], back: [], spine: [], finishZones: [] },
      finishConfig: { coverFinish: 'doff', cornerShape: 'square', edgeFinish: 'plain', hasDustJacket: false, ribbonCodes: ['rb_merah'], accessories: [] },
      totalPrice: 85000,
      spineWidthMm: 12.8,
    },
    {
      name: 'Portofolio Foto',
      sizePresetId: sizeB5.id,
      coverFinishId: coverCanvas.id,
      paperMaterialId: paperHVS80.id,
      boardMaterialId: boardBOARD18.id,
      pages: 80,
      layout: 'PLAIN' as const,
      designPayload: { front: [{ id: 'layer2', type: 'text', text: 'Portfolio 2026', x: 30, y: 100, fill: '#fff', fontSize: 32, fontFamily: 'sans-serif' }], back: [], spine: [], finishZones: [] },
      finishConfig: { coverFinish: 'canvas', cornerShape: 'round', edgeFinish: 'gilded_gold', hasDustJacket: true, headbandCode: 'hb_emas', ribbonCodes: [], accessories: [{ code: 'dust_jacket', type: 'STRAP' }] },
      totalPrice: 145000,
      spineWidthMm: 8.5,
    },
    {
      name: 'Notulensi Tim',
      sizePresetId: sizeA5.id,
      coverFinishId: coverDoff.id,
      paperMaterialId: paperBOOK72.id,
      boardMaterialId: boardBOARD18.id,
      pages: 200,
      layout: 'LINED' as const,
      designPayload: { front: [], back: [], spine: [], finishZones: [] },
      finishConfig: { coverFinish: 'doff', cornerShape: 'square', edgeFinish: 'plain', hasDustJacket: false, ribbonCodes: ['rb_biru'], accessories: [] },
      totalPrice: 92000,
      spineWidthMm: 21.2,
    },
  ];

  for (const d of designs) {
    const existing = await prisma.design.findFirst({ where: { userId: demoUser.id, name: d.name } });
    if (existing) { console.log(`  Design "${d.name}" already exists — skipping`); continue; }

    await prisma.design.create({ data: { userId: demoUser.id, ...d } });
    console.log(`  Created design: ${d.name}`);
  }

  // ── Sample Orders ───────────────────────────────────────────
  const allDesigns = await prisma.design.findMany({ where: { userId: demoUser.id } });
  if (allDesigns.length === 0) { console.log('No designs found — skipping orders'); return; }

  const orderConfigs = [
    { status: 'SHIPPED' as const, itemCount: 1 },
    { status: 'BINDING' as const, itemCount: 1 },
    { status: 'QUEUED' as const, itemCount: 2 },
    { status: 'AWAITING_PAYMENT' as const, itemCount: 1 },
    { status: 'CANCELLED' as const, itemCount: 1 },
  ];

  for (let i = 0; i < orderConfigs.length; i++) {
    const { status, itemCount } = orderConfigs[i];
    const orderNumber = `BX-DEMO${String(i + 1).padStart(3, '0')}`;
    const existing = await prisma.order.findUnique({ where: { orderNumber } });
    if (existing) { console.log(`  Order ${orderNumber} already exists — skipping`); continue; }

    const items = allDesigns.slice(0, itemCount);
    if (items.length === 0) continue;

    const order = await prisma.order.create({
      data: {
        userId: demoUser.id,
        orderNumber,
        productionStatus: status,
        items: {
          create: items.map(design => ({
            designId: design.id,
            quantity: 1,
            unitPrice: design.totalPrice,
            baseSnapshot: { pages: design.pages, layout: design.layout },
            designSnapshot: design.designPayload,
            finishSnapshot: design.finishConfig ?? {},
            spineWidthMm: design.spineWidthMm,
          })),
        },
      },
    });

    // Add job queue for non-awaiting-payment orders
    if (status !== 'AWAITING_PAYMENT') {
      await prisma.jobQueue.create({ data: { orderId: order.id, status: status === 'SHIPPED' ? 'DONE' : 'PENDING' } });
    }

    console.log(`  Created order: ${orderNumber} (${status})`);
  }

  console.log('\nDemo data seeded successfully!');
  console.log(`  Demo user: demo@booxury.local / demo123`);
  console.log(`  Designs: ${allDesigns.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
