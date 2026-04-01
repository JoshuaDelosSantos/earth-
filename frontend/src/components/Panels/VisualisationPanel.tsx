/** VisualisationPanel — Leaflet map instance. The only panel that uses colour. */

import { MapContainer, TileLayer } from "react-leaflet";
import type { PanelProps } from "./PanelRegistry";

export default function VisualisationPanel(_props: PanelProps) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      maxZoom={18}
      zoomControl={true}
      attributionControl={true}
      className="h-full w-full"
      style={{ background: "#000000" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
    </MapContainer>
  );
}
