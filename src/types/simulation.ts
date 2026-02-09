export type RainfallLevel = "low" | "normal" | "high";

export type ScenarioId = 1 | 2 | 3 | 4 | 5;

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

export interface SimulationConfig {
  scenarioId: ScenarioId;
  numSeasons: number;
  numReplications: number;
  probabilities: RainfallProbabilities;
  seed?: number;
}

export interface SavedSimulation {
  id: string;
  name: string;
  timestamp: number;
  config: SimulationConfig;
  results: SimulationRun[];
  aggregatedResults: {
    averageYield: number;
    minYield: number;
    maxYield: number;
    yieldVariability: "low" | "medium" | "high";
    lowYieldPercent: number;
  };
}

export const SCENARIOS: Scenario[] = [
  {
    id: 1,
    name: "Normal Rainfall",
    description: "Baseline scenario with high probability of normal rainfall conditions throughout the growing season.",
    defaultProbabilities: { low: 10, normal: 80, high: 10 },
  },
  {
    id: 2,
    name: "Low Rainfall (Drought)",
    description: "Simulates drought conditions with significantly reduced rainfall, stressing rice crops.",
    defaultProbabilities: { low: 70, normal: 20, high: 10 },
  },
  {
    id: 3,
    name: "High Rainfall (Flood)",
    description: "Models excess rainfall leading to potential flooding and waterlogging of paddy fields.",
    defaultProbabilities: { low: 10, normal: 20, high: 70 },
  },
  {
    id: 4,
    name: "Variable Rainfall",
    description: "Unpredictable weather patterns with equal probability of all rainfall conditions.",
    defaultProbabilities: { low: 33, normal: 34, high: 33 },
  },
  {
    id: 5,
    name: "Early Planting Strategy",
    description: "Adaptive strategy where early planting increases probability of favorable growing conditions.",
    defaultProbabilities: { low: 15, normal: 70, high: 15 },
  },
];

export const YIELD_BY_RAINFALL: Record<RainfallLevel, number> = {
  low: 2.0,
  normal: 4.0,
  high: 3.0,
};
