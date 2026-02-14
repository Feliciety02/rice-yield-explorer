from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


def to_camel(text: str) -> str:
    parts = text.split("_")
    return parts[0] + "".join(word.capitalize() for word in parts[1:])


class SchemaBase(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=to_camel,
        extra="forbid",
    )


RainfallLevel = Literal["low", "normal", "high"]
YieldVariability = Literal["low", "medium", "high"]
RunMode = Literal["single", "all_scenarios"]


class RainfallProbabilities(SchemaBase):
    low: int = Field(ge=0, le=100)
    normal: int = Field(ge=0, le=100)
    high: int = Field(ge=0, le=100)

    @model_validator(mode="after")
    def _check_probability_sum(self) -> "RainfallProbabilities":
        if self.low + self.normal + self.high != 100:
            raise ValueError("probabilities must sum to 100")
        return self


class SeasonResultBase(SchemaBase):
    season_index: int = Field(ge=0)
    rainfall: RainfallLevel
    yield_amount: float = Field(ge=0, alias="yield")


class SeasonResultCreate(SeasonResultBase):
    pass


class SeasonResultRead(SeasonResultBase):
    id: int


class SimulationRunBase(SchemaBase):
    run_index: int = Field(ge=0)
    scenario_id: int = Field(ge=1, le=5)
    prob_low: int = Field(ge=0, le=100)
    prob_normal: int = Field(ge=0, le=100)
    prob_high: int = Field(ge=0, le=100)
    average_yield: float = Field(ge=0)
    min_yield: float = Field(ge=0)
    max_yield: float = Field(ge=0)
    yield_variability: YieldVariability
    low_yield_percent: float = Field(ge=0, le=100)

    @model_validator(mode="after")
    def _check_probability_sum(self) -> "SimulationRunBase":
        if self.prob_low + self.prob_normal + self.prob_high != 100:
            raise ValueError("probabilities must sum to 100")
        return self


class SimulationRunCreate(SimulationRunBase):
    seasons: list[SeasonResultCreate]


class SimulationRunRead(SimulationRunBase):
    id: int
    seasons: list[SeasonResultRead]


class SimulationBase(SchemaBase):
    name: str = Field(min_length=1)
    run_mode: RunMode = "single"
    num_seasons: int = Field(ge=1)
    num_replications: int = Field(ge=1)
    seed: int | None = None
    average_yield: float = Field(ge=0)
    min_yield: float = Field(ge=0)
    max_yield: float = Field(ge=0)
    yield_variability: YieldVariability
    low_yield_percent: float = Field(ge=0, le=100)


class SimulationCreate(SimulationBase):
    id: str | None = None
    runs: list[SimulationRunCreate]


class SimulationUpdate(SchemaBase):
    name: str | None = Field(default=None, min_length=1)


class SimulationExecuteRequest(SchemaBase):
    name: str | None = Field(default=None, min_length=1)
    run_mode: RunMode = "single"
    scenario_id: int = Field(ge=1, le=5)
    num_seasons: int = Field(ge=1)
    num_replications: int = Field(ge=1)
    probabilities: RainfallProbabilities
    seed: int | None = None


class SimulationSummary(SimulationBase):
    id: str
    created_at: str


class SimulationRead(SimulationSummary):
    runs: list[SimulationRunRead]


class SimulationListResponse(SchemaBase):
    items: list[SimulationSummary]
    total: int
    limit: int
    offset: int
