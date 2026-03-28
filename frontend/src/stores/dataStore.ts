/** Zustand store for data layer state and log entries. */

import { create } from "zustand";

export interface LogEntry {
  timestamp: string;
  source: string;
  level: "INFO" | "WARN" | "ERR";
  message: string;
}

interface DataStore {
  activeDataLayers: Set<string>;
  realtimeLogs: LogEntry[];
  systemLogs: LogEntry[];
  toggleLayer: (layerId: string) => void;
  addRealtimeLog: (entry: LogEntry) => void;
  addSystemLog: (entry: LogEntry) => void;
}

const MAX_LOG_ENTRIES = 500;

export const useDataStore = create<DataStore>((set) => ({
  activeDataLayers: new Set(),
  realtimeLogs: [],
  systemLogs: [],
  toggleLayer: (layerId) =>
    set((state) => {
      const next = new Set(state.activeDataLayers);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return { activeDataLayers: next };
    }),
  addRealtimeLog: (entry) =>
    set((state) => ({
      realtimeLogs: [...state.realtimeLogs, entry].slice(-MAX_LOG_ENTRIES),
    })),
  addSystemLog: (entry) =>
    set((state) => ({
      systemLogs: [...state.systemLogs, entry].slice(-MAX_LOG_ENTRIES),
    })),
}));
