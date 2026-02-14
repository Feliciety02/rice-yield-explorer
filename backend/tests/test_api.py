import os
from pathlib import Path

from fastapi.testclient import TestClient

DB_PATH = Path(__file__).resolve().parents[1] / "data" / "test_rice_yield_test.db"

if DB_PATH.exists():
    DB_PATH.unlink()

os.environ["DATABASE_URL"] = f"sqlite+pysqlite:///{DB_PATH.as_posix()}"
os.environ.setdefault("CORS_ORIGINS", "http://localhost")

from backend.app import main as app_main  # noqa: E402

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


def setup_function() -> None:
    client.delete("/api/simulations")


def teardown_module() -> None:
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
