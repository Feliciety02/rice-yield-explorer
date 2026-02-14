from __future__ import annotations

import os
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from . import crud, schemas
from .db import Base, engine, get_db
from .simulation.engine import SCENARIOS, YIELD_BY_RAINFALL, build_simulation_payload

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Rice Yield Explorer API")

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:8080")
allowed_origins = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]
if allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/")
def root() -> dict[str, str]:
    return {
        "status": "ok",
        "message": "Rice Yield Explorer API",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/api/health")
def health(db: Session = Depends(get_db)) -> dict[str, str]:
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "ok"}
    except Exception:
        return {"status": "degraded", "database": "error"}


@app.get("/api/scenarios", response_model=list[schemas.Scenario])
def list_scenarios() -> list[schemas.Scenario]:
    return [schemas.Scenario.model_validate(scenario) for scenario in SCENARIOS]


@app.get("/api/yield-by-rainfall", response_model=schemas.YieldByRainfall)
def get_yield_by_rainfall() -> schemas.YieldByRainfall:
    return schemas.YieldByRainfall.model_validate(YIELD_BY_RAINFALL)


@app.post(
    "/api/simulations",
    response_model=schemas.SimulationRead,
    status_code=status.HTTP_201_CREATED,
)
def create_simulation(
    payload: schemas.SimulationCreate, db: Session = Depends(get_db)
) -> schemas.SimulationRead:
    try:
        simulation = crud.create_simulation(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return simulation


@app.post(
    "/api/simulations/run",
    response_model=schemas.SimulationRead,
    status_code=status.HTTP_201_CREATED,
)
def run_simulation(
    payload: schemas.SimulationExecuteRequest, db: Session = Depends(get_db)
) -> schemas.SimulationRead:
    simulation_payload = build_simulation_payload(payload)
    try:
        simulation = crud.create_simulation(db, simulation_payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return simulation


def _normalize_date_filter(value: str, is_end: bool) -> str:
    if len(value) == 10:
        return f"{value}T23:59:59.999Z" if is_end else f"{value}T00:00:00.000Z"
    return value


@app.get("/api/simulations", response_model=schemas.SimulationListResponse)
def list_simulations(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sort_by: Literal["created_at", "average_yield"] = Query("created_at"),
    sort_order: Literal["asc", "desc"] = Query("desc"),
    scenario_id: int | None = Query(None, ge=1, le=5),
    min_avg_yield: float | None = Query(None, ge=0),
    max_avg_yield: float | None = Query(None, ge=0),
    created_after: str | None = Query(None),
    created_before: str | None = Query(None),
    db: Session = Depends(get_db),
) -> schemas.SimulationListResponse:
    normalized_after = (
        _normalize_date_filter(created_after, is_end=False)
        if created_after
        else None
    )
    normalized_before = (
        _normalize_date_filter(created_before, is_end=True)
        if created_before
        else None
    )

    items = crud.get_simulations(
        db,
        limit=limit,
        offset=offset,
        sort_by=sort_by,
        sort_order=sort_order,
        scenario_id=scenario_id,
        min_avg_yield=min_avg_yield,
        max_avg_yield=max_avg_yield,
        created_after=normalized_after,
        created_before=normalized_before,
    )
    total = crud.get_simulation_count(
        db,
        scenario_id=scenario_id,
        min_avg_yield=min_avg_yield,
        max_avg_yield=max_avg_yield,
        created_after=normalized_after,
        created_before=normalized_before,
    )
    return schemas.SimulationListResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@app.get("/api/simulations/{simulation_id}", response_model=schemas.SimulationRead)
def get_simulation(
    simulation_id: str, db: Session = Depends(get_db)
) -> schemas.SimulationRead:
    simulation = crud.get_simulation(db, simulation_id)
    if not simulation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return simulation


@app.patch("/api/simulations/{simulation_id}", response_model=schemas.SimulationSummary)
def update_simulation(
    simulation_id: str,
    payload: schemas.SimulationUpdate,
    db: Session = Depends(get_db),
) -> schemas.SimulationSummary:
    simulation = crud.update_simulation(db, simulation_id, payload)
    if not simulation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return simulation


@app.delete("/api/simulations/{simulation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_simulation(simulation_id: str, db: Session = Depends(get_db)) -> None:
    deleted = crud.delete_simulation(db, simulation_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return None


@app.delete("/api/simulations", status_code=status.HTTP_204_NO_CONTENT)
def delete_all_simulations(db: Session = Depends(get_db)) -> None:
    crud.delete_all_simulations(db)
    return None
