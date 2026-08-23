import { create } from 'zustand';
import { BaseConfig, FinishConfig, DesignPayload } from '@booxury/design-types';

export type WizardPhase = 'base' | 'cover' | 'finish' | 'review';

interface ConfiguratorStore {
  // Current phase
  phase: WizardPhase;
  setPhase: (phase: WizardPhase) => void;

  // Base config
  base: BaseConfig;
  setBase: (patch: Partial<BaseConfig>) => void;

  // Cover editor payload (Konva)
  designPayload: DesignPayload;
  setDesignPayload: (payload: Partial<DesignPayload>) => void;
  updateLayer: (panel: keyof DesignPayload, layerId: string, patch: Record<string, unknown>) => void;

  // Finish config
  finish: FinishConfig;
  setFinish: (patch: Partial<FinishConfig>) => void;

  // Current design id (for save/restore)
  designId: string | null;
  setDesignId: (id: string | null) => void;

  // Price preview
  estimatedPrice: number | null;
  setEstimatedPrice: (price: number | null) => void;

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

// New FinishConfig fields: cornerShape, edgeFinish, hasDustJacket, headbandCode, ribbonCodes
const DEFAULT_FINISH: FinishConfig = {
  coverFinish: 'doff',
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
  setBase: (patch) => set((s) => ({ base: { ...s.base, ...patch } })),

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

  reset: () => set({
    phase: 'base',
    base: DEFAULT_BASE,
    designPayload: DEFAULT_DESIGN_PAYLOAD,
    finish: DEFAULT_FINISH,
    designId: null,
    estimatedPrice: null,
  }),
}));
