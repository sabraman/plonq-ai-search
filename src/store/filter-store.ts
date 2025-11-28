import { create } from "zustand";

export interface FilterState {
  deviceTypes: string[]; // "Disposable", "POD System", "E-Liquid"
  categories: string[]; // "Fruits", "Berries", etc.
  flavors: string[]; // Legacy
  puffsRange: [number, number]; // Legacy, keeping for compatibility if needed
  puffs: number[]; // Specific puff counts: 600, 1500, etc.
  coldness: number[]; // 0, 1, 2
  sweetness: number[]; // 0, 1, 2
  sourness: boolean[]; // true, false
  strength: string[]; // "Balanced", "High"
  sortBy: string; // "rating-desc", "rating-asc"
  showFavorites: boolean;
}

interface FilterStore extends FilterState {
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  setDeviceTypes: (types: string[]) => void;
  setCategories: (categories: string[]) => void;
  setPuffsRange: (range: [number, number]) => void;
  setPuffs: (values: number[]) => void;
  setColdness: (values: number[]) => void;
  setSweetness: (values: number[]) => void;
  setSourness: (values: boolean[]) => void;
  setStrength: (values: string[]) => void;
  setSortBy: (value: string) => void;
  setShowFavorites: (show: boolean) => void;
}

export const INITIAL_FILTERS: FilterState = {
  deviceTypes: [],
  categories: [],
  flavors: [],
  puffsRange: [0, 20000],
  puffs: [],
  coldness: [],
  sweetness: [],
  sourness: [],
  strength: [],
  sortBy: "default",
  showFavorites: false,
};

export const useFilterStore = create<FilterStore>((set) => ({
  ...INITIAL_FILTERS,
  setFilters: (filters) => set((state) => ({ ...state, ...filters })),
  resetFilters: () => set(INITIAL_FILTERS),
  setDeviceTypes: (deviceTypes) => set({ deviceTypes }),
  setCategories: (categories) => set({ categories }),
  setPuffsRange: (puffsRange) => set({ puffsRange }),
  setPuffs: (puffs) => set({ puffs }),
  setColdness: (coldness) => set({ coldness }),
  setSweetness: (sweetness) => set({ sweetness }),
  setSourness: (sourness) => set({ sourness }),
  setStrength: (strength) => set({ strength }),
  setSortBy: (sortBy) => set({ sortBy }),
  setShowFavorites: (showFavorites) => set({ showFavorites }),
}));
