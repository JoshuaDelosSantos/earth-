# earth-

Containerised dashboard for OSINT visualisable earth data.

## What It Is

A 3x3 GRID dashboard with modular panel objects, UTC-first time handling, and real-time data and log streams.

## Initial Panel Objects

- Visualisation panel object (the only panel that uses colour)
- Data layers panel object
- Realtime log panel object
- System log panel object

## UI Direction

- Black-and-white, terminal-style interface
- Monospaced typography and sharp panel dividers
- No decorative effects (no gradients, shadows, or rounded corners)
- Colour reserved for the Visualisation panel object only

## Planned Stack

- React + TypeScript
- FastAPI (Python) + WebSockets
- PostgreSQL + PostGIS + pgvector
- Redis pub/sub
- Docker + Docker Compose

## Status

Planning is documented in [plan.md](plan.md). Implementation is in progress.
