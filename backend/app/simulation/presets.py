from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Iterable


PRESETS_PATH = (
    Path(__file__).resolve().parents[3]
    / "src"
    / "shared"
    / "scenario-presets.json"
)


@lru_cache(maxsize=1)
def load_presets() -> list[dict[str, object]]:
    with PRESETS_PATH.open("r", encoding="utf-8-sig") as handle:
        data = json.load(handle)
    if not isinstance(data, list):
        raise ValueError("scenario presets must be a list")
    return data


def get_preset_by_key(key: str) -> dict[str, object]:
    for preset in load_presets():
        if preset.get("key") == key:
            return preset
    raise KeyError(f"Unknown scenario key: {key}")


def probabilities_to_percent(probabilities: dict[str, float]) -> dict[str, int]:
    def _to_percent(value: float) -> int:
        return int(round(value * 100))

    return {
        "low": _to_percent(float(probabilities["low"])),
        "normal": _to_percent(float(probabilities["normal"])),
        "high": _to_percent(float(probabilities["high"])),
    }


def list_presets_for_api() -> list[dict[str, object]]:
    scenarios: list[dict[str, object]] = []
    for preset in load_presets():
        probs = preset.get("probabilities")
        if not isinstance(probs, dict):
            continue
        scenarios.append(
            {
                "id": preset.get("id"),
                "key": preset.get("key"),
                "name": preset.get("name"),
                "description": preset.get("description"),
                "default_probabilities": probabilities_to_percent(probs),
            }
        )
    return scenarios


def preset_keys() -> Iterable[str]:
    return [str(preset.get("key")) for preset in load_presets() if preset.get("key")]
