import { useState, useCallback, useMemo, useEffect } from "react";
import {
  AggregatedResults,
  ComparisonScenario,
  RainfallProbabilities,
  ReplicationResult,
  ReplicationSummary,
  Scenario,
  ScenarioKey,
  SeasonResult,
  SimulateResponse,
  SimulationConfig,
  SimulationRow,
  SimulationRun,
  SimulationStats,
} from "@/types/simulation";
import {
  runSimulation as runSimulationApi,
  compareScenarios as compareScenariosApi,
} from "@/lib/api";
import { useScenarioData } from "@/context/scenario-data";
import { toast } from "@/hooks/use-toast";

const MIN_SEASONS = 1;
const MAX_SEASONS = 50;
const MIN_REPLICATIONS = 1;
const MAX_REPLICATIONS = 100;

const SCENARIO_KEYS: ScenarioKey[] = [
  "custom",
  "balanced",
  "drought",
  "flood",
  "normal_rainfall",
  "random",
];

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function sumProbabilities(probabilities: RainfallProbabilities): number {
  return (
    probabilities.low + probabilities.normal + probabilities.high
  );
}

function toPercent(rate: number): number {
  return Math.round(rate * 1000) / 10;
}

function calculateVariability(mean: number, sd: number): "low" | "medium" | "high" {
  if (mean <= 0) {
    return "low";
  }
  const cv = sd / mean;
  if (cv < 0.15) {
    return "low";
  }
  if (cv < 0.3) {
    return "medium";
  }
  return "high";
}

function mapStatsToAggregated(stats: SimulationStats): AggregatedResults {
  const lowYieldRate = stats.lowYieldRate;
  return {
    averageYield: stats.meanYield,
    sdYield: stats.sdYield,
    minYield: stats.minYield,
    maxYield: stats.maxYield,
    yieldVariability: calculateVariability(stats.meanYield, stats.sdYield),
    lowYieldCount: stats.lowYieldCount,
    lowYieldRate,
    lowYieldPercent: toPercent(lowYieldRate),
  };
}

function mapReplicationResult(result: ReplicationResult): ReplicationSummary {
  const aggregated = mapStatsToAggregated(result);
  return {
    replication: result.replication,
    ...aggregated,
  };
}

function toDecimalProbabilities(probabilities: RainfallProbabilities) {
  return {
    low: probabilities.low / 100,
    normal: probabilities.normal / 100,
    high: probabilities.high / 100,
  };
}

function toPercentProbabilities(probabilities: {
  low: number;
  normal: number;
  high: number;
}): RainfallProbabilities {
  const low = Math.max(0, Math.min(100, Math.round(probabilities.low * 100)));
  let normal = Math.max(0, Math.min(100, Math.round(probabilities.normal * 100)));
  let high = 100 - low - normal;
  if (high < 0) {
    normal = Math.max(0, 100 - low);
    high = 100 - low - normal;
  }
  return { low, normal, high };
}

function mapRowsToSeasons(rows: SimulationRow[], replication = 1): SeasonResult[] {
  return rows
    .filter((row) => row.replication === replication)
    .sort((a, b) => a.season - b.season)
    .map((row) => ({
      seasonIndex: row.season - 1,
      rainfall: row.rainfall,
      yield: row.yield,
    }));
}

function findMatchingScenario(
  probabilities: RainfallProbabilities,
  scenarios: Scenario[]
): ScenarioKey | null {
  const match = scenarios.find((scenario) => {
    const preset = scenario.defaultProbabilities;
    return (
      preset.low === probabilities.low &&
      preset.normal === probabilities.normal &&
      preset.high === probabilities.high &&
      scenario.key !== "random"
    );
  });
  return match ? match.key : null;
}

