/**
 * PDF Queue Worker
 *
 * Polls job_queue every 5 seconds for PENDING jobs.
 * Generates cover + interior + spec-sheet PDFs, zips them,
 * updates order.productionZipUrl, and marks job DONE.
 *
 * Run: cd apps/api && pnpm worker
 * (in production: run as a separate process, not inside the Fastify server)
 */

import { PrismaClient } from '@booxury/database';
import { generateProductionZip } from '@booxury/pdf-engine';
import * as path from 'path';
import * as fs from 'fs';

const POLL_INTERVAL_MS = 5000;
const MAX_ATTEMPTS = 3;
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'production-zips');

const prisma = new PrismaClient();

// Ensure output directory exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function processJobs() {
  try {
    // Pick one PENDING job using FOR UPDATE SKIP LOCKED (no two workers pick same job)
    const job = await prisma.$queryRaw<
      Array<{ id: string; orderId: string; attempts: number }>
    >`
      SELECT id, "orderId", attempts
      FROM job_queue
      WHERE status = 'PENDING'
      ORDER BY "createdAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `;

    if (!job.length) return; // No jobs to process

    const { id: jobId, orderId } = job[0];

    // Mark as PROCESSING
    await prisma.jobQueue.update({
      where: { id: jobId },
      data: { status: 'PROCESSING', startedAt: new Date(), attempts: { increment: 1 } },
    });

    console.log(`[worker] Processing job ${jobId} for order ${orderId}`);

    // Fetch order with all related data
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true } },
        items: {
          include: {
            design: {
              include: {
                sizePreset: { select: { code: true } },
                coverFinish: { select: { code: true } },
              },
            },
          },
        },
      },
    });

    if (!order) {
      await prisma.jobQueue.update({ where: { id: jobId }, data: { status: 'FAILED', error: 'Order not found' } });
      return;
    }

    // Build ProductionJob from the first order item (MVP: 1 item per order)
    const item = order.items[0];
    if (!item) {
      await prisma.jobQueue.update({ where: { id: jobId }, data: { status: 'FAILED', error: 'No items in order' } });
      return;
    }

    const design = item.design;
    const baseSnapshot = item.baseSnapshot as Record<string, unknown> ?? {};
    const finishSnapshot = item.finishSnapshot as Record<string, unknown> ?? {};

    const productionJob = {
      orderNumber: order.orderNumber,
      customerName: order.user.name,
      placedAt: order.createdAt.toISOString(),
      sizeCode: (design.sizePreset as { code: string }).code ?? 'A5',
      pages: Number(baseSnapshot.pages ?? design.pages),
      paperCode: (design as Record<string, unknown>).paperCode as string ?? 'BOOK72',
      boardCode: (design as Record<string, unknown>).boardCode as string ?? 'BOARD20',
      coverFinishCode: (design.coverFinish as { code: string }).code ?? 'doff',
      accessories: (finishSnapshot.accessories as Array<{ type: string; name: string }>) ?? [],
      layout: (baseSnapshot.layout ?? 'PLAIN') as 'PLAIN' | 'LINED',
      totalPrice: Number(item.unitPrice),
      spineText: (finishSnapshot.spineText as string | undefined) ?? order.orderNumber,
    };

    try {
      // Generate PDFs and ZIP
      const zipPath = await generateProductionZip(productionJob, OUTPUT_DIR);
      const zipUrl = `/production-zips/${path.basename(zipPath)}`;

      // Update order with ZIP URL
      await prisma.order.update({
        where: { id: orderId },
        data: { productionZipUrl: zipUrl, productionStatus: 'BINDING' },
      });

      // Mark job as DONE
      await prisma.jobQueue.update({
        where: { id: jobId },
        data: { status: 'DONE', finishedAt: new Date() },
      });

      console.log(`[worker] Job ${jobId} done — ZIP: ${zipUrl}`);
    } catch (err) {
      const attempts = job[0].attempts + 1;
      const errorMsg = err instanceof Error ? err.message : String(err);

      if (attempts >= MAX_ATTEMPTS) {
        await prisma.jobQueue.update({
          where: { id: jobId },
          data: { status: 'FAILED', error: errorMsg },
        });
        await prisma.order.update({
          where: { id: orderId },
          data: { productionStatus: 'CANCELLED' },
        });
        console.error(`[worker] Job ${jobId} FAILED after ${MAX_ATTEMPTS} attempts: ${errorMsg}`);
      } else {
        // Re-queue for retry
        await prisma.jobQueue.update({
          where: { id: jobId },
          data: { status: 'PENDING', error: errorMsg },
        });
        console.warn(`[worker] Job ${jobId} attempt ${attempts} failed, re-queued: ${errorMsg}`);
      }
    }
  } catch (err) {
    console.error('[worker] Poll error:', err);
  }
}

// Polling loop
async function run() {
  console.log(`[worker] Starting PDF worker — polling every ${POLL_INTERVAL_MS}ms`);
  console.log(`[worker] Output dir: ${OUTPUT_DIR}`);

  // Process immediately, then on interval
  await processJobs();
  setInterval(processJobs, POLL_INTERVAL_MS);
}

run().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[worker] Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
