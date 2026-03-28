/** Root application component — renders the UTC header and GRID. */

function App() {
  const utc = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  return (
    <div className="h-screen w-screen flex flex-col bg-panel-bg text-panel-text font-mono">
      <header className="flex items-center justify-between px-4 py-1 border-b border-panel-border text-xs text-panel-muted">
        <span>earth-</span>
        <span>{utc}</span>
      </header>
      <main className="flex-1 flex items-center justify-center text-panel-muted text-sm">
        [GRID — panels will render here]
      </main>
    </div>
  );
}

export default App;
