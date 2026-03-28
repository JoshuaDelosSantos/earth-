# Plan: Earth OSINT Dashboard (earth-)

## TL;DR

Build a containerised web dashboard for OSINT earth data visualisation. React + TypeScript frontend with a draggable 3x3 grid of panel objects. Python FastAPI backend serves data via WebSockets. PostgreSQL (PostGIS + pgvector) for geospatial caching and future LLM/RAG integration. Docker Compose orchestrates all services locally.

---

## Architecture Overview

```
Browser (React + TS)
  └─ WebSocket + REST ──▶ FastAPI backend
                              ├─ OSINT data fetchers (OpenWeatherMap, Sentinel Hub, AIS, GDELT)
                              ├─ WebSocket manager (push updates to panels)
                              └─ PostgreSQL (PostGIS + pgvector)
```

**Services (Docker Compose)**:
1. `frontend` — React dev server (Vite), port 5173
2. `backend` — FastAPI (uvicorn), port 8000
3. `db` — PostgreSQL 16 with PostGIS + pgvector extensions
4. `redis` — Redis for pub/sub message broker (WebSocket fan-out + task queue)

---

## UI Vision

**Black and white. Terminal-native. Hacker aesthetic.**

The dashboard should feel like a collection of command-line interfaces tiled across a single screen — minimal, monochrome, and information-dense. Think CRT monitors in a signals room.

### Design Principles
- **Monochrome palette**: Pure black backgrounds (`#000000`) with white/light-grey text (`#FFFFFF`, `#AAAAAA`). No decorative colour anywhere outside the Visualisation panel.
- **Terminal typography**: Monospaced font throughout (e.g., `JetBrains Mono`, `Fira Code`, or `IBM Plex Mono`). All text left-aligned, no centred headings.
- **Panel borders**: Thin 1px solid lines (`#333333`) separating panels — like tmux/tiling window manager panes.
- **No ornamentation**: No gradients, shadows, rounded corners, or hover glow effects. Flat, sharp, utilitarian.
- **Scrolling logs**: RealtimeLogPanel and SystemLogPanel should look and feel like live terminal output — newest entries at the bottom, auto-scroll, severity indicated by text prefixes (`[INFO]`, `[WARN]`, `[ERR]`) with subtle colour coding only for severity (e.g., red for errors, amber for warnings — kept minimal).
- **Data Layers panel**: Simple toggle list with monospaced labels, ASCII-style checkboxes or minimal switch indicators.
- **UTC clock**: A persistent UTC timestamp display (top bar or corner) in monospaced font — always visible.

### The Exception: Visualisation Panel
The **Visualisation panel object is the only panel that uses colour**. Map tiles, data layer markers, heatmaps, and overlays render in full colour to maximise data legibility. This creates a deliberate visual contrast — the colourful map stands out against the monochrome CLI surrounding it, drawing the eye to the data.

### Colour Budget
| Element | Colour | Usage |
|---|---|---|
| Background (all panels) | `#000000` | Universal |
| Primary text | `#FFFFFF` | Labels, log entries, headings |
| Secondary text | `#AAAAAA` | Timestamps, metadata, muted info |
| Panel borders | `#333333` | Grid dividers |
| Error text | `#FF4444` | `[ERR]` log entries only |
| Warning text | `#FFAA00` | `[WARN]` log entries only |
| Success/active indicator | `#00FF00` | Active toggle, connected status |
| Visualisation panel | Full colour | Map tiles, markers, overlays, heatmaps |

---

## Phase 1: Project Scaffolding & Docker Setup

### Step 1.1 — Repository structure
Create the monorepo layout:
```
earth-/
├── docker-compose.yml
├── .env.example            # API keys, DB creds (gitignored .env)
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── types/           # Shared TS types (Panel, GridLayout, DataLayer, etc.)
│       ├── components/
│       │   ├── Grid/        # Grid container + layout engine
│       │   └── Panels/      # Panel object components
│       ├── hooks/           # Custom hooks (useWebSocket, useGrid, etc.)
│       ├── services/        # API client, WebSocket client
│       └── stores/          # State management (Zustand)
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml       # Dependencies (fastapi, uvicorn, sqlalchemy, etc.)
│   ├── alembic/             # DB migrations
│   └── app/
│       ├── main.py          # FastAPI app entry
│       ├── config.py        # Settings (pydantic-settings)
│       ├── models/          # SQLAlchemy models
│       ├── schemas/         # Pydantic schemas
│       ├── api/
│       │   ├── routes/      # REST endpoints
│       │   └── ws/          # WebSocket endpoints
│       ├── services/        # Business logic
│       ├── fetchers/        # OSINT data source adapters
│       └── core/
│           ├── db.py        # DB session management
│           └── events.py    # App lifecycle (startup/shutdown)
└── db/
    └── init.sql             # Enable PostGIS + pgvector extensions
```

