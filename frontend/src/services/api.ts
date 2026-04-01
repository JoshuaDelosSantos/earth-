/** API client for REST endpoints. */

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function fetchHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_URL}/api/health`);
  return res.json();
}

export async function fetchLayerData(
  layerId: string,
): Promise<GeoJSON.FeatureCollection> {
  const res = await fetch(
    `${API_URL}/api/layers/${encodeURIComponent(layerId)}/data`,
  );
  return res.json();
}

export async function fetchLayers(): Promise<
  Array<{
    id: string;
    name: string;
    source: string;
    status: string;
    last_update: string | null;
    record_count: number;
    fetch_interval: number;
  }>
> {
  const res = await fetch(`${API_URL}/api/layers`);
  return res.json();
}
