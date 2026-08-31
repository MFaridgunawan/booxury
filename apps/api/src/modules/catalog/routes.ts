import { FastifyInstance } from '../../types.js';

// Static lookups — not stored in DB (MVP)
const CORNER_SHAPES = [
  { code: 'square', name: 'Square (Bulat)', priceModifier: 0 },
  { code: 'round',  name: 'Round (Tajam)',  priceModifier: 5000 },
];

const EDGE_FINISHES = [
  { code: 'plain',          name: 'Plain',           priceModifier: 0 },
  { code: 'gilded_gold',   name: 'Gilded (Emas)',   priceModifier: 20000 },
  { code: 'gilded_silver', name: 'Gilded (Perak)',  priceModifier: 20000 },
  { code: 'sprayed_red',   name: 'Sprayed (Merah)', priceModifier: 10000 },
  { code: 'sprayed_blue',  name: 'Sprayed (Biru)',  priceModifier: 10000 },
  { code: 'stenciled',     name: 'Stenciled',       priceModifier: 8000 },
];

const HEADBAND_COLORS = [
  { code: 'hb_merah',  name: 'Merah',   colorHex: '#b71c1c', priceModifier: 2000 },
  { code: 'hb_hitam',  name: 'Hitam',   colorHex: '#1a1a1a', priceModifier: 2000 },
  { code: 'hb_emas',   name: 'Emas',    colorHex: '#FFD700', priceModifier: 2000 },
  { code: 'hb_putih',  name: 'Putih',   colorHex: '#f5f5f5', priceModifier: 2000 },
];

const RIBBON_MARKERS = [
  { code: 'rb_merah',  name: 'Merah',  colorHex: '#b71c1c', priceModifier: 3000 },
  { code: 'rb_emas',   name: 'Emas',   colorHex: '#FFD700', priceModifier: 3000 },
  { code: 'rb_hijau',  name: 'Hijau',  colorHex: '#1b5e20', priceModifier: 3000 },
  { code: 'rb_biru',   name: 'Biru',   colorHex: '#1565c0', priceModifier: 3000 },
  { code: 'rb_hitam',  name: 'Hitam',  colorHex: '#1a1a1a', priceModifier: 3000 },
];

export async function catalogRoutes(fastify: FastifyInstance) {
  // ── Materials (paper, board, endpaper) ────────────────────────────────────
  fastify.get('/materials', async (req, reply) => {
    const { type } = req.query as { type?: string };
    const where: Record<string, unknown> = { isActive: true };
    if (type) where.type = type.toUpperCase();
    const materials = await fastify.prisma.material.findMany({ where });
    return { materials };
  });

  // ── Size presets ───────────────────────────────────────────────────────────
  fastify.get('/sizes', async (req, reply) => {
    const sizes = await fastify.prisma.sizePreset.findMany();
    return { sizes };
  });

  // ── Cover finishes ─────────────────────────────────────────────────────────
  fastify.get('/cover-finishes', async (req, reply) => {
    const finishes = await fastify.prisma.coverFinish.findMany();
    return { finishes };
  });

  // ── Accessories (headband, ribbon, dust jacket) ────────────────────────────
  fastify.get('/accessories', async (req, reply) => {
    const { type } = req.query as { type?: string };
    const where: Record<string, unknown> = { isActive: true };
    if (type) where.type = type.toUpperCase();
    const accessories = await fastify.prisma.accessory.findMany({ where });
    return { accessories };
  });

  // ── Corner shape options (static) ──────────────────────────────────────────
  fastify.get('/corner-shapes', async (req, reply) => {
    return { cornerShapes: CORNER_SHAPES };
  });

  // ── Edge finish options (static) ────────────────────────────────────────────
  fastify.get('/edge-finishes', async (req, reply) => {
    return { edgeFinishes: EDGE_FINISHES };
  });

  // ── Headband color options (static) ────────────────────────────────────────
  fastify.get('/headbands', async (req, reply) => {
    return { headbands: HEADBAND_COLORS };
  });

  // ── Ribbon marker options (static) ──────────────────────────────────────────
  fastify.get('/ribbons', async (req, reply) => {
    return { ribbons: RIBBON_MARKERS };
  });
}
