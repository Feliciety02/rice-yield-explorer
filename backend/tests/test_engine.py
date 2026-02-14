from backend.app.schemas import RainfallProbabilities, SimulationExecuteRequest
from backend.app.simulation.engine import build_simulation_payload


def test_build_simulation_payload_is_deterministic():
    request = SimulationExecuteRequest(
        name="Deterministic",
        run_mode="single",
        scenario_id=1,
        num_seasons=5,
        num_replications=2,
        probabilities=RainfallProbabilities(low=10, normal=80, high=10),
        seed=12345,
    )

    payload_one = build_simulation_payload(request)
    payload_two = build_simulation_payload(request)

    assert payload_one.runs == payload_two.runs
    assert payload_one.average_yield == payload_two.average_yield


def test_all_scenarios_generates_five_runs():
    request = SimulationExecuteRequest(
        name="All",
        run_mode="all_scenarios",
        scenario_id=1,
        num_seasons=3,
        num_replications=1,
        probabilities=RainfallProbabilities(low=10, normal=80, high=10),
        seed=42,
    )

    payload = build_simulation_payload(request)

    assert len(payload.runs) == 5
    assert payload.num_replications == 5
