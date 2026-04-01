/** Zustand store for data layer state and log entries. */

import { create } from "zustand";

export interface LogEntry {
  timestamp: string;
  source: string;
  level: "INFO" | "WARN" | "ERR";
  message: string;
}

export interface DataLayer {
  id: string;
  name: string;
  source: string;
  active: boolean;
  status: "idle" | "loading" | "ok" | "error";
  lastUpdate: string | null;
  recordCount: number;
}

const DEFAULT_LAYERS: DataLayer[] = [
  { id: "usgs-earthquake", name: "USGS Earthquakes", source: "USGS", active: false, status: "idle", lastUpdate: null, recordCount: 0 },
  { id: "nasa-eonet", name: "NASA EONET Events", source: "NASA", active: false, status: "idle", lastUpdate: null, recordCount: 0 },
  { id: "gdelt-news", name: "GDELT News Events", source: "GDELT", active: false, status: "idle", lastUpdate: null, recordCount: 0 },
  { id: "opensky-aircraft", name: "OpenSky Aircraft", source: "OpenSky", active: false, status: "idle", lastUpdate: null, recordCount: 0 },
  { id: "nasa-gibs", name: "NASA GIBS Imagery", source: "NASA GIBS", active: false, status: "idle", lastUpdate: null, recordCount: 0 },
];

interface DataStore {
  layers: DataLayer[];
  layerData: Record<string, GeoJSON.FeatureCollection>;
  realtimeLogs: LogEntry[];
  systemLogs: LogEntry[];
  toggleLayer: (layerId: string) => void;
  updateLayerStatus: (layerId: string, patch: Partial<DataLayer>) => void;
  setLayerData: (layerId: string, data: GeoJSON.FeatureCollection) => void;
  addRealtimeLog: (entry: LogEntry) => void;
  addSystemLog: (entry: LogEntry) => void;
}

const MAX_LOG_ENTRIES = 500;

export const useDataStore = create<DataStore>((set) => ({
  layers: DEFAULT_LAYERS,
  layerData: {},
  realtimeLogs: [],
  systemLogs: [],

  toggleLayer: (layerId) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, active: !l.active } : l
      ),
    })),

  updateLayerStatus: (layerId, patch) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, ...patch } : l
      ),
    })),

  setLayerData: (layerId, data) =>
    set((state) => ({
      layerData: { ...state.layerData, [layerId]: data },
    })),

  addRealtimeLog: (entry) =>
    set((state) => ({
      realtimeLogs: [...state.realtimeLogs, entry].slice(-MAX_LOG_ENTRIES),
    })),

  addSystemLog: (entry) =>
    set((state) => ({
      systemLogs: [...state.systemLogs, entry].slice(-MAX_LOG_ENTRIES),
    })),
}));
