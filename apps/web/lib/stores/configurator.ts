import { create } from 'zustand';
import { BaseConfig, FinishConfig, DesignPayload } from '@booxury/design-types';
import { computeSpineWidth } from '@booxury/spine-calc';

export type WizardPhase = 'base' | 'cover' | 'finish' | 'review';

// Cart item — snapshot at add-to-cart time
export interface CartItem {
  id: string;
  designId?: string;
  size: string;
  pages: number;
  paperCode: string;
  boardCode: string;
  endpaperCode: string;
  layout: string;
  coverFinish: string;
  coverColor?: string;
  cornerShape: string;
  edgeFinish: string;
  hasDustJacket: boolean;
  headbandCode?: string;
  ribbonCodes: string[];
  price: number;
  spineWidthMm: number;
  createdAt: string;
}

interface ConfiguratorStore {
  // Current phase
  phase: WizardPhase;
  setPhase: (phase: WizardPhase) => void;

  // Base config
  base: BaseConfig;
  setBase: (patch: Partial<BaseConfig>) => void;

  // Cover texture URL (from Konva canvas or uploaded design)
  coverTextureUrl: string | null;
  setCoverTextureUrl: (url: string | null) => void;

  // Cover editor payload (Konva)
  designPayload: DesignPayload;
  setDesignPayload: (payload: Partial<DesignPayload>) => void;
  updateLayer: (panel: keyof DesignPayload, layerId: string, patch: Record<string, unknown>) => void;

  // Finish config
  finish: FinishConfig;
  setFinish: (patch: Partial<FinishConfig>) => void;

  // Calculated spine width in mm
  spineWidthMm: number;

  // Current design id (for save/restore)
  designId: string | null;
  setDesignId: (id: string | null) => void;

  // Price preview
  estimatedPrice: number | null;
  setEstimatedPrice: (price: number | null) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id' | 'createdAt'>) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;

  // Reset
  reset: () => void;
}

// All field names match @booxury/design-types BaseConfig
const DEFAULT_BASE: BaseConfig = {
  size: 'A5',
  pages: 100,
  paperCode: 'BOOK72',
  boardCode: 'BOARD20',
  endpaperCode: 'ENDPLAIN',
  layout: 'plain',
};

const DEFAULT_DESIGN_PAYLOAD: DesignPayload = {
  front: [],
  back: [],
  spine: [],
  finishZones: [],
};

const DEFAULT_FINISH: FinishConfig = {
  coverFinish: 'doff',
  coverColor: '#1d3557',
  cornerShape: 'square',
  edgeFinish: 'plain',
  hasDustJacket: false,
  headbandCode: undefined,
  ribbonCodes: [],
  accessories: [],
};

export const useConfiguratorStore = create<ConfiguratorStore>((set) => ({
  phase: 'base',
  setPhase: (phase) => set({ phase }),

  base: DEFAULT_BASE,
  spineWidthMm: computeSpineWidth({
    pages: DEFAULT_BASE.pages,
    paperCode: DEFAULT_BASE.paperCode,
    boardCode: DEFAULT_BASE.boardCode,
    endpaperCode: DEFAULT_BASE.endpaperCode,
    sizeCode: DEFAULT_BASE.size,
  }),
  setBase: (patch) =>
    set((s) => {
      const updatedBase = { ...s.base, ...patch };
      const updatedSpine = computeSpineWidth({
        pages: updatedBase.pages,
        paperCode: updatedBase.paperCode,
        boardCode: updatedBase.boardCode,
        endpaperCode: updatedBase.endpaperCode,
        sizeCode: updatedBase.size,
      });
      return {
        base: updatedBase,
        spineWidthMm: updatedSpine,
      };
    }),

  coverTextureUrl: null,
  setCoverTextureUrl: (url) => set({ coverTextureUrl: url }),

  designPayload: DEFAULT_DESIGN_PAYLOAD,
  setDesignPayload: (payload) => set((s) => ({ designPayload: { ...s.designPayload, ...payload } })),
  updateLayer: (panel, layerId, patch) =>
    set((s) => ({
      designPayload: {
        ...s.designPayload,
        [panel]: s.designPayload[panel].map((l) =>
          l.id === layerId ? { ...l, ...patch } : l
        ),
      },
    })),

  finish: DEFAULT_FINISH,
  setFinish: (patch) => set((s) => ({ finish: { ...s.finish, ...patch } })),

  designId: null,
  setDesignId: (id) => set({ designId: id }),

  estimatedPrice: null,
  setEstimatedPrice: (price) => set({ estimatedPrice: price }),

  cart: [],
  addToCart: (item) => set((s) => ({
    cart: [...s.cart, { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() }],
  })),
  removeFromCart: (id) => set((s) => ({ cart: s.cart.filter((i) => i.id !== id) })),
  clearCart: () => set({ cart: [] }),

  reset: () => set({
    phase: 'base',
    base: DEFAULT_BASE,
    spineWidthMm: computeSpineWidth({
      pages: DEFAULT_BASE.pages,
      paperCode: DEFAULT_BASE.paperCode,
      boardCode: DEFAULT_BASE.boardCode,
      endpaperCode: DEFAULT_BASE.endpaperCode,
      sizeCode: DEFAULT_BASE.size,
    }),
    coverTextureUrl: null,
    designPayload: DEFAULT_DESIGN_PAYLOAD,
    finish: DEFAULT_FINISH,
    designId: null,
    estimatedPrice: null,
  }),
}));