### Step 1.2 — Docker Compose configuration
- `frontend`: Node 20 image, mount `./frontend` as volume, hot-reload via Vite
- `backend`: Python 3.12 image, mount `./backend` as volume, uvicorn with `--reload`
- `db`: `postgis/postgis:16-3.4` image, persistent volume for data, init script enables `pgvector`
- `redis`: `redis:7-alpine`, used as WebSocket pub/sub broker
- Internal Docker network for service-to-service communication
- `.env` file for all secrets/config (API keys, DB URL, etc.)

### Step 1.3 — Basic frontend bootstrap
- Vite + React 18 + TypeScript (strict mode)
- Install core dependencies: `react-grid-layout`, `zustand`, `leaflet`/`react-leaflet` or `maplibre-gl`/`react-map-gl`, socket.io-client (or native WebSocket wrapper)
- Tailwind CSS for styling
- Verify hot-reload works inside Docker

### Step 1.4 — Basic backend bootstrap
- FastAPI app with health check endpoint (`GET /api/health`)
- Pydantic Settings for config (reads from env vars)
- SQLAlchemy 2.0 async engine + Alembic migrations scaffold
- WebSocket endpoint stub (`/ws`)
- Verify backend starts and connects to DB inside Docker

**Verification (Phase 1)**:
- `docker compose up` starts all 4 services without errors
- `http://localhost:5173` shows React app
- `http://localhost:8000/api/health` returns `{"status": "ok"}`
- `http://localhost:8000/docs` shows FastAPI Swagger UI
- DB accepts connections with PostGIS and pgvector enabled

---

## Phase 2: Grid System & Panel Framework

### Step 2.1 — Grid container component
- Use `react-grid-layout` (RGL) library for the GRID
- Define a `GridLayout` component that renders a 3×3 responsive grid (12-column layout, 3 rows)
- Each cell = 4 columns wide, 1 row tall by default
- Enable dragging and resizing via RGL props
- Store layout state in Zustand store (persist to localStorage for now)
- All times displayed in UTC (use `date-fns` or `dayjs` with UTC plugin)

### Step 2.2 — Panel object abstraction
- Create a `PanelObject` TypeScript interface:
  ```ts
  interface PanelObject {
    id: string;
    type: PanelType;           // 'visualisation' | 'data-layers' | 'realtime-log' | 'system-log'
    title: string;
    gridPosition: GridPosition; // { x, y, w, h }
    config: Record<string, unknown>; // panel-specific config
  }
  ```
- Create a `PanelWrapper` component: renders header (title, drag handle, minimise/maximise) + delegates to the correct panel body component via a **panel registry pattern**
- **Panel Registry**: a `Map<PanelType, React.ComponentType<PanelProps>>` so adding new panel types requires only:
  1. Create the component
  2. Register it in the registry
  This ensures easy extensibility for future panel objects.

### Step 2.3 — Implement the 4 initial panel types (shells)
- **VisualisationPanel**: Renders a Leaflet/MapLibre map instance. Accepts data layers as props.
- **DataLayersPanel**: Lists available OSINT data layers with toggle switches. Controls which layers are active on the visualisation panel.
- **RealtimeLogPanel**: Scrolling log viewer showing metadata from OSINT data fetches (timestamps, source, status, record count). Auto-scrolls, max buffer of N entries.
- **SystemLogPanel**: Scrolling log viewer showing system-level logs (WebSocket connection status, errors, backend health). Different severity colours.

### Step 2.4 — Inter-panel communication
- Use Zustand store as the shared state bus:
  - `activeDataLayers`: which layers are toggled on → consumed by VisualisationPanel
  - `realtimeLogs`: array of fetch log entries → consumed by RealtimeLogPanel
  - `systemLogs`: array of system log entries → consumed by SystemLogPanel
- DataLayersPanel dispatches toggle actions → VisualisationPanel reacts to state changes

