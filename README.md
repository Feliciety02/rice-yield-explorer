# Rice Yield Explorer

An interactive Rice Yield Simulator exploring how rainfall variability affects yields across seasons.

## Stack
- Frontend: Vite + React + TypeScript + Tailwind + shadcn-ui
- Backend: FastAPI + SQLAlchemy (SQLite)

## Quick Start

### 1) Frontend
```bash
npm install
npm run dev
```
Frontend runs on `http://localhost:8080`.

### 2) Backend
```bash
python backend/db/init_db.py
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload --port 8000
```
Backend runs on `http://localhost:8000`.

## Environment

### Frontend
- `VITE_API_BASE_URL` (optional):
  - Leave empty to use the Vite dev proxy (`/api` ? `http://localhost:8000`).
  - Set to `http://localhost:8000` if you want direct calls (requires CORS).

### Backend
- `DATABASE_URL` (optional): overrides the SQLite path.
- `CORS_ORIGINS` (optional): comma-separated origins allowed for the frontend. Defaults to `http://localhost:8080`.

## Model Assumptions (Short)
- Rainfall per season is sampled from a categorical distribution defined by the low/normal/high probabilities.
- Seasonal yield is derived from a fixed rainfall→yield mapping per scenario; other factors are held constant.
- Results are meant for comparative insight, not precise field forecasts.

## Tests

### Backend
```bash
python -m pip install -r backend/requirements-dev.txt
pytest backend/tests
```

### Frontend
```bash
npm run test
```
