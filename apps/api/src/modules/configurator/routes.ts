import { FastifyInstance } from '../../types.js';
import { Prisma } from '@prisma/client';
import { SaveDesignSchema, UpdateDesignSchema } from '@booxury/design-types';
import { calculatePrice } from '@booxury/pricing-engine';
import { calculateSpine } from '@booxury/spine-calc';
import * as fs from 'fs';
import * as path from 'path';

const PAPER_CALIPER: Record<string, number> = {
  HVS80: 0.105, HVS100: 0.130, BOOK70: 0.082, BOOK80: 0.095,
};
const BOARD_THICKNESS: Record<string, number> = {
  BOARD15: 1.5, BOARD20: 2.0, BOARD25: 2.5, BOARD30: 3.0,
};
const SIZE_DIMS: Record<string, { widthMm: number; heightMm: number }> = {
  A5: { widthMm: 148, heightMm: 210 },
  B5: { widthMm: 176, heightMm: 250 },
  A6: { widthMm: 105, heightMm: 148 },
};
const THUMBNAIL_DIR = path.join(process.cwd(), 'public', 'thumbnails');

async function authGuard(fastify: FastifyInstance, request: Parameters<typeof fastify.authenticate>[0]) {
  try {
    await request.jwtVerify();
  } catch {
    throw { code: 'UNAUTHORIZED', statusCode: 401 };
  }
}

