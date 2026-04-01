/** Root application component — renders the UTC header and GRID. */

import { useEffect, useState } from "react";
import GridLayout from "./components/Grid/GridLayout";
import { useWebSocket } from "./hooks/useWebSocket";
import { useDataStore } from "./stores/dataStore";

function utcNow(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

function App() {
  const [utc, setUtc] = useState(utcNow);
  const addSystemLog = useDataStore((s) => s.addSystemLog);

  // Live UTC clock — update every second
  useEffect(() => {
    const id = setInterval(() => setUtc(utcNow()), 1000);
    return () => clearInterval(id);
  }, []);

  // Connect WebSocket
  useWebSocket();

  // Seed initial system log entry
  useEffect(() => {
    addSystemLog({
      timestamp: utcNow(),
      source: "SYS",
      level: "INFO",
      message: "dashboard initialised",
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-screen w-screen flex flex-col bg-panel-bg text-panel-text font-mono overflow-hidden">
      <header className="flex items-center justify-between px-4 py-1 border-b border-panel-border text-xs text-panel-muted shrink-0">
        <span className="text-panel-text">earth-</span>
        <span>{utc}</span>
      </header>
      <main className="flex-1 overflow-hidden">
        <GridLayout />
      </main>
    </div>
  );
}

export default App;