**Verification (Phase 2)**:
- Grid renders 4 panels in a 3×3 layout
- Panels can be dragged and resized; layout persists on refresh
- Toggling a data layer in DataLayersPanel updates VisualisationPanel (even with mock data)
- Log panels display mock log entries with UTC timestamps

---

## Phase 3: Backend Data Pipeline & WebSockets

### Step 3.1 — OSINT data fetcher abstraction
- Create a base `DataFetcher` abstract class in `backend/app/fetchers/base.py`:
  ```python
  class DataFetcher(ABC):
      source_name: str
      fetch_interval: int  # seconds
      async def fetch(self) -> FetchResult
      async def transform(self, raw_data) -> list[GeoDataPoint]
  ```
- Each OSINT source gets its own fetcher subclass. Adding a new source = create a new fetcher class + register it.

### Step 3.2 — Implement initial fetchers (stubs → real)
- **OpenWeatherMapFetcher**: Current weather + alerts overlay data
- **SentinelHubFetcher**: Satellite imagery tiles (Copernicus Open Access Hub)
- **AISFetcher**: Ship position data (e.g., AISHub or MarineTraffic API)
- **GDELTFetcher**: Geolocated news events from GDELT API
- Each fetcher: validate API key on startup, handle rate limits, emit structured `FetchResult` with metadata (timestamp, record count, latency, errors)

### Step 3.3 — Background task scheduler
- Use `asyncio` tasks (or APScheduler) to run fetchers on their configured intervals
- On each fetch cycle:
  1. Fetch data from source
  2. Transform to normalised `GeoDataPoint` format
  3. Store in PostgreSQL (PostGIS geometry column)
  4. Publish update event to Redis pub/sub channel
  5. Emit metadata log entry (for RealtimeLogPanel)

### Step 3.4 — WebSocket manager
- FastAPI WebSocket endpoint at `/ws`
- On connection: subscribe to Redis pub/sub channels
- Message types:
  - `data_update` — new data available for a layer (includes layer ID + GeoJSON payload or diff)
  - `fetch_log` — metadata about a fetch operation (for RealtimeLogPanel)
  - `system_log` — system events (connection status, errors, health)
- Frontend WebSocket client (custom hook `useWebSocket`) handles reconnection, message routing to Zustand store

### Step 3.5 — REST API endpoints
- `GET /api/layers` — list available data layers and their status
- `GET /api/layers/{layer_id}/data` — get current cached data for a layer (GeoJSON)
- `GET /api/layers/{layer_id}/history` — historical data query (time range)
- `GET /api/logs/fetch` — paginated fetch logs
- `GET /api/logs/system` — paginated system logs

**Verification (Phase 3)**:
- Backend fetches data from at least one real OSINT source on schedule
- WebSocket pushes `data_update` messages to connected frontend
- RealtimeLogPanel shows real fetch metadata (source, timestamp, record count, latency)
- REST endpoints return valid GeoJSON for cached layer data
- Data persists in PostgreSQL with PostGIS geometry

---

## Phase 4: Visualisation & Data Layer Integration

### Step 4.1 — Map data layer rendering
- VisualisationPanel consumes `activeDataLayers` from Zustand
- For each active layer, add the appropriate Leaflet/MapLibre layer:
  - Markers/clusters for point data (earthquakes, ships, news events)
  - Tile overlay for raster data (weather, satellite imagery)
  - GeoJSON polygons for area data
- Layer styling: distinct colours/icons per OSINT source
- Popup on click: show data point details

### Step 4.2 — DataLayersPanel enrichment
- Show each layer's last update time (UTC), record count, fetch status (ok/error/loading)
- Toggle switch enables/disables layer on the map
- Colour indicator matches the layer's map styling

### Step 4.3 — Real-time updates on the map
- When WebSocket delivers `data_update`, update the corresponding layer's data in Zustand
- Map reactively re-renders affected layers without full refresh
- Smooth transitions for moving objects (e.g., ships)

**Verification (Phase 4)**:
- Toggle a data layer on → see data appear on the map
- Toggle off → data disappears
- New WebSocket data updates map markers/tiles in real time
- Layer panel shows live status per source

---

## Phase 5: Future-Proofing & LLM Preparation

