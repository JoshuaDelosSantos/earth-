/** Placeholder Grid container — will use react-grid-layout in Phase 2. */

export default function GridLayout() {
  return (
    <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-px bg-panel-border">
      <div className="bg-panel-bg p-2 text-panel-muted text-xs">[Visualisation]</div>
      <div className="bg-panel-bg p-2 text-panel-muted text-xs">[Data Layers]</div>
      <div className="bg-panel-bg p-2 text-panel-muted text-xs">[Realtime Log]</div>
      <div className="bg-panel-bg p-2 text-panel-muted text-xs">[System Log]</div>
    </div>
  );
}
