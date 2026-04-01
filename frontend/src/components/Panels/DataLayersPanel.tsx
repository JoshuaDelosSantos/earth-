/** DataLayersPanel — lists available OSINT data layers with toggle switches. */

import { useDataStore } from "../../stores/dataStore";
import type { PanelProps } from "./PanelRegistry";

const STATUS_INDICATOR: Record<string, string> = {
  idle: "○",
  loading: "◌",
  ok: "●",
  error: "✕",
};

const STATUS_COLOR: Record<string, string> = {
  idle: "text-panel-muted",
  loading: "text-panel-muted",
  ok: "text-panel-success",
  error: "text-panel-error",
};

export default function DataLayersPanel(_props: PanelProps) {
  const layers = useDataStore((s) => s.layers);
  const toggleLayer = useDataStore((s) => s.toggleLayer);

  return (
    <div className="p-2 overflow-y-auto h-full text-xs">
      {layers.map((layer) => (
        <button
          key={layer.id}
          onClick={() => toggleLayer(layer.id)}
          className="w-full flex items-center gap-2 py-1 px-1 hover:bg-[#111111] transition-colors text-left"
        >
          {/* Toggle indicator */}
          <span className={layer.active ? "text-panel-success" : "text-panel-muted"}>
            [{layer.active ? "x" : " "}]
          </span>

          {/* Layer name */}
          <span className="flex-1 text-panel-text">{layer.name}</span>

          {/* Status indicator */}
          <span className={STATUS_COLOR[layer.status] ?? "text-panel-muted"}>
            {STATUS_INDICATOR[layer.status] ?? "?"}
          </span>

          {/* Record count */}
          {layer.recordCount > 0 && (
            <span className="text-panel-muted w-8 text-right">
              {layer.recordCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
