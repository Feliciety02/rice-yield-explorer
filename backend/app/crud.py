from __future__ import annotations

import uuid

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session, selectinload

from . import models, schemas


def create_simulation(db: Session, payload: schemas.SimulationCreate) -> models.Simulation:
    simulation_id = payload.id or str(uuid.uuid4())

    existing = db.get(models.Simulation, simulation_id)
    if existing:
        raise ValueError(f"simulation {simulation_id} already exists")

    simulation = models.Simulation(
        id=simulation_id,
        name=payload.name,
        run_mode=payload.run_mode,
        num_seasons=payload.num_seasons,
        num_replications=payload.num_replications,
        seed=payload.seed,
        average_yield=payload.average_yield,
        min_yield=payload.min_yield,
        max_yield=payload.max_yield,
        yield_variability=payload.yield_variability,
        low_yield_percent=payload.low_yield_percent,
    )
    db.add(simulation)
    db.flush()

    for run in payload.runs:
        db_run = models.SimulationRun(
            simulation_id=simulation.id,
            run_index=run.run_index,
            scenario_id=run.scenario_id,
            prob_low=run.prob_low,
            prob_normal=run.prob_normal,
            prob_high=run.prob_high,
            average_yield=run.average_yield,
            min_yield=run.min_yield,
            max_yield=run.max_yield,
            yield_variability=run.yield_variability,
            low_yield_percent=run.low_yield_percent,
        )
        db.add(db_run)
        db.flush()

        for season in run.seasons:
            db_season = models.SeasonResult(
                simulation_run_id=db_run.id,
                season_index=season.season_index,
                rainfall=season.rainfall,
                yield_amount=season.yield_amount,
            )
            db.add(db_season)

    db.commit()
    db.refresh(simulation)
    return simulation


def get_simulation(db: Session, simulation_id: str) -> models.Simulation | None:
    stmt = (
        select(models.Simulation)
        .where(models.Simulation.id == simulation_id)
        .options(
            selectinload(models.Simulation.runs).selectinload(
                models.SimulationRun.seasons
            )
        )
    )
    return db.scalars(stmt).first()


def get_simulations(db: Session, limit: int = 20, offset: int = 0) -> list[models.Simulation]:
    stmt = (
        select(models.Simulation)
        .order_by(models.Simulation.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(db.scalars(stmt).all())


def get_simulation_count(db: Session) -> int:
    count = db.scalar(select(func.count()).select_from(models.Simulation))
    return int(count or 0)


def delete_simulation(db: Session, simulation_id: str) -> bool:
    simulation = db.get(models.Simulation, simulation_id)
    if not simulation:
        return False
    db.delete(simulation)
    db.commit()
    return True


def delete_all_simulations(db: Session) -> int:
    result = db.execute(delete(models.Simulation))
    db.commit()
    return int(result.rowcount or 0)


def update_simulation(
    db: Session, simulation_id: str, payload: schemas.SimulationUpdate
) -> models.Simulation | None:
    simulation = db.get(models.Simulation, simulation_id)
    if not simulation:
        return None
    if payload.name is not None:
        simulation.name = payload.name
    db.commit()
    db.refresh(simulation)
    return simulation
