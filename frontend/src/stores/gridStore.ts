/** Zustand store for grid layout and panel state — persists to localStorage. */

import { create } from "zustand";
import type { PanelObject } from "../types/panels";
import type { Layout } from "react-grid-layout";

const STORAGE_KEY = "earth-grid-layout";

const DEFAULT_PANELS: PanelObject[] = [
  {
    id: "vis",
    type: "visualisation",
    title: "Visualisation",
    gridPosition: { x: 0, y: 0, w: 8, h: 2 },
    config: {},
  },
  {
    id: "layers",
    type: "data-layers",
    title: "Data Layers",
    gridPosition: { x: 8, y: 0, w: 4, h: 1 },
    config: {},
  },
  {
    id: "rt-log",
    type: "realtime-log",
    title: "Realtime Log",
    gridPosition: { x: 8, y: 1, w: 4, h: 1 },
    config: {},
  },
  {
    id: "sys-log",
    type: "system-log",
    title: "System Log",
    gridPosition: { x: 0, y: 2, w: 12, h: 1 },
    config: {},
  },
];

function loadLayout(): PanelObject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PanelObject[];
  } catch {
    /* ignore corrupt data */
  }
  return DEFAULT_PANELS;
}

function saveLayout(panels: PanelObject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(panels));
}

interface GridStore {
  panels: PanelObject[];
  setPanels: (panels: PanelObject[]) => void;
  updateLayout: (layout: Layout[]) => void;
  resetLayout: () => void;
}

export const useGridStore = create<GridStore>((set) => ({
  panels: loadLayout(),

  setPanels: (panels) => {
    saveLayout(panels);
    set({ panels });
  },

  updateLayout: (layout) =>
    set((state) => {
      const panels = state.panels.map((panel) => {
        const item = layout.find((l) => l.i === panel.id);
        if (!item) return panel;
        return {
          ...panel,
          gridPosition: { x: item.x, y: item.y, w: item.w, h: item.h },
        };
      });
      saveLayout(panels);
      return { panels };
    }),

  resetLayout: () => {
    saveLayout(DEFAULT_PANELS);
    set({ panels: DEFAULT_PANELS });
  },
}));
