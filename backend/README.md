# Backend API

This folder contains the FastAPI + SQLAlchemy layer for the rice yield simulations.

## Setup

```bash
python backend/db/init_db.py
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload --port 8000
```

## Environment
- `DATABASE_URL` (optional): overrides the SQLite path.
- `CORS_ORIGINS` (optional): comma-separated origins allowed for the frontend. Defaults to `http://localhost:8080`.

## Python version note
Make sure you install deps and run `uvicorn` with the **same Python interpreter**.
If you use Python 3.13, run:

```bash
py -3.13 -m pip install -r backend/requirements.txt
py -3.13 -m uvicorn backend.app.main:app --reload --port 8000
```

## Endpoints
- `GET /api/health`
- `POST /api/simulations`
- `POST /api/simulations/run`
- `GET /api/simulations`
- `GET /api/simulations?limit=10&offset=0` returns `{ items, total, limit, offset }`
- `GET /api/simulations/{id}`
- `PATCH /api/simulations/{id}`
- `DELETE /api/simulations/{id}`
- `DELETE /api/simulations` (clear all)

## Examples
Request body example: `backend/examples/run_simulation.json`

## Tests
```bash
python -m pip install -r backend/requirements-dev.txt
pytest backend/tests
```
