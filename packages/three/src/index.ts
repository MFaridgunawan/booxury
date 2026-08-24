// React Three Fiber stack — client-only, SSR-safe
// Only export what's actually used by apps/web to keep bundle minimal

// Scene — Canvas wrapper with postprocessing
export { Scene3D } from './scene-3d';
export type { Scene3DProps } from './scene-3d';

// Book geometry
export { HardcoverModel } from './hardcover-model';
export type { HardcoverModelProps } from './hardcover-model';

// Materials factory
export { buildMaterial, EDGE_COLORS, RIBBON_COLORS } from './book-materials';
export type { CoverFinish, EdgeFinish, CornerShape } from './book-materials';

// Camera rigs
export { CinematicRig, OrbitRig } from './camera-rigs';
