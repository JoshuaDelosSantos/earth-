/** TypeScript type definitions for panel objects and grid layout. */

export type PanelType =
  | "visualisation"
  | "data-layers"
  | "realtime-log"
  | "system-log";

export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PanelObject {
  id: string;
  type: PanelType;
  title: string;
  gridPosition: GridPosition;
  config: Record<string, unknown>;
}
