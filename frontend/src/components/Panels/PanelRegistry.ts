/** Panel registry — maps PanelType to the component that renders it. */

import type { ComponentType } from "react";
import type { PanelType } from "../../types/panels";
import VisualisationPanel from "./VisualisationPanel";
import DataLayersPanel from "./DataLayersPanel";
import RealtimeLogPanel from "./RealtimeLogPanel";
import SystemLogPanel from "./SystemLogPanel";

export interface PanelProps {
  panelId: string;
  config: Record<string, unknown>;
}

const panelRegistry = new Map<PanelType, ComponentType<PanelProps>>([
  ["visualisation", VisualisationPanel],
  ["data-layers", DataLayersPanel],
  ["realtime-log", RealtimeLogPanel],
  ["system-log", SystemLogPanel],
]);

export default panelRegistry;