function hashSeed(seed: string): number {
  let value = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    value ^= seed.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function makeRng(seed: string): () => number {
  let state = hashSeed(seed) || 0xa5a5a5a5;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function generateRandomProbabilities(seed?: string): RainfallProbabilities {
  const rng = seed ? makeRng(`${seed}|random-probabilities`) : Math.random;
  const a = rng() + 1e-9;
  const b = rng() + 1e-9;
  const c = rng() + 1e-9;
  const total = a + b + c;
  return toPercentProbabilities({
    low: a / total,
    normal: b / total,
    high: c / total,
  });
}

function validateConfig(config: SimulationConfig): string | null {
  if (config.numSeasons < MIN_SEASONS || config.numSeasons > MAX_SEASONS) {
    return `Number of seasons must be between ${MIN_SEASONS} and ${MAX_SEASONS}.`;
  }
  if (
    config.numReplications < MIN_REPLICATIONS ||
    config.numReplications > MAX_REPLICATIONS
  ) {
    return `Number of replications must be between ${MIN_REPLICATIONS} and ${MAX_REPLICATIONS}.`;
  }
  const sum = sumProbabilities(config.probabilities);
  if (sum !== 100) {
    return "Rainfall probabilities must sum to 100%.";
  }
  return null;
}

const STORAGE_KEY = "rice_yield_simulation_state";
const STORAGE_VERSION = 2;

const DEFAULT_PROBABILITIES: RainfallProbabilities = {
  low: 33,
  normal: 34,
  high: 33,
};

const DEFAULT_CONFIG: SimulationConfig = {
  scenarioKey: "balanced",
  numSeasons: 10,
  numReplications: 1,
  probabilities: { ...DEFAULT_PROBABILITIES },
  seed: undefined,
};

type PersistedSimulationState = {
  version: number;
  config: SimulationConfig;
  results: SimulationRun[];
  aggregatedResults: AggregatedResults | null;
  replicationResults: ReplicationSummary[];
  comparisonResults: ComparisonScenario[];
  lastSimulationId: string | null;
  activeSeasonIndex: number;
};

function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

function normalizeConfig(value: unknown): SimulationConfig | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const candidate = value as Partial<SimulationConfig> & {
    probabilities?: Partial<RainfallProbabilities>;
  };
  if (
    typeof candidate.scenarioKey !== "string" ||
    !SCENARIO_KEYS.includes(candidate.scenarioKey as ScenarioKey) ||
    !isNumber(candidate.numSeasons) ||
    !isNumber(candidate.numReplications) ||
    !candidate.probabilities
  ) {
    return null;
  }
  const probs = candidate.probabilities;
  if (!isNumber(probs.low) || !isNumber(probs.normal) || !isNumber(probs.high)) {
    return null;
  }
  const seed = typeof candidate.seed === "string" ? candidate.seed : undefined;
  return {
    scenarioKey: candidate.scenarioKey as ScenarioKey,
    numSeasons: clampInt(Math.floor(candidate.numSeasons), MIN_SEASONS, MAX_SEASONS),
    numReplications: clampInt(
      Math.floor(candidate.numReplications),
      MIN_REPLICATIONS,
      MAX_REPLICATIONS
    ),
    probabilities: {
      low: probs.low,
      normal: probs.normal,
      high: probs.high,
    },
    seed,
  };
}

function normalizeAggregatedResults(value: unknown): AggregatedResults | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const candidate = value as Partial<AggregatedResults>;
  if (
    !isNumber(candidate.averageYield) ||
    !isNumber(candidate.sdYield) ||
    !isNumber(candidate.minYield) ||
    !isNumber(candidate.maxYield) ||
    !isNumber(candidate.lowYieldRate) ||
    !isNumber(candidate.lowYieldPercent) ||
    !isNumber(candidate.lowYieldCount)
  ) {
    return null;
  }
  if (
    candidate.yieldVariability !== "low" &&
    candidate.yieldVariability !== "medium" &&
    candidate.yieldVariability !== "high"
  ) {
    return null;
  }
  return candidate as AggregatedResults;
}

