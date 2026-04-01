/** WebSocket hook — connects to backend, routes messages to Zustand stores, handles reconnection. */

import { useEffect, useRef, useCallback } from "react";
import { useDataStore } from "../stores/dataStore";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8000/ws";
const RECONNECT_DELAY = 3000;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addRealtimeLog = useDataStore((s) => s.addRealtimeLog);
  const addSystemLog = useDataStore((s) => s.addSystemLog);
  const setLayerData = useDataStore((s) => s.setLayerData);
  const updateLayerStatus = useDataStore((s) => s.updateLayerStatus);

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      addSystemLog({
        timestamp: utcNow(),
        source: "WS",
        level: "INFO",
        message: "websocket connected",
      });
    };

    ws.onclose = () => {
      addSystemLog({
        timestamp: utcNow(),
        source: "WS",
        level: "WARN",
        message: "websocket disconnected — reconnecting…",
      });
      // Auto-reconnect
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
    };

    ws.onerror = () => {
      addSystemLog({
        timestamp: utcNow(),
        source: "WS",
        level: "ERR",
        message: "websocket error",
      });
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        routeMessage(msg);
      } catch {
        /* ignore malformed messages */
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const routeMessage = useCallback(
    (msg: Record<string, unknown>) => {
      switch (msg.type) {
        case "data_update":
          {
            const layerId = msg.layer_id as string;
            const geojson = msg.geojson as GeoJSON.FeatureCollection;
            const count = (msg.record_count as number) ?? 0;
            if (layerId && geojson) {
              setLayerData(layerId, geojson);
              updateLayerStatus(layerId, {
                status: "ok",
                lastUpdate: (msg.timestamp as string) ?? utcNow(),
                recordCount: count,
              });
            }
          }
          break;

        case "fetch_log":
          addRealtimeLog({
            timestamp: (msg.timestamp as string) ?? utcNow(),
            source: (msg.source as string) ?? "?",
            level: (msg.level as "INFO" | "WARN" | "ERR") ?? "INFO",
            message: (msg.message as string) ?? "",
          });
          break;

        case "system_log":
          addSystemLog({
            timestamp: (msg.timestamp as string) ?? utcNow(),
            source: (msg.source as string) ?? "SYS",
            level: (msg.level as "INFO" | "WARN" | "ERR") ?? "INFO",
            message: (msg.message as string) ?? "",
          });
          break;
      }
    },
    [addRealtimeLog, addSystemLog, setLayerData, updateLayerStatus],
  );

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return wsRef;
}

function utcNow(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}
