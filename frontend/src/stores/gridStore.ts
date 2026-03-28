/** Zustand store for grid layout and panel state. */

import { create } from "zustand";
import type { PanelObject } from "../types/panels";

interface GridStore {
  panels: PanelObject[];
  setPanels: (panels: PanelObject[]) => void;
}

export const useGridStore = create<GridStore>((set) => ({
  panels: [],
  setPanels: (panels) => set({ panels }),
}));
