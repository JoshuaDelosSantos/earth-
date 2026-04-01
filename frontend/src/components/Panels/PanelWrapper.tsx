/** PanelWrapper — renders panel header (title, drag handle) and delegates body to registry. */

import type { PanelObject } from "../../types/panels";
import panelRegistry from "./PanelRegistry";

interface Props {
  panel: PanelObject;
}

export default function PanelWrapper({ panel }: Props) {
  const BodyComponent = panelRegistry.get(panel.type);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-panel-bg border border-panel-border">
      {/* Header — drag handle is the title bar */}
      <div className="panel-drag-handle flex items-center justify-between px-2 py-1 border-b border-panel-border cursor-move select-none shrink-0">
        <span className="text-[10px] uppercase tracking-wider text-panel-muted">
          {panel.title}
        </span>
        <span className="text-[10px] text-panel-muted">
          ≡
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {BodyComponent ? (
          <BodyComponent panelId={panel.id} config={panel.config} />
        ) : (
          <div className="p-2 text-panel-muted text-xs">
            [unknown panel type: {panel.type}]
          </div>
        )}
      </div>
    </div>
  );
}