function normalizeReplicationResults(value: unknown): ReplicationSummary[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const candidate = item as Partial<ReplicationSummary>;
      if (!isNumber(candidate.replication)) {
        return null;
      }
      const aggregated = normalizeAggregatedResults(candidate);
      if (!aggregated) {
        return null;
      }
      return { replication: candidate.replication, ...aggregated } as ReplicationSummary;
    })
    .filter((item): item is ReplicationSummary => Boolean(item));
}

function normalizeComparisonResults(value: unknown): ComparisonScenario[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const candidate = item as Partial<ComparisonScenario> & {
        probabilities?: Partial<RainfallProbabilities>;
        overall?: Partial<AggregatedResults>;
      };
      if (typeof candidate.scenario !== "string") {
        return null;
      }
      const probs = candidate.probabilities;
      if (!probs || !isNumber(probs.low) || !isNumber(probs.normal) || !isNumber(probs.high)) {
        return null;
      }
      const overall = normalizeAggregatedResults(candidate.overall);
      if (!overall) {
        return null;
      }
      return {
        scenario: candidate.scenario as ComparisonScenario["scenario"],
        probabilities: {
          low: probs.low,
          normal: probs.normal,
          high: probs.high,
        },
        overall,
      };
    })
    .filter((item): item is ComparisonScenario => Boolean(item));
}

function loadPersistedState(): PersistedSimulationState | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<PersistedSimulationState> | null;
    if (!parsed || parsed.version !== STORAGE_VERSION) {
      return null;
    }
    const config = normalizeConfig(parsed.config);
    if (!config) {
      return null;
    }
    const results = Array.isArray(parsed.results)
      ? (parsed.results as SimulationRun[])
      : [];
    const aggregatedResults = normalizeAggregatedResults(parsed.aggregatedResults);
    const replicationResults = normalizeReplicationResults(parsed.replicationResults);
    const comparisonResults = normalizeComparisonResults(parsed.comparisonResults);
    const lastSimulationId =
      typeof parsed.lastSimulationId === "string" ? parsed.lastSimulationId : null;
    const activeSeasonIndex = isNumber(parsed.activeSeasonIndex)
      ? parsed.activeSeasonIndex
      : 0;

    return {
      version: STORAGE_VERSION,
      config,
      results,
      aggregatedResults,
      replicationResults,
      comparisonResults,
      lastSimulationId,
      activeSeasonIndex,
    };
  } catch {
    return null;
  }
}

function persistState(state: PersistedSimulationState) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore write errors (e.g., storage full or disabled)
  }
}

function mapSimulateResponse(
  response: SimulateResponse,
  scenarioKey: ScenarioKey
): {
  results: SimulationRun[];
  aggregatedResults: AggregatedResults;
  replicationResults: ReplicationSummary[];
} {
  const aggregatedResults = mapStatsToAggregated(response.overall);
  const replicationResults = response.replicationResults.map(mapReplicationResult);
  const firstReplication = replicationResults[0];
  const seasons = response.rows ? mapRowsToSeasons(response.rows, 1) : [];

  const results: SimulationRun[] = firstReplication
    ? [
        {
          scenarioKey,
          seasons,
          averageYield: firstReplication.averageYield,
          sdYield: firstReplication.sdYield,
          minYield: firstReplication.minYield,
          maxYield: firstReplication.maxYield,
          yieldVariability: firstReplication.yieldVariability,
          lowYieldCount: firstReplication.lowYieldCount,
          lowYieldRate: firstReplication.lowYieldRate,
          lowYieldPercent: firstReplication.lowYieldPercent,
        },
      ]
    : [];

  return { results, aggregatedResults, replicationResults };
}

function mapCompareResponse(response: CompareResponse): ComparisonScenario[] {
  return response.scenarios.map((scenario) => ({
    scenario: scenario.scenario,
    probabilities: toPercentProbabilities(scenario.probabilities),
    overall: mapStatsToAggregated(scenario.overall),
  }));
}

