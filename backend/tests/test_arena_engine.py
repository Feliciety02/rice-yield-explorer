import pytest

from backend.app import schemas
from backend.app.simulation import arena_engine


def test_probability_sum_validation() -> None:
    with pytest.raises(Exception):
        schemas.RainfallProbabilitiesFloat(low=0.2, normal=0.2, high=0.2)


def test_deterministic_outputs_with_seed() -> None:
    result_a = arena_engine.simulate(
        scenario="custom",
        seasons=5,
        replications=2,
        probabilities={"low": 0.1, "normal": 0.7, "high": 0.2},
        seed="seed-123",
        include_rows=True,
    )
    result_b = arena_engine.simulate(
        scenario="custom",
        seasons=5,
        replications=2,
        probabilities={"low": 0.1, "normal": 0.7, "high": 0.2},
        seed="seed-123",
        include_rows=True,
    )

    assert result_a["overall"] == result_b["overall"]
    assert result_a["replication_results"] == result_b["replication_results"]
    assert result_a["rows"] == result_b["rows"]


def test_replication_aggregation_correctness() -> None:
    result = arena_engine.simulate(
        scenario="custom",
        seasons=4,
        replications=3,
        probabilities={"low": 0.0, "normal": 1.0, "high": 0.0},
        seed="constant-yield",
        include_rows=False,
    )

    overall = result["overall"]
    assert overall["mean_yield"] == 4.0
    assert overall["sd_yield"] == 0.0
    assert overall["min_yield"] == 4.0
    assert overall["max_yield"] == 4.0
    assert overall["low_yield_count"] == 0
    assert overall["low_yield_rate"] == 0.0

    replication_results = result["replication_results"]
    assert len(replication_results) == 3
    for rep in replication_results:
        assert rep["mean_yield"] == 4.0
        assert rep["sd_yield"] == 0.0
