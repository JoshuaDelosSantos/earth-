/** WebSocket hook — connects to backend and routes messages to stores (stub). */

import { useEffect, useRef } from "react";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8000/ws";

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => console.log("[WS] connected");
    ws.onclose = () => console.log("[WS] disconnected");
    ws.onerror = (e) => console.error("[WS] error", e);

    return () => {
      ws.close();
    };
  }, []);

  return wsRef;
}