export function useSimulation() {
  const { scenarios } = useScenarioData();
  const [config, setConfig] = useState<SimulationConfig>({ ...DEFAULT_CONFIG });
  const [hasScenarioDefaults, setHasScenarioDefaults] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const [results, setResults] = useState<SimulationRun[]>([]);
  const [aggregatedResults, setAggregatedResults] = useState<AggregatedResults | null>(null);
  const [replicationResults, setReplicationResults] = useState<ReplicationSummary[]>([]);
  const [comparisonResults, setComparisonResults] = useState<ComparisonScenario[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSimulationId, setLastSimulationId] = useState<string | null>(null);
  const [activeSeasonIndex, setActiveSeasonIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const validationError = useMemo(() => validateConfig(config), [config]);
  const isValid = !validationError;

  const currentScenario = useMemo(
    () => scenarios.find((s) => s.key === config.scenarioKey) || null,
    [config.scenarioKey, scenarios]
  );

  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted) {
      setConfig(persisted.config);
      setResults(persisted.results);
      setAggregatedResults(persisted.aggregatedResults);
      setReplicationResults(persisted.replicationResults);
      setComparisonResults(persisted.comparisonResults);
      setLastSimulationId(persisted.lastSimulationId);
      const maxSeasonIndex =
        persisted.results.length > 0
          ? Math.max(0, persisted.results[0].seasons.length - 1)
          : 0;
      setActiveSeasonIndex(
        Math.min(Math.max(0, persisted.activeSeasonIndex), maxSeasonIndex)
      );
      setHasScenarioDefaults(true);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || scenarios.length === 0) {
      return;
    }
    if (hasScenarioDefaults) {
      return;
    }
    const scenario = scenarios.find((s) => s.key === config.scenarioKey) ?? scenarios[0];
    if (!scenario) {
      return;
    }
    setConfig((prev) => ({
      ...prev,
      scenarioKey: scenario.key,
      probabilities: { ...scenario.defaultProbabilities },
    }));
    setHasScenarioDefaults(true);
  }, [config.scenarioKey, hasScenarioDefaults, isHydrated, scenarios]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    persistState({
      version: STORAGE_VERSION,
      config,
      results,
      aggregatedResults,
      replicationResults,
      comparisonResults,
      lastSimulationId,
      activeSeasonIndex,
    });
  }, [
    activeSeasonIndex,
    aggregatedResults,
    comparisonResults,
    config,
    isHydrated,
    lastSimulationId,
    replicationResults,
    results,
  ]);

  const updateScenario = useCallback(
    (scenarioKey: ScenarioKey) => {
      if (scenarioKey === "custom") {
        setConfig((prev) => ({ ...prev, scenarioKey }));
        return;
      }
      if (scenarioKey === "random") {
        const probs = generateRandomProbabilities(config.seed);
        setConfig((prev) => ({
          ...prev,
          scenarioKey,
          probabilities: probs,
        }));
        return;
      }
      const scenario = scenarios.find((s) => s.key === scenarioKey);
      setConfig((prev) => ({
        ...prev,
        scenarioKey,
        probabilities: scenario ? { ...scenario.defaultProbabilities } : prev.probabilities,
      }));
    },
    [config.seed, scenarios]
  );

  const updateProbabilities = useCallback(
    (probabilities: RainfallProbabilities) => {
      setConfig((prev) => {
        const match = findMatchingScenario(probabilities, scenarios);
        return {
          ...prev,
          probabilities,
          scenarioKey: match ?? "custom",
        };
      });
    },
    [scenarios]
  );

  const updateNumSeasons = useCallback((numSeasons: number) => {
    setConfig((prev) => ({
      ...prev,
      numSeasons: clampInt(numSeasons, MIN_SEASONS, MAX_SEASONS),
    }));
  }, []);

  const updateNumReplications = useCallback((numReplications: number) => {
    setConfig((prev) => ({
      ...prev,
      numReplications: clampInt(numReplications, MIN_REPLICATIONS, MAX_REPLICATIONS),
    }));
  }, []);

  const updateSeed = useCallback((seed: string | undefined) => {
    if (!seed) {
      setConfig((prev) => ({ ...prev, seed: undefined }));
      return;
    }
    setConfig((prev) => ({ ...prev, seed: seed.trim() || undefined }));
  }, []);

  const applyPreset = useCallback(
    (preset: "balanced" | "drought" | "flood" | "random") => {
      if (preset === "random") {
        updateScenario("random");
        return;
      }
      updateScenario(preset);
    },
    [updateScenario]
  );

  const runSimulation = useCallback(async () => {
    if (!isValid && validationError) {
      setError(validationError);
      toast({
        variant: "destructive",
        title: "Check your inputs",
        description: validationError,
      });
      return;
    }
    setIsRunning(true);
    setError(null);
    setActiveSeasonIndex(0);
    setIsPlaying(false);
    setComparisonResults([]);

    const payload = {
      scenario: config.scenarioKey,
      seasons: config.numSeasons,
      replications: config.numReplications,
      probabilities: toDecimalProbabilities(config.probabilities),
      seed: config.seed ?? null,
      includeRows: true,
    };

    try {
      const response = await runSimulationApi(payload);
      const mapped = mapSimulateResponse(response, config.scenarioKey);
      setResults(mapped.results);
      setAggregatedResults(mapped.aggregatedResults);
      setReplicationResults(mapped.replicationResults);
      setLastSimulationId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Simulation failed";
      console.error("Simulation failed:", error);
      setError(message);
      toast({
        variant: "destructive",
        title: "Simulation failed",
        description: message,
      });
    } finally {
      setIsRunning(false);
    }
  }, [config, isValid, validationError]);

  const runAllScenarios = useCallback(async () => {
    if (!isValid && validationError) {
      setError(validationError);
      toast({
        variant: "destructive",
        title: "Check your inputs",
        description: validationError,
      });
      return;
    }
    setIsRunning(true);
    setError(null);
    setActiveSeasonIndex(0);
    setIsPlaying(false);

    const payload = {
      seasons: config.numSeasons,
      replications: config.numReplications,
      seed: config.seed ?? null,
    };

    try {
      const response = await compareScenariosApi(payload);
      const mapped = mapCompareResponse(response);
      setComparisonResults(mapped);
      setResults([]);
      setAggregatedResults(null);
      setReplicationResults([]);
      setLastSimulationId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Simulation failed";
      console.error("Simulation failed:", error);
      setError(message);
      toast({
        variant: "destructive",
        title: "Simulation failed",
        description: message,
      });
    } finally {
      setIsRunning(false);
    }
  }, [config, isValid, validationError]);

  const reset = useCallback(() => {
    const scenario = scenarios.find((s) => s.key === "balanced") ?? scenarios[0];
    setConfig((prev) => ({
      ...DEFAULT_CONFIG,
      scenarioKey: scenario?.key ?? "balanced",
      probabilities: scenario ? { ...scenario.defaultProbabilities } : prev.probabilities,
    }));
    setResults([]);
    setAggregatedResults(null);
    setReplicationResults([]);
    setComparisonResults([]);
    setLastSimulationId(null);
    setError(null);
    setActiveSeasonIndex(0);
    setIsPlaying(false);
  }, [scenarios]);

  return {
    config,
    currentScenario,
    results,
    aggregatedResults,
    replicationResults,
    comparisonResults,
    isRunning,
    error,
    validationError,
    isValid,
    lastSimulationId,
    activeSeasonIndex,
    setActiveSeasonIndex,
    isPlaying,
    setIsPlaying,
    updateScenario,
    updateProbabilities,
    updateNumSeasons,
    updateNumReplications,
    updateSeed,
    applyPreset,
    runSimulation,
    runAllScenarios,
    reset,
  };
}
