from __future__ import annotations

import os

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import crud, schemas
from .db import Base, engine, get_db
from .simulation.engine import build_simulation_payload

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
def health() -> dict[str, str]:
    return {"status": "ok"}


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


@app.get("/api/simulations", response_model=schemas.SimulationListResponse)
def list_simulations(
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> schemas.SimulationListResponse:
    items = crud.get_simulations(db, limit=limit, offset=offset)
    total = crud.get_simulation_count(db)
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
