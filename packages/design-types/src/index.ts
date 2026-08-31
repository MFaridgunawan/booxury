import { z } from 'zod';

// ── Konva Layer ──────────────────────────────────────────────────────────────

export const KonvaLayerSchema = z.object({
  id: z.string(),
  type: z.enum(['image', 'text', 'background']),
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  rotation: z.number().optional(),
  fill: z.string().optional(),
  src: z.string().optional(),
  text: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fillHex: z.string().optional(),
  finishEffect: z.enum(['gold_foil', 'emboss', 'deboss', 'spot_uv', 'none']).optional(),
});

export const FinishZoneSchema = z.object({
  type: z.enum(['gold_foil', 'emboss', 'deboss', 'spot_uv']),
  layerId: z.string(),
  bbox: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }),
  label: z.string().optional(),
});

// ── Base Config ────────────────────────────────────────────────────────────────

export const BaseConfigSchema = z.object({
  size: z.enum(['A5', 'B5', 'A6']),
  // Signature binding: min 80 pages (40 sheets), step must be divisible by 4
  pages: z.number().min(80).max(400).refine(n => n % 4 === 0, {
    message: 'Jumlah halaman harus kelipatan 4 (signature binding)',
  }),
  paperCode: z.string(),         // BOOK57, BOOK72, BOOK90, HVS70, HVS80, HVS100, ART120, ART150, MATT120, MATT150
  boardCode: z.string(),         // BOARD14, BOARD18, BOARD20, BOARD25
  endpaperCode: z.string(),      // ENDFLAT, ENDPLAIN, ENDPAT
  layout: z.enum(['plain', 'lined']),
});

// ── Finish Config ─────────────────────────────────────────────────────────────

export const CoverFinishCodeSchema = z.enum(['doff', 'glossy', 'canvas', 'leatherette']);

export const CornerShapeSchema = z.enum(['square', 'round']);

export const EdgeFinishSchema = z.enum(['plain', 'gilded_gold', 'gilded_silver', 'sprayed_red', 'sprayed_blue', 'stenciled']);

export const AccessoryItemSchema = z.object({
  code: z.string(),
  type: z.enum(['STRAP', 'RIBBON']),
});

export const FinishConfigSchema = z.object({
  coverFinish: CoverFinishCodeSchema,
  coverColor: z.string().optional().default('#1d3557'),
  cornerShape: CornerShapeSchema.default('square'),
  edgeFinish: EdgeFinishSchema.default('plain'),
  hasDustJacket: z.boolean().default(false),
  headbandCode: z.string().optional(),    // hb_merah, hb_hitam, hb_emas, hb_putih
  ribbonCodes: z.array(z.string()).max(2).default([]), // max 2 ribbon markers
  accessories: z.array(AccessoryItemSchema).default([]),
});

// ── Design Payload ────────────────────────────────────────────────────────────

export const DesignPayloadSchema = z.object({
  front: z.array(KonvaLayerSchema),
  back: z.array(KonvaLayerSchema),
  spine: z.array(KonvaLayerSchema),
  finishZones: z.array(FinishZoneSchema).default([]),
});

// ── Save / Update ────────────────────────────────────────────────────────────

export const SaveDesignSchema = z.object({
  name: z.string().min(1).max(100),
  baseConfig: BaseConfigSchema,
  designPayload: DesignPayloadSchema,
  finishConfig: FinishConfigSchema.optional(),
  thumbnail: z.string().optional(), // base64 PNG from Konva stage
});

export const UpdateDesignSchema = SaveDesignSchema.partial();

// ── Types ─────────────────────────────────────────────────────────────────────

export type KonvaLayer = z.infer<typeof KonvaLayerSchema>;
export type FinishZone = z.infer<typeof FinishZoneSchema>;
export type BaseConfig = z.infer<typeof BaseConfigSchema>;
export type CoverFinishCode = z.infer<typeof CoverFinishCodeSchema>;
export type CornerShape = z.infer<typeof CornerShapeSchema>;
export type EdgeFinish = z.infer<typeof EdgeFinishSchema>;
export type AccessoryItem = z.infer<typeof AccessoryItemSchema>;
export type FinishConfig = z.infer<typeof FinishConfigSchema>;
export type DesignPayload = z.infer<typeof DesignPayloadSchema>;
export type SaveDesignInput = z.infer<typeof SaveDesignSchema>;

// ── Customer Proof Request ───────────────────────────────────────────────────

export const ProofRequestSchema = z.object({
  // base + finish from wizard (finish partial untuk guest tanpa finalisasi)
  base: BaseConfigSchema,
  finish: FinishConfigSchema.partial().optional().default({}),
  artworkFront: z
    .string()
    .startsWith('data:image/', { message: 'artworkFront harus data URL PNG/JPEG' })
    .max(2_000_000, { message: 'Artwork maksimal 2MB' })
    .optional(),
});

export type ProofRequestInput = z.infer<typeof ProofRequestSchema>;

// ── Paper metadata (for UI display) ──────────────────────────────────────────

export const PAPER_CATEGORIES = {
  bookpaper: { label: 'Bookpaper', desc: 'Krem, nyaman untuk teks panjang (novel, biografi)' },
  hvs:       { label: 'HVS',       desc: 'Putih bersih, untuk teks/formulir' },
  art:       { label: 'Art Paper', desc: 'Glossy, untuk reproduksi warna tinggi (foto)' },
  matt:      { label: 'Matt Paper', desc: 'Doff/coated, untuk foto dengan tampilan redup' },
} as const;

export type PaperCategory = keyof typeof PAPER_CATEGORIES;
