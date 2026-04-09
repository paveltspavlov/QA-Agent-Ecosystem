# QA Agent Ecosystem — Local Web UI

A web-based control panel for running QA agents and workflows, and reviewing generated reports.

## Features

- **Dashboard** — Live stats: runs, agents, workflows, reports
- **Agents** — 29 agents in a searchable grid; click to run any agent
- **Workflows** — 16 multi-agent pipelines with step visualizer
- **Run Page** — Live terminal output via SSE streaming; stop mid-run; download output
- **Reports** — File browser for all generated outputs; in-app markdown/HTML preview; one-click download
- **Settings** — Configure ecosystem path and Python command

## Prerequisites

- Node.js 18+ (for the UI server)
- Python environment with `qa_ecosystem` installed (`pip install -e .` from the repo root)
- API keys configured in `.env` (copy from `.env.example`)

## Setup

```bash
# 1. Install UI dependencies
npm install

# 2. Build the UI
npm run build

# 3. Start the UI server
npm start
```

Then open **http://localhost:5000** in your browser.

### Development mode (auto-reload)

```bash
npm run dev
```

## Configuration

On first start, go to **Settings** and set:

| Setting | Description |
|---|---|
| Ecosystem Path | Absolute path to your `QA-Agent-Ecosystem` repo root |
| Python Command | `python`, `python3`, or full path (e.g. `/usr/bin/python3`) |

The UI auto-detects the path if it's in `../QA-Agent-Ecosystem` relative to this directory.

## Environment Variables

You can also configure via environment variables instead of the Settings page:

```bash
ECOSYSTEM_PATH=/path/to/QA-Agent-Ecosystem
PORT=5000   # optional, default 5000
```

## How It Works

- The **Express backend** reads `workflows.yaml` and template YAMLs from your ecosystem to populate the agent/workflow lists
- When you click **Run**, the backend spawns `python -m qa_ecosystem run --agent <name> --input <file>` (or `workflow <name>`) as a subprocess
- **Live output** is streamed to the browser via Server-Sent Events (SSE)
- Completed runs are saved to a local SQLite DB (`data/qa-ui.db`)
- **Reports** are read directly from the `outputs/` directory in your ecosystem

## Project Structure

```
├── client/src/
│   ├── pages/
│   │   ├── Dashboard.tsx    — overview + recent runs
│   │   ├── Agents.tsx       — agent grid with category filter
│   │   ├── Workflows.tsx    — workflow cards with step visualizer
│   │   ├── RunPage.tsx      — config form + terminal output
│   │   ├── Reports.tsx      — file browser + preview
│   │   └── Settings.tsx     — ecosystem path + Python command
│   └── components/
│       ├── AppSidebar.tsx   — nav sidebar
│       └── StatusBadge.tsx  — status/category badges
├── server/
│   ├── routes.ts            — API routes + subprocess management + SSE
│   ├── storage.ts           — SQLite CRUD (runs, settings)
│   └── db.ts                — Drizzle + better-sqlite3
└── shared/schema.ts         — DB schema (runs, settings)
```
