// React Three Fiber stack — client-only, SSR-safe
// Scene — Canvas wrapper with postprocessing
export { Scene3D } from './scene-3d';
export type { Scene3DProps } from './scene-3d';

// Book geometry
export { HardcoverModel } from './hardcover-model';
export type { HardcoverModelProps } from './hardcover-model';

// Materials factory & constants
export {
  buildMaterial,
  buildEdgeMaterial,
  COVER_PARAMS,
  COVER_COLOR,
  EDGE_PARAMS,
  EDGE_COLORS,
  HEADBAND_COLORS,
  RIBBON_COLORS,
  PAPER_COLORS,
  ENDPAPER_COLORS,
  CORNER_RADIUS,
  SIZE_DIMS,
  ENDPAPER_COLOR,
  PAGE_COLOR,
} from './book-materials';
export type { CoverFinish, EdgeFinish, CornerShape, MaterialInputs } from './book-materials';

// Camera rigs
export {
  CinematicRig,
  OrbitRig,
  CinematicOrbitRig,
  useCinematicTransition,
  CAMERA_POSITIONS,
} from './camera-rigs';

// Client-only helpers
export { ClientOnly, useClientOnly, MotionSensitiveCanvas } from './client-only';

