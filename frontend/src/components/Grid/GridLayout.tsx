/** Grid container — uses react-grid-layout for a draggable/resizable 3×3 panel grid. */

import { Responsive, WidthProvider, type Layout } from "react-grid-layout";
import { useGridStore } from "../../stores/gridStore";
import PanelWrapper from "../Panels/PanelWrapper";

const ResponsiveGridLayout = WidthProvider(Responsive);

const COLS = 12;
const ROW_HEIGHT_RATIO = 3; // 3 logical rows

export default function GridLayout() {
  const panels = useGridStore((s) => s.panels);
  const updateLayout = useGridStore((s) => s.updateLayout);

  const layout: Layout[] = panels.map((p) => ({
    i: p.id,
    x: p.gridPosition.x,
    y: p.gridPosition.y,
    w: p.gridPosition.w,
    h: p.gridPosition.h,
    minW: 2,
    minH: 1,
  }));

  const handleLayoutChange = (newLayout: Layout[]) => {
    updateLayout(newLayout);
  };

  return (
    <ResponsiveGridLayout
      className="flex-1"
      layouts={{ lg: layout }}
      breakpoints={{ lg: 0 }}
      cols={{ lg: COLS }}
      rowHeight={Math.floor((window.innerHeight - 32) / ROW_HEIGHT_RATIO)}
      margin={[1, 1]}
      containerPadding={[0, 0]}
      isDraggable={true}
      isResizable={true}
      draggableHandle=".panel-drag-handle"
      onLayoutChange={handleLayoutChange}
      compactType="vertical"
    >
      {panels.map((panel) => (
        <div key={panel.id}>
          <PanelWrapper panel={panel} />
        </div>
      ))}
    </ResponsiveGridLayout>
  );
}