export async function designRoutes(fastify: FastifyInstance) {
  // List designs
  fastify.get('/designs', {
    preHandler: [async (req) => authGuard(fastify, req)],
  }, async (req, reply) => {
    const userId = (req.user as { id: string }).id;
    const designs = await fastify.prisma.design.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, thumbnailUrl: true, totalPrice: true, spineWidthMm: true, updatedAt: true, status: true },
    });
    return { designs };
  });

  // Create design
  fastify.post('/designs', {
    preHandler: [async (req) => authGuard(fastify, req)],
  }, async (req, reply) => {
    const userId = (req.user as { id: string }).id;
    const parsed = SaveDesignSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(422).send({ error: { code: 'VALIDATION_FAILED', message: 'Invalid design data', details: parsed.error.flatten() } });
    }
    const { name, baseConfig, designPayload, finishConfig, thumbnail } = parsed.data;

    const dims = SIZE_DIMS[baseConfig.size] ?? SIZE_DIMS.A5;
    const caliper = PAPER_CALIPER[baseConfig.paperCode] ?? 0.105;
    const board = BOARD_THICKNESS[baseConfig.boardCode] ?? 2.0;

    const spine = calculateSpine({
      pages: baseConfig.pages,
      paperCaliperMm: caliper,
      boardThicknessMm: board,
      endpaperThicknessMm: 0.12,
      hingeAllowanceMm: 2.0,
    }, dims);

    const layoutForDb = baseConfig.layout.toUpperCase() as 'PLAIN' | 'LINED';

    const quote = calculatePrice(
      {
        sizeCode: baseConfig.size,
        pages: baseConfig.pages,
        paperCode: baseConfig.paperCode,
        boardCode: baseConfig.boardCode,
        endpaperCode: baseConfig.endpaperCode ?? 'ENDPLAIN',
        layout: baseConfig.layout,
      },
      {
        coverFinish: finishConfig?.coverFinish ?? 'doff',
        cornerShape: finishConfig?.cornerShape ?? 'square',
        edgeFinish: finishConfig?.edgeFinish ?? 'plain',
        hasDustJacket: finishConfig?.hasDustJacket ?? false,
        headbandCode: finishConfig?.headbandCode,
        ribbonCodes: finishConfig?.ribbonCodes ?? [],
        accessories: finishConfig?.accessories ?? [],
      },
      {}
    );

    // Save thumbnail
    let thumbnailUrl: string | null = null;
    if (thumbnail) {
      fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });
      const id = crypto.randomUUID();
      const buf = Buffer.from(thumbnail.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const fp = path.join(THUMBNAIL_DIR, `${id}.png`);
      fs.writeFileSync(fp, buf);
      thumbnailUrl = `/thumbnails/${id}.png`;
    }

    const design = await fastify.prisma.design.create({
      data: {
        userId,
        name,
        sizePresetId: (await fastify.prisma.sizePreset.findUniqueOrThrow({ where: { code: baseConfig.size } })).id,
        coverFinishId: (await fastify.prisma.coverFinish.findUniqueOrThrow({ where: { code: finishConfig?.coverFinish ?? 'doff' } })).id,
        paperMaterialId: (await fastify.prisma.material.findUniqueOrThrow({ where: { code: baseConfig.paperCode } })).id,
        boardMaterialId: (await fastify.prisma.material.findUniqueOrThrow({ where: { code: baseConfig.boardCode } })).id,
        pages: baseConfig.pages,
        layout: layoutForDb,
        designPayload: designPayload as Prisma.InputJsonValue,
        finishZones: designPayload.finishZones?.length ? designPayload.finishZones as Prisma.InputJsonValue : Prisma.JsonNull,
        finishConfig: finishConfig ? finishConfig as unknown as Prisma.InputJsonValue : Prisma.JsonNull,
        thumbnailUrl,
        totalPrice: quote.total,
        spineWidthMm: spine.spineWidthMm,
      },
    });

    return {
      id: design.id,
      thumbnailUrl: design.thumbnailUrl,
      total_price: design.totalPrice,
      spine_width_mm: spine.spineWidthMm,
    };
  });

  // Get single design
  fastify.get('/designs/:id', {
    preHandler: [async (req) => authGuard(fastify, req)],
  }, async (req, reply) => {
    const userId = (req.user as { id: string }).id;
    const { id } = req.params as { id: string };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const design = await (fastify.prisma.design.findFirst({
      where: { id, userId },
      include: {
        sizePreset: { select: { code: true } },
        paper: { select: { code: true } },
        board: { select: { code: true } },
      },
    } as any)) as any;
    if (!design) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Design not found' } });
    return { design };
  });

  // Update design (supports partial updates: finishConfig, designPayload, etc.)
  fastify.put('/designs/:id', {
    preHandler: [async (req) => authGuard(fastify, req)],
  }, async (req, reply) => {
    const userId = (req.user as { id: string }).id;
    const { id } = req.params as { id: string };
    const parsed = UpdateDesignSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(422).send({ error: { code: 'VALIDATION_FAILED', message: 'Invalid design data', details: parsed.error.flatten() } });

    const existing = await fastify.prisma.design.findFirst({ where: { id, userId } });
    if (!existing) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Design not found' } });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...parsed.data };
    if (parsed.data.finishConfig) updateData.finishConfig = parsed.data.finishConfig as Prisma.InputJsonValue;
    if (parsed.data.designPayload) updateData.designPayload = parsed.data.designPayload as Prisma.InputJsonValue;
    if (parsed.data.baseConfig) {
      updateData.pages = parsed.data.baseConfig.pages;
      updateData.layout = (parsed.data.baseConfig.layout as string).toUpperCase() as 'PLAIN' | 'LINED';
      if (parsed.data.baseConfig.size) {
        const size = await fastify.prisma.sizePreset.findUnique({ where: { code: parsed.data.baseConfig.size } });
        if (size) updateData.sizePresetId = size.id;
      }
    }

    const updated = await fastify.prisma.design.update({ where: { id }, data: updateData });
    return { updated_at: updated.updatedAt, total_price: updated.totalPrice };
  });

  // Delete design
  fastify.delete('/designs/:id', {
    preHandler: [async (req) => authGuard(fastify, req)],
  }, async (req, reply) => {
    const userId = (req.user as { id: string }).id;
    const { id } = req.params as { id: string };
    const existing = await fastify.prisma.design.findFirst({ where: { id, userId } });
    if (!existing) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Design not found' } });
    await fastify.prisma.design.delete({ where: { id } });
    return { deleted: true };
  });
}
