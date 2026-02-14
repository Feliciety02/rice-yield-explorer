export type RainfallLevel = "low" | "normal" | "high";

export type ScenarioId = 1 | 2 | 3 | 4 | 5;

export type RunMode = "single" | "all_scenarios";

export interface Scenario {
  id: ScenarioId;
  name: string;
  description: string;
  defaultProbabilities: RainfallProbabilities;
}

export interface RainfallProbabilities {
  low: number;
  normal: number;
  high: number;
}

export interface YieldByRainfall {
  low: number;
  normal: number;
  high: number;
}

export interface SeasonResult {
  seasonIndex: number;
  rainfall: RainfallLevel;
  yield: number;
}

export interface SimulationRun {
  scenarioId: ScenarioId;
  seasons: SeasonResult[];
  averageYield: number;
  minYield: number;
  maxYield: number;
  yieldVariability: "low" | "medium" | "high";
  lowYieldPercent: number;
}

export interface SimulationRunResponse extends SimulationRun {
  runIndex: number;
  probLow: number;
  probNormal: number;
  probHigh: number;
}

export interface SimulationConfig {
  scenarioId: ScenarioId;
  numSeasons: number;
  numReplications: number;
  probabilities: RainfallProbabilities;
  seed?: number;
}

export interface SimulationExecuteRequest {
  name?: string;
  runMode: RunMode;
  scenarioId: ScenarioId;
  numSeasons: number;
  numReplications: number;
  probabilities: RainfallProbabilities;
  seed?: number;
}

export interface SimulationSummary {
  id: string;
  name: string;
  createdAt: string;
  runMode: RunMode;
  numSeasons: number;
  numReplications: number;
  seed?: number;
  averageYield: number;
  minYield: number;
  maxYield: number;
  yieldVariability: "low" | "medium" | "high";
  lowYieldPercent: number;
}

export interface SimulationListResponse {
  items: SimulationSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface SimulationResponse {
  id: string;
  name: string;
  createdAt: string;
  runMode: RunMode;
  numSeasons: number;
  numReplications: number;
  seed?: number;
  averageYield: number;
  minYield: number;
  maxYield: number;
  yieldVariability: "low" | "medium" | "high";
  lowYieldPercent: number;
  runs: SimulationRunResponse[];
}

export interface SavedSimulation {
  id: string;
  name: string;
  timestamp: number;
  config?: SimulationConfig;
  results?: SimulationRun[];
  aggregatedResults: {
    averageYield: number;
    minYield: number;
    maxYield: number;
    yieldVariability: "low" | "medium" | "high";
    lowYieldPercent: number;
  };
}
