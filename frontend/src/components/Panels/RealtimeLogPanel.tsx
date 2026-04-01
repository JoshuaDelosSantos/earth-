/** RealtimeLogPanel — scrolling log viewer for OSINT data fetch metadata. */

import { useEffect, useRef } from "react";
import { useDataStore, type LogEntry } from "../../stores/dataStore";
import type { PanelProps } from "./PanelRegistry";

const LEVEL_COLOR: Record<LogEntry["level"], string> = {
  INFO: "text-panel-text",
  WARN: "text-panel-warn",
  ERR: "text-panel-error",
};

export default function RealtimeLogPanel(_props: PanelProps) {
  const logs = useDataStore((s) => s.realtimeLogs);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  return (
    <div className="h-full overflow-y-auto p-2 text-[11px] leading-relaxed font-mono">
      {logs.length === 0 && (
        <span className="text-panel-muted">awaiting data…</span>
      )}
      {logs.map((entry, i) => (
        <div key={i} className="whitespace-nowrap">
          <span className="text-panel-muted">{entry.timestamp}</span>{" "}
          <span className={LEVEL_COLOR[entry.level]}>[{entry.level}]</span>{" "}
          <span className="text-panel-muted">{entry.source}</span>{" "}
          <span className="text-panel-text">{entry.message}</span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
