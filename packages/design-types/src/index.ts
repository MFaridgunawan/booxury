import { z } from 'zod';

// Konva layer types
export const KonvaLayerSchema = z.object({
  id: z.string(),
  type: z.enum(['image', 'text', 'background']),
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  rotation: z.number().optional(),
  fill: z.string().optional(),
  src: z.string().optional(),       // image URL or base64
  text: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fillHex: z.string().optional(),
  // Foil/emboss annotation
  finishEffect: z.enum(['gold_foil', 'emboss', 'none']).optional(),
});

export const FinishZoneSchema = z.object({
  type: z.enum(['gold_foil', 'emboss']),
  layerId: z.string(),
  bbox: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }),
  label: z.string().optional(),
});

export const BaseConfigSchema = z.object({
  size: z.enum(['A5', 'B5', 'A6']),
  pages: z.number().min(20).max(400),
  paper: z.string(),
  board: z.string(),
  layout: z.enum(['plain', 'lined']),
});

export const FinishConfigSchema = z.object({
  coverFinish: z.enum(['doff', 'glossy', 'canvas']),
  accessories: z.array(z.object({
    code: z.string(),
    type: z.enum(['STRAP', 'RIBBON']),
  })).optional(),
});

export const DesignPayloadSchema = z.object({
  front: z.array(KonvaLayerSchema),
  back: z.array(KonvaLayerSchema),
  spine: z.array(KonvaLayerSchema),
  finishZones: z.array(FinishZoneSchema).optional(),
});

export const SaveDesignSchema = z.object({
  name: z.string().min(1).max(100),
  baseConfig: BaseConfigSchema,
  designPayload: DesignPayloadSchema,
  finishConfig: FinishConfigSchema.optional(),
  thumbnail: z.string().optional(), // base64 PNG from Konva stage
});

export const UpdateDesignSchema = SaveDesignSchema.partial();

export type KonvaLayer = z.infer<typeof KonvaLayerSchema>;
export type FinishZone = z.infer<typeof FinishZoneSchema>;
export type BaseConfig = z.infer<typeof BaseConfigSchema>;
export type FinishConfig = z.infer<typeof FinishConfigSchema>;
export type DesignPayload = z.infer<typeof DesignPayloadSchema>;
export type SaveDesignInput = z.infer<typeof SaveDesignSchema>;
