export type RainfallLevel = "low" | "normal" | "high";

export type ScenarioId = 1 | 2 | 3 | 4 | 5;

export type ScenarioKey =
  | "custom"
  | "balanced"
  | "drought"
  | "flood"
  | "normal_rainfall"
  | "random";

export type PresetScenarioKey = Exclude<ScenarioKey, "custom">;

export type RunMode = "single" | "all_scenarios";

export interface Scenario {
  id: ScenarioId;
  key: PresetScenarioKey;
  name: string;
  description: string;
  defaultProbabilities: RainfallProbabilities;
}

export interface RainfallProbabilities {
  low: number;
  normal: number;
  high: number;
}

export interface RainfallProbabilitiesDecimal {
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
  scenarioKey: ScenarioKey;
  seasons: SeasonResult[];
  averageYield: number;
  sdYield: number;
  minYield: number;
  maxYield: number;
  yieldVariability: "low" | "medium" | "high";
  lowYieldCount: number;
  lowYieldRate: number;
  lowYieldPercent: number;
}

export interface AggregatedResults {
  averageYield: number;
  sdYield: number;
  minYield: number;
  maxYield: number;
  yieldVariability: "low" | "medium" | "high";
  lowYieldCount: number;
  lowYieldRate: number;
  lowYieldPercent: number;
}

export interface ReplicationSummary extends AggregatedResults {
  replication: number;
}

export interface SimulationConfig {
  scenarioKey: ScenarioKey;
  numSeasons: number;
  numReplications: number;
  probabilities: RainfallProbabilities;
  seed?: string;
}

export interface SimulationStats {
  meanYield: number;
  sdYield: number;
  minYield: number;
  maxYield: number;
  lowYieldCount: number;
  lowYieldRate: number;
}

export interface ReplicationResult extends SimulationStats {
  replication: number;
}

export interface SimulationRow {
  replication: number;
  season: number;
  rainfall: RainfallLevel;
  yield: number;
}

export interface SimulateRequest {
  scenario: ScenarioKey;
  seasons: number;
  replications: number;
  probabilities: RainfallProbabilitiesDecimal;
  seed?: string | null;
  includeRows?: boolean;
}

export interface SimulateResponse {
  seasons: number;
  replications: number;
  probabilities: RainfallProbabilitiesDecimal;
  seed: string | null;
  overall: SimulationStats;
  replicationResults: ReplicationResult[];
  rows?: SimulationRow[];
}

export interface CompareRequest {
  seasons: number;
  replications: number;
  seed?: string | null;
}

export interface CompareScenarioResult {
  scenario: PresetScenarioKey;
  probabilities: RainfallProbabilitiesDecimal;
  overall: SimulationStats;
}

export interface CompareResponse {
  seasons: number;
  replications: number;
  seed: string | null;
  scenarios: CompareScenarioResult[];
}

export interface ComparisonScenario {
  scenario: PresetScenarioKey;
  probabilities: RainfallProbabilities;
  overall: AggregatedResults;
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

export interface SimulationRunResponse extends SimulationRun {
  runIndex: number;
  probLow: number;
  probNormal: number;
  probHigh: number;
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
