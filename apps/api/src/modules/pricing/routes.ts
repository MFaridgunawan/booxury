import { FastifyInstance } from '../../types.js';
import { z } from 'zod';
import { calculatePrice, calculateSpineForPricing } from '@booxury/pricing-engine';
import { validateSpine } from '@booxury/spine-calc';

const PriceQuoteSchema = z.object({
  sizeCode: z.enum(['A5', 'B5', 'A6']),
  pages: z.number().min(80).max(400),
  paperCode: z.string(),
  boardCode: z.string(),
  endpaperCode: z.string().default('ENDPLAIN'),
  layout: z.enum(['plain', 'lined']),
  // Finish options
  coverFinish: z.enum(['doff', 'glossy', 'canvas', 'leatherette']).default('doff'),
  cornerShape: z.enum(['square', 'round']).default('square'),
  edgeFinish: z.enum(['plain', 'gilded_gold', 'gilded_silver', 'sprayed_red', 'sprayed_blue', 'stenciled']).default('plain'),
  hasDustJacket: z.boolean().default(false),
  headbandCode: z.string().optional(),
  ribbonCodes: z.array(z.string()).max(2).default([]),
  accessories: z.array(z.object({ code: z.string(), type: z.enum(['STRAP', 'RIBBON']) })).optional(),
});

const SIZE_DIMS: Record<string, { widthMm: number; heightMm: number }> = {
  A5: { widthMm: 148, heightMm: 210 },
  B5: { widthMm: 176, heightMm: 250 },
  A6: { widthMm: 105, heightMm: 148 },
};

export async function pricingRoutes(fastify: FastifyInstance) {
  fastify.post('/price-quote', async (req, reply) => {
    const parsed = PriceQuoteSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(422).send({
        error: { code: 'VALIDATION_FAILED', message: 'Invalid request', details: parsed.error.flatten() }
      });
    }

    const data = parsed.data;

    // Signature binding: pages must be divisible by 4
    if (data.pages % 4 !== 0) {
      return reply.status(422).send({
        error: { code: 'VALIDATION_FAILED', message: 'Jumlah halaman harus kelipatan 4 (signature binding)' }
      });
    }

    const spine = calculateSpineForPricing(data.pages, data.paperCode, data.boardCode, data.endpaperCode);
    const validation = validateSpine(spine.spineWidthMm, data.sizeCode, data.pages);

    if (!validation.valid) {
      return reply.status(422).send({
        error: { code: 'SPINE_INVALID', message: validation.reason }
      });
    }

    const quote = calculatePrice(
      {
        sizeCode: data.sizeCode,
        pages: data.pages,
        paperCode: data.paperCode,
        boardCode: data.boardCode,
        endpaperCode: data.endpaperCode,
        layout: data.layout,
      },
      {
        coverFinish: data.coverFinish,
        cornerShape: data.cornerShape,
        edgeFinish: data.edgeFinish,
        hasDustJacket: data.hasDustJacket,
        headbandCode: data.headbandCode,
        ribbonCodes: data.ribbonCodes,
        accessories: (data.accessories ?? []) as Array<{ code: string; type: 'STRAP' | 'RIBBON' }>,
      },
      {}
    );

    return {
      spine_width_mm: spine.spineWidthMm,
      total_sheet_width_mm: spine.totalSheetWidthMm,
      total_sheet_height_mm: spine.totalSheetHeightMm,
      min_pages: spine.minPages,
      ...quote,
    };
  });
}
