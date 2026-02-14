from __future__ import annotations

import time
from typing import Callable, Iterable

from .. import schemas
from .presets import list_presets_for_api

SCENARIOS: list[dict[str, object]] = list_presets_for_api()

YIELD_BY_RAINFALL: dict[str, float] = {
    "low": 2.0,
    "normal": 4.0,
    "high": 3.0,
}


def _seeded_random(seed: int) -> Callable[[], float]:
    state = seed & 0x7FFFFFFF

    def _next() -> float:
        nonlocal state
        state = (state * 1103515245 + 12345) & 0x7FFFFFFF
        return state / 0x7FFFFFFF

    return _next


def _determine_rainfall(
    probabilities: schemas.RainfallProbabilities, random_fn: Callable[[], float]
) -> schemas.RainfallLevel:
    roll = random_fn() * 100
    if roll < probabilities.low:
        return "low"
    if roll < probabilities.low + probabilities.normal:
        return "normal"
    return "high"


def _calculate_variability(yields: Iterable[float]) -> schemas.YieldVariability:
    values = list(yields)
    if not values:
        return "low"
    mean = sum(values) / len(values)
    if mean <= 0:
        return "low"
    variance = sum((value - mean) ** 2 for value in values) / len(values)
    cv = (variance ** 0.5 / mean) * 100
    if cv < 15:
        return "low"
    if cv < 30:
        return "medium"
    return "high"


def _round(value: float, digits: int) -> float:
    return round(value + 1e-12, digits)


def _run_single_simulation(
    *,
    run_index: int,
    scenario_id: int,
    num_seasons: int,
    probabilities: schemas.RainfallProbabilities,
    random_fn: Callable[[], float],
) -> dict[str, object]:
    seasons: list[dict[str, object]] = []

    for season_index in range(num_seasons):
        rainfall = _determine_rainfall(probabilities, random_fn)
        seasons.append(
            {
                "season_index": season_index,
                "rainfall": rainfall,
                "yield_amount": YIELD_BY_RAINFALL[rainfall],
            }
        )

    yields = [season["yield_amount"] for season in seasons]
    average_yield = sum(yields) / len(yields)
    min_yield = min(yields)
    max_yield = max(yields)
    low_yield_seasons = sum(1 for season in seasons if season["rainfall"] == "low")
    low_yield_percent = (low_yield_seasons / num_seasons) * 100

    return {
        "run_index": run_index,
        "scenario_id": scenario_id,
        "prob_low": probabilities.low,
        "prob_normal": probabilities.normal,
        "prob_high": probabilities.high,
        "average_yield": _round(average_yield, 2),
        "min_yield": min_yield,
        "max_yield": max_yield,
        "yield_variability": _calculate_variability(yields),
        "low_yield_percent": _round(low_yield_percent, 1),
        "seasons": seasons,
    }


def _aggregate_runs(runs: list[dict[str, object]]) -> dict[str, object]:
    all_yields: list[float] = []
    low_season_count = 0

    for run in runs:
        for season in run["seasons"]:
            all_yields.append(float(season["yield_amount"]))
            if season["rainfall"] == "low":
                low_season_count += 1

    if not all_yields:
        return {
            "average_yield": 0.0,
            "min_yield": 0.0,
            "max_yield": 0.0,
            "yield_variability": "low",
            "low_yield_percent": 0.0,
        }

    average_yield = sum(all_yields) / len(all_yields)
    min_yield = min(all_yields)
    max_yield = max(all_yields)
    low_yield_percent = (low_season_count / len(all_yields)) * 100

    return {
        "average_yield": _round(average_yield, 2),
        "min_yield": min_yield,
        "max_yield": max_yield,
        "yield_variability": _calculate_variability(all_yields),
        "low_yield_percent": _round(low_yield_percent, 1),
    }


def _ensure_name(name: str | None) -> str:
    if not name:
        return "Simulation"
    cleaned = name.strip()
    return cleaned or "Simulation"


def build_simulation_payload(
    request: schemas.SimulationExecuteRequest,
) -> schemas.SimulationCreate:
    seed_value = request.seed
    if seed_value is None:
        seed_value = int(time.time() * 1000)

    runs: list[dict[str, object]] = []

    if request.run_mode == "all_scenarios":
        for idx, scenario in enumerate(SCENARIOS):
            probabilities = schemas.RainfallProbabilities.model_validate(
                scenario["default_probabilities"]
            )
            random_fn = _seeded_random(seed_value + idx)
            runs.append(
                _run_single_simulation(
                    run_index=idx,
                    scenario_id=int(scenario["id"]),
                    num_seasons=request.num_seasons,
                    probabilities=probabilities,
                    random_fn=random_fn,
                )
            )
        run_count = len(runs)
    else:
        probabilities = request.probabilities
        for idx in range(request.num_replications):
            random_fn = _seeded_random(seed_value + idx)
            runs.append(
                _run_single_simulation(
                    run_index=idx,
                    scenario_id=request.scenario_id,
                    num_seasons=request.num_seasons,
                    probabilities=probabilities,
                    random_fn=random_fn,
                )
            )
        run_count = request.num_replications

    aggregated = _aggregate_runs(runs)

    return schemas.SimulationCreate(
        name=_ensure_name(request.name),
        run_mode=request.run_mode,
        num_seasons=request.num_seasons,
        num_replications=run_count,
        seed=seed_value,
        average_yield=float(aggregated["average_yield"]),
        min_yield=float(aggregated["min_yield"]),
        max_yield=float(aggregated["max_yield"]),
        yield_variability=aggregated["yield_variability"],
        low_yield_percent=float(aggregated["low_yield_percent"]),
        runs=[schemas.SimulationRunCreate.model_validate(run) for run in runs],
    )
