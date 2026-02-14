from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Callable, Literal
from uuid import uuid4

from .presets import load_presets

RainfallLevel = Literal["low", "normal", "high"]

LOW_YIELD_THRESHOLD = 2.0


@dataclass(frozen=True)
class YieldRule:
    low: Callable[[Callable[[], float]], float]
    normal: Callable[[Callable[[], float]], float]
    high: Callable[[Callable[[], float]], float]


DEFAULT_YIELD_RULES = YieldRule(
    low=lambda _rng: 2.0,
    normal=lambda _rng: 4.0,
    high=lambda _rng: 3.0,
)


def _round(value: float, digits: int) -> float:
    return round(value + 1e-12, digits)


def _hash_seed(seed: str) -> int:
    value = 2166136261
    for char in seed:
        value ^= ord(char)
        value = (value * 16777619) & 0xFFFFFFFF
    return value or 0xA5A5A5A5


def _make_rng(seed: str) -> Callable[[], float]:
    state = _hash_seed(seed)

    def _next() -> float:
        nonlocal state
        state = (1664525 * state + 1013904223) & 0xFFFFFFFF
        return state / 2**32

    return _next


def _derive_seed(base_seed: str, *parts: str) -> str:
    if not parts:
        return base_seed
    return "|".join([base_seed, *parts])


def _generate_seed(seed: str | None) -> str:
    if seed and seed.strip():
        return seed.strip()
    return uuid4().hex


def _normalize_probabilities(probabilities: dict[str, float]) -> dict[str, float]:
    total = sum(probabilities.values())
    if total <= 0:
        raise ValueError("probabilities must sum to a positive value")
    return {key: value / total for key, value in probabilities.items()}


def generate_random_probabilities(seed: str) -> dict[str, float]:
    rng = _make_rng(seed)
    values = [rng() + 1e-9, rng() + 1e-9, rng() + 1e-9]
    total = sum(values)
    return {
        "low": values[0] / total,
        "normal": values[1] / total,
        "high": values[2] / total,
    }


def sample_rainfall(
    probabilities: dict[str, float], rng: Callable[[], float]
) -> RainfallLevel:
    roll = rng()
    low_cutoff = probabilities["low"]
    normal_cutoff = low_cutoff + probabilities["normal"]
    if roll < low_cutoff:
        return "low"
    if roll < normal_cutoff:
        return "normal"
    return "high"


def compute_yield(
    rainfall: RainfallLevel,
    rng: Callable[[], float],
    rules: YieldRule = DEFAULT_YIELD_RULES,
) -> float:
    if rainfall == "low":
        return rules.low(rng)
    if rainfall == "normal":
        return rules.normal(rng)
    return rules.high(rng)


def compute_stats(values: list[float]) -> dict[str, object]:
    if not values:
        return {
            "mean_yield": 0.0,
            "sd_yield": 0.0,
            "min_yield": 0.0,
            "max_yield": 0.0,
            "low_yield_count": 0,
            "low_yield_rate": 0.0,
        }

    mean = sum(values) / len(values)
    variance = sum((value - mean) ** 2 for value in values) / len(values)
    sd = math.sqrt(variance)
    min_yield = min(values)
    max_yield = max(values)
    low_yield_count = sum(1 for value in values if value <= LOW_YIELD_THRESHOLD)
    low_yield_rate = low_yield_count / len(values)

    return {
        "mean_yield": _round(mean, 2),
        "sd_yield": _round(sd, 2),
        "min_yield": _round(min_yield, 2),
        "max_yield": _round(max_yield, 2),
        "low_yield_count": low_yield_count,
        "low_yield_rate": _round(low_yield_rate, 4),
    }


def run_one_replication(
    *,
    seasons: int,
    probabilities: dict[str, float],
    rng: Callable[[], float],
    replication: int,
    include_rows: bool = False,
    rules: YieldRule = DEFAULT_YIELD_RULES,
) -> tuple[dict[str, object], list[dict[str, object]], list[float]]:
    yields: list[float] = []
    rows: list[dict[str, object]] = []

    for season_index in range(seasons):
        rainfall = sample_rainfall(probabilities, rng)
        yield_amount = compute_yield(rainfall, rng, rules)
        yields.append(yield_amount)
        if include_rows:
            rows.append(
                {
                    "replication": replication,
                    "season": season_index + 1,
                    "rainfall": rainfall,
                    "yield": _round(yield_amount, 2),
                }
            )

    return compute_stats(yields), rows, yields


def run_simulation(
    *,
    seasons: int,
    replications: int,
    probabilities: dict[str, float],
    seed: str | None,
    scenario_key: str,
    include_rows: bool = False,
    rules: YieldRule = DEFAULT_YIELD_RULES,
) -> dict[str, object]:
    resolved_seed = _generate_seed(seed)
    probabilities = _normalize_probabilities(probabilities)
    replication_results: list[dict[str, object]] = []
    overall_values: list[float] = []
    rows: list[dict[str, object]] = []

    for idx in range(replications):
        rng = _make_rng(_derive_seed(resolved_seed, scenario_key, str(idx + 1)))
        stats, rep_rows, rep_values = run_one_replication(
            seasons=seasons,
            probabilities=probabilities,
            rng=rng,
            replication=idx + 1,
            include_rows=include_rows,
            rules=rules,
        )
        replication_results.append({"replication": idx + 1, **stats})
        overall_values.extend(rep_values)
        if include_rows:
            rows.extend(rep_rows)

    overall = compute_stats(overall_values)

    result: dict[str, object] = {
        "seed": resolved_seed,
        "overall": overall,
        "replication_results": replication_results,
    }
    if include_rows:
        result["rows"] = rows
    return result


def simulate(
    *,
    scenario: str,
    seasons: int,
    replications: int,
    probabilities: dict[str, float],
    seed: str | None,
    include_rows: bool = False,
) -> dict[str, object]:
    result = run_simulation(
        seasons=seasons,
        replications=replications,
        probabilities=probabilities,
        seed=seed,
        scenario_key=scenario,
        include_rows=include_rows,
    )
    return {
        "seasons": seasons,
        "replications": replications,
        "probabilities": probabilities,
        "seed": result["seed"],
        "overall": result["overall"],
        "replication_results": result["replication_results"],
        "rows": result.get("rows"),
    }


def compare(
    *,
    seasons: int,
    replications: int,
    seed: str | None,
) -> dict[str, object]:
    resolved_seed = _generate_seed(seed)
    scenarios: list[dict[str, object]] = []

    for preset in load_presets():
        key = str(preset.get("key"))
        probabilities = dict(preset.get("probabilities", {}))
        if key == "random":
            probabilities = generate_random_probabilities(
                _derive_seed(resolved_seed, "random-probabilities")
            )

        result = run_simulation(
            seasons=seasons,
            replications=replications,
            probabilities=probabilities,
            seed=resolved_seed,
            scenario_key=key,
            include_rows=False,
        )
        scenarios.append(
            {
                "scenario": key,
                "probabilities": probabilities,
                "overall": result["overall"],
            }
        )

    return {
        "seasons": seasons,
        "replications": replications,
        "seed": resolved_seed,
        "scenarios": scenarios,
    }
