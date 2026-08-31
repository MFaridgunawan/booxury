/**
 * Animation constants — shared across the app.
 * Easing curves follow editorial-style design: snappy in, soft settle.
 */

export const EASE_EXPO_OUT = [0.16, 1, 0.3, 1] as const;

export const DURATION_SLOW = 0.75;
export const DURATION_NORMAL = 0.55;
export const DURATION_FAST = 0.35;
export const CLIP_DURATION = 0.9;

export const STAGGER_DEFAULT = 0.1;
export const STAGGER_FAST = 0.06;
export const STAGGER_80MS = 0.08;
export const STAGGER_100MS = 0.1;
export const STAGGER_120MS = 0.12;