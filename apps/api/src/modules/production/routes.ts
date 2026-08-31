/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs';
import { FastifyInstance } from '../../types.js';
import { generateCoverPdf, generateCoverPdfBuffer, generateCoverPreviewPng, generateCustomerProofPdf } from '@booxury/pdf-engine';
import { calculateSpine } from '@booxury/spine-calc';

const SIZE_DIMS: Record<string, { widthMm: number; heightMm: number }> = {
  A5: { widthMm: 148, heightMm: 210 },
  B5: { widthMm: 176, heightMm: 250 },
  A6: { widthMm: 105, heightMm: 148 },
};

const PAPER_CALIPER: Record<string, number> = {
  BOOK57: 0.075, BOOK72: 0.095, BOOK90: 0.110,
  HVS70: 0.090, HVS80: 0.105, HVS100: 0.130,
  ART120: 0.120, ART150: 0.150,
  MATT120: 0.120, MATT150: 0.150,
};

const BOARD_THICKNESS: Record<string, number> = {
  BOARD14: 1.4, BOARD18: 1.8, BOARD20: 2.0, BOARD25: 2.5,
};

async function authGuard(fastify: FastifyInstance, request: Parameters<typeof fastify.authenticate>[0]) {
  try {
    await request.jwtVerify();
  } catch {
    throw { code: 'UNAUTHORIZED', statusCode: 401 };
  }
}

// ── Anonymous blueprint PDF (no auth, no DB required) ──────────────────────────
// POST /api/blueprint-pdf/anonymous
// Body: { sizeCode, pages, paperCode, boardCode, coverFinish, coverColor, spineText?, thumbnail? }
// Returns: application/pdf stream
export async function anonymousBlueprintRoutes(fastify: FastifyInstance) {
  // New: Customer Proof PDF (3 pages) via full state
    fastify.post('/customer-proof', { bodyLimit: 3 * 1024 * 1024 }, async (req, reply) => {
      const { ProofRequestSchema } = await import('@booxury/design-types');
      const parseResult = ProofRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_PROOF_REQUEST',
            message: parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
          },
        });
      }
      const { base, finish } = parseResult.data;
      const artworkFront = parseResult.data.artworkFront;

      const dims = SIZE_DIMS[base.size] ?? SIZE_DIMS.A5;
      const caliper = PAPER_CALIPER[base.paperCode] ?? 0.095;
      const boardThickness = BOARD_THICKNESS[base.boardCode] ?? 2.0;

      const buf = await generateCustomerProofPdf({
        sizeCode: base.size,
        bookWidthMm: dims.widthMm,
        bookHeightMm: dims.heightMm,
        pages: base.pages,
        paperCode: base.paperCode,
        boardCode: base.boardCode,
        coverFinish: finish?.coverFinish ?? 'doff',
        coverColor: finish?.coverColor ?? '#1d3557',
        coverTextureUrl: artworkFront ?? undefined,
        spineText: 'BOOXURY',
        endpaperCode: base.endpaperCode,
        cornerShape: finish?.cornerShape,
        edgeFinish: finish?.edgeFinish,
        hasDustJacket: finish?.hasDustJacket,
        headbandCode: finish?.headbandCode,
        ribbonCodes: finish?.ribbonCodes,
        layout: base.layout,
        paperCaliperMm: caliper,
        boardThicknessMm: boardThickness,
      });

      const filename = `booxury-proof-${base.size}-${base.pages}hal.pdf`;
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      return reply.send(buf);
    });

    // Legacy anonymous blueprint — keeps compat, uses old body shape
    fastify.post('/blueprint-pdf/anonymous', async (req, reply) => {
      const body = req.body as Record<string, unknown>;
      const sizeCode = (body.sizeCode as string) ?? 'A5';
      const pages = typeof body.pages === 'number' ? body.pages : 100;
      const paperCode = (body.paperCode as string) ?? 'BOOK72';
      const boardCode = (body.boardCode as string) ?? 'BOARD20';
      const coverFinish = (body.coverFinish as string) ?? 'doff';
      const spineText = (body.spineText as string) ?? 'BOOXURY';
      const thumbnail = body.thumbnail as string | undefined;

      const dims = SIZE_DIMS[sizeCode] ?? SIZE_DIMS.A5;
      const caliper = PAPER_CALIPER[paperCode] ?? 0.095;
      const boardThickness = BOARD_THICKNESS[boardCode] ?? 2.0;

      const spine = calculateSpine({
        pages,
        paperCaliperMm: caliper,
        boardThicknessMm: boardThickness,
        endpaperThicknessMm: 0.12,
        hingeAllowanceMm: 2.0,
      }, dims);

      // Resolve thumbnail: inline base64 data URL or filesystem path → base64
      const frontPanelImage = thumbnail ? await resolveImage(thumbnail) : undefined;

      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `inline; filename="booxury-blueprint-${Date.now()}.pdf"`);

      const buf = await generateCoverPdfBuffer({
        spine,
        bookWidthMm: dims.widthMm,
        bookHeightMm: dims.heightMm,
        frontPanelImage,
        spineText,
        // Include customer-friendly + producer-friendly metadata
        sizeCode,
        pages,
        paperCode,
        boardCode,
        coverFinish,
      });
      return reply.send(buf);
    });

  // ── PNG preview of cover spread (for browser display) ─────────────────────
  // GET /api/blueprint-preview?sizeCode=A5&pages=100&...
  fastify.get('/blueprint-preview', async (req, reply) => {
    const q = req.query as Record<string, unknown>;
    const sizeCode = (q.sizeCode as string) ?? 'A5';
    const pages = typeof q.pages === 'number' ? Number(q.pages) : 100;
    const paperCode = (q.paperCode as string) ?? 'BOOK72';
    const boardCode = (q.boardCode as string) ?? 'BOARD20';
    const coverFinish = (q.coverFinish as string) ?? 'doff';
    const spineText = (q.spineText as string) ?? 'BOOXURY';

    const dims = SIZE_DIMS[sizeCode] ?? SIZE_DIMS.A5;
    const caliper = PAPER_CALIPER[paperCode] ?? 0.095;
    const boardThickness = BOARD_THICKNESS[boardCode] ?? 2.0;

    const spine = calculateSpine({
      pages,
      paperCaliperMm: caliper,
      boardThicknessMm: boardThickness,
      endpaperThicknessMm: 0.12,
      hingeAllowanceMm: 2.0,
    }, dims);

    const png = await generateCoverPreviewPng({
      spine,
      bookWidthMm: dims.widthMm,
      bookHeightMm: dims.heightMm,
      spineText,
      sizeCode,
      pages,
      paperCode,
      boardCode,
      coverFinish,
    });

    if (!png) {
      return reply.status(500).send({ error: { code: 'PREVIEW_FAILED', message: 'Preview generation failed (pdftoppm may not be installed)' } });
    }

    reply.header('Content-Type', 'image/png');
    reply.header('Content-Disposition', `inline; filename="booxury-preview-${sizeCode}.png"`);
    return reply.send(png);
  });
}

