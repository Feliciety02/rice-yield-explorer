from __future__ import annotations

from sqlalchemy import (
    CheckConstraint,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class Simulation(Base):
    __tablename__ = "simulations"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[str] = mapped_column(
        String,
        nullable=False,
        server_default=text("strftime('%Y-%m-%dT%H:%M:%fZ','now')"),
    )
    run_mode: Mapped[str] = mapped_column(String, nullable=False, server_default="single")
    num_seasons: Mapped[int] = mapped_column(Integer, nullable=False)
    num_replications: Mapped[int] = mapped_column(Integer, nullable=False)
    seed: Mapped[int | None] = mapped_column(Integer)
    average_yield: Mapped[float] = mapped_column(Float, nullable=False)
    min_yield: Mapped[float] = mapped_column(Float, nullable=False)
    max_yield: Mapped[float] = mapped_column(Float, nullable=False)
    yield_variability: Mapped[str] = mapped_column(String, nullable=False)
    low_yield_percent: Mapped[float] = mapped_column(Float, nullable=False)

    runs: Mapped[list["SimulationRun"]] = relationship(
        back_populates="simulation", cascade="all, delete-orphan", passive_deletes=True
    )

    __table_args__ = (
        CheckConstraint("run_mode IN ('single','all_scenarios')", name="ck_simulations_run_mode"),
        CheckConstraint("num_seasons > 0", name="ck_simulations_num_seasons"),
        CheckConstraint("num_replications > 0", name="ck_simulations_num_replications"),
        CheckConstraint("average_yield >= 0", name="ck_simulations_avg_yield"),
        CheckConstraint("min_yield >= 0", name="ck_simulations_min_yield"),
        CheckConstraint("max_yield >= 0", name="ck_simulations_max_yield"),
        CheckConstraint("yield_variability IN ('low','medium','high')", name="ck_simulations_variability"),
        CheckConstraint(
            "low_yield_percent >= 0 AND low_yield_percent <= 100",
            name="ck_simulations_low_yield_pct",
        ),
    )


class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    simulation_id: Mapped[str] = mapped_column(
        ForeignKey("simulations.id", ondelete="CASCADE"), nullable=False
    )
    run_index: Mapped[int] = mapped_column(Integer, nullable=False)
    scenario_id: Mapped[int] = mapped_column(Integer, nullable=False)
    prob_low: Mapped[int] = mapped_column(Integer, nullable=False)
    prob_normal: Mapped[int] = mapped_column(Integer, nullable=False)
    prob_high: Mapped[int] = mapped_column(Integer, nullable=False)
    average_yield: Mapped[float] = mapped_column(Float, nullable=False)
    min_yield: Mapped[float] = mapped_column(Float, nullable=False)
    max_yield: Mapped[float] = mapped_column(Float, nullable=False)
    yield_variability: Mapped[str] = mapped_column(String, nullable=False)
    low_yield_percent: Mapped[float] = mapped_column(Float, nullable=False)

    simulation: Mapped["Simulation"] = relationship(back_populates="runs")
    seasons: Mapped[list["SeasonResult"]] = relationship(
        back_populates="run", cascade="all, delete-orphan", passive_deletes=True
    )

    __table_args__ = (
        CheckConstraint("scenario_id BETWEEN 1 AND 5", name="ck_runs_scenario_id"),
        CheckConstraint("prob_low >= 0 AND prob_low <= 100", name="ck_runs_prob_low"),
        CheckConstraint(
            "prob_normal >= 0 AND prob_normal <= 100",
            name="ck_runs_prob_normal",
        ),
        CheckConstraint("prob_high >= 0 AND prob_high <= 100", name="ck_runs_prob_high"),
        CheckConstraint(
            "prob_low + prob_normal + prob_high = 100",
            name="ck_runs_prob_sum",
        ),
        CheckConstraint("average_yield >= 0", name="ck_runs_avg_yield"),
        CheckConstraint("min_yield >= 0", name="ck_runs_min_yield"),
        CheckConstraint("max_yield >= 0", name="ck_runs_max_yield"),
        CheckConstraint("yield_variability IN ('low','medium','high')", name="ck_runs_variability"),
        CheckConstraint(
            "low_yield_percent >= 0 AND low_yield_percent <= 100",
            name="ck_runs_low_yield_pct",
        ),
        UniqueConstraint("simulation_id", "run_index", name="uq_runs_simulation_run_index"),
        Index("idx_simulation_runs_simulation_id", "simulation_id"),
    )


class SeasonResult(Base):
    __tablename__ = "season_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    simulation_run_id: Mapped[int] = mapped_column(
        ForeignKey("simulation_runs.id", ondelete="CASCADE"), nullable=False
    )
    season_index: Mapped[int] = mapped_column(Integer, nullable=False)
    rainfall: Mapped[str] = mapped_column(String, nullable=False)
    yield_amount: Mapped[float] = mapped_column("yield", Float, nullable=False)

    run: Mapped["SimulationRun"] = relationship(back_populates="seasons")

    __table_args__ = (
        CheckConstraint("rainfall IN ('low','normal','high')", name="ck_seasons_rainfall"),
        CheckConstraint('"yield" >= 0', name="ck_seasons_yield"),
        UniqueConstraint(
            "simulation_run_id", "season_index", name="uq_seasons_run_season_index"
        ),
        Index("idx_season_results_run_id", "simulation_run_id"),
    )
