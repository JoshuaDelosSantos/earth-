/** Layer style configuration — distinct colours/icons per OSINT source. */

import L from "leaflet";

export interface LayerStyle {
  color: string;
  fillColor: string;
  icon: string;  // emoji or symbol for markers
  radius: number;
}

const STYLES: Record<string, LayerStyle> = {
  "usgs-earthquake": {
    color: "#FF6B35",
    fillColor: "#FF6B35",
    icon: "⊙",
    radius: 6,
  },
  "nasa-eonet": {
    color: "#FF2D2D",
    fillColor: "#FF2D2D",
    icon: "△",
    radius: 5,
  },
  "gdelt-news": {
    color: "#4ECDC4",
    fillColor: "#4ECDC4",
    icon: "◆",
    radius: 4,
  },
  "opensky-aircraft": {
    color: "#45B7D1",
    fillColor: "#45B7D1",
    icon: "✈",
    radius: 2,
  },
};

const DEFAULT_STYLE: LayerStyle = {
  color: "#AAAAAA",
  fillColor: "#AAAAAA",
  icon: "●",
  radius: 4,
};

export function getLayerStyle(layerId: string): LayerStyle {
  return STYLES[layerId] ?? DEFAULT_STYLE;
}

/** Build a Leaflet CircleMarker style for a given layer. */
export function circleMarkerOptions(
  layerId: string,
  feature?: GeoJSON.Feature,
): L.CircleMarkerOptions {
  const s = getLayerStyle(layerId);
  let radius = s.radius;

  // Scale earthquake markers by magnitude
  if (layerId === "usgs-earthquake" && feature?.properties?.magnitude) {
    const mag = Math.max(feature.properties.magnitude, 0.5);
    radius = Math.max(3, mag * 3);
  }

  return {
    radius,
    color: s.color,
    fillColor: s.fillColor,
    fillOpacity: 0.7,
    weight: 1,
    opacity: 0.9,
  };
}

/** Build popup HTML for a data point. */
export function buildPopupContent(feature: GeoJSON.Feature): string {
  const p = feature.properties ?? {};
  const lines: string[] = [];

  if (p.title) lines.push(`<b>${escapeHtml(p.title)}</b>`);
  if (p.source) lines.push(`<span style="color:#aaa">Source:</span> ${escapeHtml(p.source)}`);
  if (p.magnitude != null) lines.push(`<span style="color:#aaa">Mag:</span> ${p.magnitude}`);
  if (p.event_time) lines.push(`<span style="color:#aaa">Time:</span> ${escapeHtml(p.event_time)}`);
  if (p.place) lines.push(`<span style="color:#aaa">Place:</span> ${escapeHtml(p.place)}`);
  if (p.origin_country) lines.push(`<span style="color:#aaa">Country:</span> ${escapeHtml(p.origin_country)}`);
  if (p.callsign) lines.push(`<span style="color:#aaa">Callsign:</span> ${escapeHtml(p.callsign)}`);
  if (p.altitude != null) lines.push(`<span style="color:#aaa">Alt:</span> ${Math.round(p.altitude)}m`);
  if (p.velocity != null) lines.push(`<span style="color:#aaa">Speed:</span> ${Math.round(p.velocity)}m/s`);
  if (p.categories?.length) lines.push(`<span style="color:#aaa">Type:</span> ${escapeHtml(p.categories.join(", "))}`);
  if (p.url) lines.push(`<a href="${escapeHtml(p.url)}" target="_blank" rel="noopener" style="color:#45B7D1">details →</a>`);

  return `<div style="font-family:monospace;font-size:11px;line-height:1.6;color:#fff;max-width:250px">${lines.join("<br>")}</div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