// ── Authenticated blueprint PDF (requires saved design + ownership) ─────────────
// POST /api/blueprint-pdf
// Body: { designId }
// Auth: required
export async function productionRoutes(fastify: FastifyInstance) {
  fastify.post('/blueprint-pdf', {
    preHandler: [async (req) => authGuard(fastify, req)],
  }, async (req, reply) => {
    const userId = (req.user as { id: string }).id;
    const { designId } = req.body as { designId?: string };

    if (!designId) {
      return reply.status(400).send({ error: { code: 'VALIDATION_FAILED', message: 'designId required' } });
    }

    const design = await (fastify.prisma.design.findUnique as any)({
      where: { id: designId },
      include: {
        sizePreset: { select: { code: true, widthMm: true, heightMm: true } },
        coverFinish: { select: { code: true, name: true } },
        paper: { select: { code: true, paperCaliperMm: true } },
        board: { select: { code: true, thicknessMm: true } },
      },
    });

    if (!design || design.userId !== userId) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Design not found' } });
    }

    const dims = { widthMm: design.sizePreset.widthMm, heightMm: design.sizePreset.heightMm };
    const paperCaliper = design.paper?.paperCaliperMm ? Number(design.paper.paperCaliperMm) : 0.1;
    const boardThickness = design.board?.thicknessMm ? Number(design.board.thicknessMm) : 2.0;

    const spine = calculateSpine({
      pages: design.pages,
      paperCaliperMm: paperCaliper,
      boardThicknessMm: boardThickness,
      endpaperThicknessMm: 0.12,
      hingeAllowanceMm: 2.0,
    }, dims);

    const frontPanelImage = await resolveImage(design.thumbnailUrl);
    const finishConfig = (design.finishConfig as Record<string, unknown>) ?? {};
    const spineText = (finishConfig.spineText as string) ?? design.name ?? 'BOOXURY';

    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `inline; filename="booxury-blueprint-${design.id.slice(0, 8)}.pdf"`);

    const buf = await generateCoverPdfBuffer({
      spine,
      bookWidthMm: dims.widthMm,
      bookHeightMm: dims.heightMm,
      frontPanelImage,
      spineText,
      sizeCode: design.sizePreset?.code ?? 'A5',
      pages: design.pages,
      paperCode: design.paper?.code ?? 'BOOK72',
      boardCode: design.board?.code ?? 'BOARD20',
      coverFinish: design.coverFinish?.code ?? 'doff',
    });
    return reply.send(buf);
  });
}

async function resolveImage(thumbnailUrl: string | null | undefined): Promise<string | undefined> {
  if (!thumbnailUrl) return undefined;

  if (thumbnailUrl.startsWith('data:')) return thumbnailUrl;

  const absPath = thumbnailUrl.startsWith('/')
    ? `${process.cwd()}/apps/api/public${thumbnailUrl}`
    : thumbnailUrl;
  try {
    const buf = await fs.promises.readFile(absPath);
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    return undefined;
  }
}
