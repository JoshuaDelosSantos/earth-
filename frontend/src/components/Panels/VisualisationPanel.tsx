/** VisualisationPanel — Leaflet map with live OSINT data layers. The only panel that uses colour. */

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import { useDataStore } from "../../stores/dataStore";
import {
  circleMarkerOptions,
  buildPopupContent,
  getLayerStyle,
} from "./layerStyles";
import { fetchLayerData } from "../../services/api";
import type { PanelProps } from "./PanelRegistry";

/* ── NASA GIBS satellite tile overlay ─────────────────────────── */

const gibsDate = (() => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
})();

const GIBS_URL =
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/` +
  `VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${gibsDate}/` +
  `GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`;

/* ── Single GeoJSON data layer ────────────────────────────────── */

function DataOverlay({
  layerId,
  data,
  lastUpdate,
}: {
  layerId: string;
  data: GeoJSON.FeatureCollection;
  lastUpdate: string | null;
}) {
  const style = getLayerStyle(layerId);

  return (
    <GeoJSON
      key={`${layerId}-${lastUpdate ?? "init"}`}
      data={data}
      pointToLayer={(feature, latlng) =>
        L.circleMarker(latlng, circleMarkerOptions(layerId, feature))
      }
      style={() => ({
        color: style.color,
        fillColor: style.fillColor,
        fillOpacity: 0.4,
        weight: 2,
        opacity: 0.8,
      })}
      onEachFeature={(feature, featureLayer) => {
        featureLayer.bindPopup(buildPopupContent(feature));
      }}
    />
  );
}

/* ── Main panel ───────────────────────────────────────────────── */

export default function VisualisationPanel(_props: PanelProps) {
  const layers = useDataStore((s) => s.layers);
  const layerData = useDataStore((s) => s.layerData);
  const setLayerData = useDataStore((s) => s.setLayerData);
  const updateLayerStatus = useDataStore((s) => s.updateLayerStatus);

  // Track which layers we've already attempted an initial REST fetch for
  const fetchedRef = useRef<Set<string>>(new Set());

  const activeLayers = layers.filter(
    (l) => l.active && l.id !== "nasa-gibs",
  );
  const gibsActive =
    layers.find((l) => l.id === "nasa-gibs")?.active ?? false;

  // Fetch cached data from REST for newly-activated layers without WS data yet
  useEffect(() => {
    for (const layer of activeLayers) {
      if (!layerData[layer.id] && !fetchedRef.current.has(layer.id)) {
        fetchedRef.current.add(layer.id);
        fetchLayerData(layer.id)
          .then((data) => {
            if (data?.features?.length > 0) {
              setLayerData(layer.id, data);
              updateLayerStatus(layer.id, {
                status: "ok",
                recordCount: data.features.length,
                lastUpdate: new Date()
                  .toISOString()
                  .replace("T", " ")
                  .slice(0, 19),
              });
            }
          })
          .catch(() => {
            /* data will arrive via WebSocket instead */
          });
      }
    }
  }); // eslint-disable-line react-hooks/exhaustive-deps

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

      {gibsActive && (
        <TileLayer
          url={GIBS_URL}
          attribution="&copy; NASA GIBS"
          opacity={0.6}
          maxZoom={9}
        />
      )}

      {activeLayers.map((layer) => {
        const data = layerData[layer.id];
        if (!data || data.features.length === 0) return null;
        return (
          <DataOverlay
            key={layer.id}
            layerId={layer.id}
            data={data}
            lastUpdate={layer.lastUpdate}
          />
        );
      })}
    </MapContainer>
  );
}