### Step 5.1 — pgvector setup for embeddings
- Enable `pgvector` extension in PostgreSQL
- Create an `embeddings` table: `(id, source, content_text, embedding vector(1536), metadata jsonb, created_at)`
- Index with IVFFlat or HNSW for similarity search

### Step 5.2 — LLM integration abstraction
- Create `backend/app/services/llm/base.py` with `LLMProvider` ABC:
  - `async def generate(prompt, context) -> str`
  - `async def embed(text) -> list[float]`
- Concrete implementations: `OpenAIProvider`, `OllamaProvider` (selectable via config)
- This keeps LLM provider flexible/swappable

### Step 5.3 — Data ingestion pipeline for RAG
- On each data fetch, optionally generate text summary + embedding
- Store in `embeddings` table for later semantic search
- Endpoint: `POST /api/query` — accepts natural language, runs similarity search, feeds context to LLM, returns answer

**Verification (Phase 5)**:
- Embeddings table populated with vector data
- Similarity search returns relevant results
- `/api/query` endpoint answers natural language questions about fetched data

---

## Files to Create

| File | Purpose |
|---|---|
| `docker-compose.yml` | Orchestrates all 4 services (frontend, backend, db, redis) |
| `frontend/Dockerfile` | Node 20 + Vite dev server |
| `frontend/src/components/Grid/GridLayout.tsx` | Main grid container using react-grid-layout |
| `frontend/src/components/Panels/PanelWrapper.tsx` | Panel shell (header, drag handle, body delegation) |
| `frontend/src/components/Panels/PanelRegistry.ts` | Map of panel type → component (extensibility point) |
| `frontend/src/components/Panels/VisualisationPanel.tsx` | Leaflet/MapLibre map |
| `frontend/src/components/Panels/DataLayersPanel.tsx` | Layer toggles |
| `frontend/src/components/Panels/RealtimeLogPanel.tsx` | Fetch metadata log viewer |
| `frontend/src/components/Panels/SystemLogPanel.tsx` | System log viewer |
| `frontend/src/stores/gridStore.ts` | Zustand store for grid layout + panel state |
| `frontend/src/stores/dataStore.ts` | Zustand store for layer data + logs |
| `frontend/src/hooks/useWebSocket.ts` | WebSocket connection + message routing |
| `frontend/src/types/panels.ts` | PanelObject, PanelType, GridPosition interfaces |
| `backend/Dockerfile` | Python 3.12 + uvicorn |
| `backend/app/main.py` | FastAPI app with lifespan events |
| `backend/app/config.py` | Pydantic Settings |
| `backend/app/api/ws/manager.py` | WebSocket connection manager |
| `backend/app/fetchers/base.py` | Abstract DataFetcher |
| `backend/app/fetchers/openweathermap.py` | OpenWeatherMap fetcher |
| `backend/app/fetchers/sentinel.py` | Sentinel Hub fetcher |
| `backend/app/fetchers/ais.py` | AIS ship tracking fetcher |
| `backend/app/fetchers/gdelt.py` | GDELT fetcher |
| `backend/app/services/llm/base.py` | LLM provider abstraction |
| `backend/app/models/geo_data.py` | SQLAlchemy model with PostGIS geometry |
| `backend/app/models/embeddings.py` | pgvector embeddings model |
| `db/init.sql` | Enable PostGIS + pgvector extensions |

---

## Key Decisions

| Decision | Rationale |
|---|---|
| **PostgreSQL 16 + PostGIS + pgvector** | Most robust — native geospatial queries AND vector embeddings for LLM/RAG pipeline |
| **Redis** | Pub/sub broker for WebSocket fan-out; doubles as task queue backend later (Celery/ARQ) |
| **Panel Registry pattern** | New panel types = create component + register in map. Zero grid/framework code changes |
| **DataFetcher ABC** | New OSINT sources = subclass + register. Zero pipeline code changes |
| **LLM provider abstraction** | Swap OpenAI ↔ Ollama ↔ any provider via config |
| **No auth** | Single-user local deployment for now |
| **UTC everywhere** | All timestamps stored and displayed in UTC |
| **1 cell per panel initially** | `react-grid-layout` inherently supports drag/resize for future multi-cell panels |

---

## Excluded from Scope (for now)
- User authentication / multi-user
- Cloud deployment
- Actual LLM integration (Phase 5 is prep/abstraction only for MVP)
- Panel configuration persistence to DB (localStorage for now)
- Mobile responsive layout
