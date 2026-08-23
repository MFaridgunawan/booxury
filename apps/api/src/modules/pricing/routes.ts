import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { calculatePrice } from '@booxury/pricing-engine';
import { calculateSpine } from '@booxury/spine-calc';

const PriceQuoteSchema = z.object({
  sizeCode: z.enum(['A5', 'B5', 'A6']),
  pages: z.number().min(20).max(400),
  paperCode: z.string(),
  boardCode: z.string(),
  layout: z.enum(['PLAIN', 'LINED']),
  coverFinishCode: z.enum(['doff', 'glossy', 'canvas']),
  accessories: z.array(z.object({ code: z.string(), type: z.enum(['STRAP', 'RIBBON']) })).optional(),
});

const PAPER_CALIPER: Record<string, number> = {
  HVS80: 0.105, HVS100: 0.130, BOOK70: 0.082, BOOK80: 0.095,
};
const BOARD_THICKNESS: Record<string, number> = {
  BOARD15: 1.5, BOARD20: 2.0, BOARD25: 2.5, BOARD30: 3.0,
};
const SIZE_DIMS: Record<string, { widthMm: number; heightMm: number; basePrice: number }> = {
  A5: { widthMm: 148, heightMm: 210, basePrice: 35000 },
  B5: { widthMm: 176, heightMm: 250, basePrice: 45000 },
  A6: { widthMm: 105, heightMm: 148, basePrice: 25000 },
};

export async function pricingRoutes(fastify: FastifyInstance) {
  fastify.post('/price-quote', async (req, reply) => {
    const parsed = PriceQuoteSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(422).send({
        error: { code: 'VALIDATION_FAILED', message: 'Invalid request', details: parsed.error.flatten() }
      });
    }

    const { sizeCode, pages, paperCode, boardCode, layout, coverFinishCode, accessories = [] } = parsed.data;

    const caliper = PAPER_CALIPER[paperCode] ?? 0.105;
    const board = BOARD_THICKNESS[boardCode] ?? 2.0;

    const spine = calculateSpine({
      pages, paperCaliperMm: caliper, boardThicknessMm: board,
      endpaperThicknessMm: 0.12, hingeAllowanceMm: 2.0,
    }, { widthMm: SIZE_DIMS[sizeCode].widthMm, heightMm: SIZE_DIMS[sizeCode].heightMm });

    const quote = calculatePrice(
      { sizeCode, pages, paperCode, boardCode, layout },
      { coverFinishCode, accessories },
      {}
    );

    return {
      spine_width_mm: spine.spineWidthMm,
      ...quote,
    };
  });
}
