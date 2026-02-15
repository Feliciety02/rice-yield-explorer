import os
from pathlib import Path

from fastapi.testclient import TestClient

DB_PATH = Path(__file__).resolve().parents[1] / "data" / "test_rice_yield_test.db"

if DB_PATH.exists():
    DB_PATH.unlink()

os.environ["DATABASE_URL"] = f"sqlite+pysqlite:///{DB_PATH.as_posix()}"
os.environ.setdefault("CORS_ORIGINS", "http://localhost")

from backend.app import main as app_main  # noqa: E402
from backend.app import db as app_db  # noqa: E402

client = TestClient(app_main.app)


def _run_payload() -> dict[str, object]:
    return {
        "name": "Test Run",
        "runMode": "single",
        "scenarioId": 1,
        "numSeasons": 3,
        "numReplications": 1,
        "probabilities": {"low": 10, "normal": 80, "high": 10},
        "seed": 123,
    }


def _create_payload(
    simulation_id: str,
    name: str,
    scenario_id: int,
    average_yield: float,
) -> dict[str, object]:
    return {
        "id": simulation_id,
        "name": name,
        "runMode": "single",
        "numSeasons": 1,
        "numReplications": 1,
        "averageYield": average_yield,
        "minYield": average_yield,
        "maxYield": average_yield,
        "yieldVariability": "low",
        "lowYieldPercent": 0,
        "runs": [
            {
                "runIndex": 0,
                "scenarioId": scenario_id,
                "probLow": 0,
                "probNormal": 100,
                "probHigh": 0,
                "averageYield": average_yield,
                "minYield": average_yield,
                "maxYield": average_yield,
                "yieldVariability": "low",
                "lowYieldPercent": 0,
                "seasons": [
                    {
                        "seasonIndex": 0,
                        "rainfall": "normal",
                        "yield": average_yield,
                    }
                ],
            }
        ],
    }


def setup_function() -> None:
    client.delete("/api/simulations")


def teardown_module() -> None:
    app_db.engine.dispose()
    if DB_PATH.exists():
        DB_PATH.unlink()


def test_create_list_rename_delete_simulation() -> None:
    create_resp = client.post("/api/simulations/run", json=_run_payload())
    assert create_resp.status_code == 201
    created = create_resp.json()
    simulation_id = created["id"]

    list_resp = client.get("/api/simulations?limit=10&offset=0")
    assert list_resp.status_code == 200
    listed = list_resp.json()
    assert listed["total"] == 1
    assert listed["items"][0]["id"] == simulation_id

    rename_resp = client.patch(
        f"/api/simulations/{simulation_id}",
        json={"name": "Renamed Simulation"},
    )
    assert rename_resp.status_code == 200
    assert rename_resp.json()["name"] == "Renamed Simulation"

    get_resp = client.get(f"/api/simulations/{simulation_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["name"] == "Renamed Simulation"

    delete_resp = client.delete(f"/api/simulations/{simulation_id}")
    assert delete_resp.status_code == 204

    list_resp = client.get("/api/simulations?limit=10&offset=0")
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 0


def test_clear_all_simulations() -> None:
    client.post("/api/simulations/run", json=_run_payload())
    client.post("/api/simulations/run", json=_run_payload())

    clear_resp = client.delete("/api/simulations")
    assert clear_resp.status_code == 204

    list_resp = client.get("/api/simulations?limit=10&offset=0")
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 0


def test_filters_and_sorting_for_simulations() -> None:
    create_a = client.post(
        "/api/simulations",
        json=_create_payload("sim-a", "Simulation A", 1, 2.0),
    )
    assert create_a.status_code == 201

    create_b = client.post(
        "/api/simulations",
        json=_create_payload("sim-b", "Simulation B", 2, 4.0),
    )
    assert create_b.status_code == 201

    scenario_resp = client.get("/api/simulations?limit=10&offset=0&scenario_id=2")
    assert scenario_resp.status_code == 200
    scenario_data = scenario_resp.json()
    assert scenario_data["total"] == 1
    assert scenario_data["items"][0]["id"] == "sim-b"

    min_yield_resp = client.get(
        "/api/simulations?limit=10&offset=0&min_avg_yield=3.0"
    )
    assert min_yield_resp.status_code == 200
    assert min_yield_resp.json()["items"][0]["id"] == "sim-b"

    max_yield_resp = client.get(
        "/api/simulations?limit=10&offset=0&max_avg_yield=3.0"
    )
    assert max_yield_resp.status_code == 200
    assert max_yield_resp.json()["items"][0]["id"] == "sim-a"

    sorted_resp = client.get(
        "/api/simulations?limit=10&offset=0&sort_by=average_yield&sort_order=asc"
    )
    assert sorted_resp.status_code == 200
    sorted_ids = [item["id"] for item in sorted_resp.json()["items"]]
    assert sorted_ids[:2] == ["sim-a", "sim-b"]


def test_list_scenarios_and_yield_mapping() -> None:
    scenarios_resp = client.get("/api/scenarios")
    assert scenarios_resp.status_code == 200
    scenarios = scenarios_resp.json()
    assert len(scenarios) >= 1
    assert {
        "id",
        "key",
        "name",
        "description",
        "defaultProbabilities",
    } <= set(scenarios[0].keys())

    yield_resp = client.get("/api/yield-by-rainfall")
    assert yield_resp.status_code == 200
    mapping = yield_resp.json()
    assert {"low", "normal", "high"} <= set(mapping.keys())


def test_simulate_endpoint() -> None:
    payload = {
        "scenario": "custom",
        "seasons": 4,
        "replications": 2,
        "probabilities": {"low": 0.2, "normal": 0.5, "high": 0.3},
        "seed": "api-seed",
        "includeRows": True,
    }
    resp = client.post("/api/simulate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["seasons"] == 4
    assert data["replications"] == 2
    assert "overall" in data
    assert len(data["replicationResults"]) == 2
    assert len(data.get("rows", [])) == 8


def test_compare_endpoint() -> None:
    resp = client.post(
        "/api/compare",
        json={"seasons": 3, "replications": 1, "seed": "compare-seed"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["seasons"] == 3
    assert data["replications"] == 1
    assert len(data["scenarios"]) == 5


def test_simulate_rejects_invalid_probabilities() -> None:
    resp = client.post(
        "/api/simulate",
        json={
            "scenario": "custom",
            "seasons": 3,
            "replications": 1,
            "probabilities": {"low": 0.2, "normal": 0.2, "high": 0.2},
        },
    )
    assert resp.status_code == 422
