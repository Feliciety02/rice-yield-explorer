import { useState, useCallback, useMemo, useEffect } from "react";
import {
  SimulationConfig,
  SimulationExecuteRequest,
  SimulationResponse,
  SimulationRun,
  RainfallProbabilities,
  ScenarioId,
} from "@/types/simulation";
import { runSimulation as runSimulationApi } from "@/lib/api";
import { useScenarioData } from "@/context/scenario-data";
import { toast } from "@/hooks/use-toast";

const STORAGE_KEY = "rice_yield_simulation_state";
const STORAGE_VERSION = 1;

type AggregatedResults = {
  averageYield: number;
  minYield: number;
  maxYield: number;
  yieldVariability: "low" | "medium" | "high";
  lowYieldPercent: number;
};

type PersistedSimulationState = {
  version: number;
  config: SimulationConfig;
  results: SimulationRun[];
  aggregatedResults: AggregatedResults | null;
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
    !isNumber(candidate.scenarioId) ||
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
  return {
    scenarioId: candidate.scenarioId as ScenarioId,
    numSeasons: Math.max(1, Math.floor(candidate.numSeasons)),
    numReplications: Math.max(1, Math.floor(candidate.numReplications)),
    probabilities: {
      low: probs.low,
      normal: probs.normal,
      high: probs.high,
    },
    seed: isNumber(candidate.seed) ? candidate.seed : undefined,
  };
}

function normalizeAggregatedResults(value: unknown): AggregatedResults | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const candidate = value as Partial<AggregatedResults>;
  if (
    !isNumber(candidate.averageYield) ||
    !isNumber(candidate.minYield) ||
    !isNumber(candidate.maxYield) ||
    !isNumber(candidate.lowYieldPercent)
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
    const aggregatedResults = normalizeAggregatedResults(
      parsed.aggregatedResults
    );
    const lastSimulationId =
      typeof parsed.lastSimulationId === "string"
        ? parsed.lastSimulationId
        : null;
    const activeSeasonIndex = isNumber(parsed.activeSeasonIndex)
      ? parsed.activeSeasonIndex
      : 0;

    return {
      version: STORAGE_VERSION,
      config,
      results,
      aggregatedResults,
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

function mapSimulationResponse(response: SimulationResponse): {
  results: SimulationRun[];
  aggregatedResults: AggregatedResults;
} {
  const results: SimulationRun[] = response.runs.map((run) => ({
    scenarioId: run.scenarioId,
    seasons: run.seasons.map((season) => ({
      seasonIndex: season.seasonIndex,
      rainfall: season.rainfall,
      yield: season.yield,
    })),
    averageYield: run.averageYield,
    minYield: run.minYield,
    maxYield: run.maxYield,
    yieldVariability: run.yieldVariability,
    lowYieldPercent: run.lowYieldPercent,
  }));

  const aggregatedResults: AggregatedResults = {
    averageYield: response.averageYield,
    minYield: response.minYield,
    maxYield: response.maxYield,
    yieldVariability: response.yieldVariability,
    lowYieldPercent: response.lowYieldPercent,
  };

  return { results, aggregatedResults };
}

export function useSimulation() {
  const { scenarios } = useScenarioData();
  const [config, setConfig] = useState<SimulationConfig>({
    scenarioId: 1,
    numSeasons: 10,
    numReplications: 1,
    probabilities: { low: 0, normal: 100, high: 0 },
    seed: undefined,
  });
  const [hasScenarioDefaults, setHasScenarioDefaults] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const [results, setResults] = useState<SimulationRun[]>([]);
  const [aggregatedResults, setAggregatedResults] = useState<AggregatedResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSimulationId, setLastSimulationId] = useState<string | null>(null);
  const [activeSeasonIndex, setActiveSeasonIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentScenario = useMemo(
    () => scenarios.find((s) => s.id === config.scenarioId) || null,
    [config.scenarioId, scenarios]
  );

  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted) {
      setConfig(persisted.config);
      setResults(persisted.results);
      setAggregatedResults(persisted.aggregatedResults);
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
    const scenario = scenarios.find((s) => s.id === config.scenarioId);
    if (!scenario) {
      const fallback = scenarios[0];
      setConfig((prev) => ({
        ...prev,
        scenarioId: fallback.id,
        probabilities: { ...fallback.defaultProbabilities },
      }));
      setHasScenarioDefaults(true);
      return;
    }
    if (hasScenarioDefaults) {
      return;
    }
    setConfig((prev) => ({
      ...prev,
      scenarioId: scenario.id,
      probabilities: { ...scenario.defaultProbabilities },
    }));
    setHasScenarioDefaults(true);
  }, [config.scenarioId, hasScenarioDefaults, isHydrated, scenarios]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    persistState({
      version: STORAGE_VERSION,
      config,
      results,
      aggregatedResults,
      lastSimulationId,
      activeSeasonIndex,
    });
  }, [
    activeSeasonIndex,
    aggregatedResults,
    config,
    isHydrated,
    lastSimulationId,
    results,
  ]);

  const updateScenario = useCallback((scenarioId: ScenarioId) => {
    const scenario = scenarios.find((s) => s.id === scenarioId);
    setConfig((prev) => ({
      ...prev,
      scenarioId,
      probabilities: scenario ? { ...scenario.defaultProbabilities } : prev.probabilities,
    }));
  }, [scenarios]);

  const updateProbabilities = useCallback(
    (probabilities: RainfallProbabilities) => {
      setConfig((prev) => ({ ...prev, probabilities }));
    },
    []
  );

  const updateNumSeasons = useCallback((numSeasons: number) => {
    setConfig((prev) => ({ ...prev, numSeasons: Math.max(1, numSeasons) }));
  }, []);

  const updateNumReplications = useCallback((numReplications: number) => {
    setConfig((prev) => ({
      ...prev,
      numReplications: Math.max(1, numReplications),
    }));
  }, []);

  const updateSeed = useCallback((seed: number | undefined) => {
    setConfig((prev) => ({ ...prev, seed }));
  }, []);

  const applyPreset = useCallback(
    (preset: "balanced" | "drought" | "flood" | "random") => {
      const presets: Record<string, RainfallProbabilities> = {
        balanced: { low: 33, normal: 34, high: 33 },
        drought: { low: 60, normal: 30, high: 10 },
        flood: { low: 10, normal: 30, high: 60 },
        random: {
          low: Math.floor(Math.random() * 100),
          normal: 0,
          high: 0,
        },
      };

      let probs = presets[preset];
      if (preset === "random") {
        const remaining = 100 - probs.low;
        probs.normal = Math.floor(Math.random() * remaining);
        probs.high = remaining - probs.normal;
      }

      updateProbabilities(probs);
    },
    [updateProbabilities]
  );

  const runSimulation = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    setActiveSeasonIndex(0);
    setIsPlaying(false);

    const payload: SimulationExecuteRequest = {
      runMode: "single",
      scenarioId: config.scenarioId,
      numSeasons: config.numSeasons,
      numReplications: config.numReplications,
      probabilities: config.probabilities,
      seed: config.seed,
    };

    try {
      const response = await runSimulationApi(payload);
      const mapped = mapSimulationResponse(response);
      setResults(mapped.results);
      setAggregatedResults(mapped.aggregatedResults);
      setLastSimulationId(response.id);
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
  }, [config]);

  const runAllScenarios = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    setActiveSeasonIndex(0);
    setIsPlaying(false);

    const payload: SimulationExecuteRequest = {
      runMode: "all_scenarios",
      scenarioId: config.scenarioId,
      numSeasons: config.numSeasons,
      numReplications: config.numReplications,
      probabilities: config.probabilities,
      seed: config.seed,
    };

    try {
      const response = await runSimulationApi(payload);
      const mapped = mapSimulationResponse(response);
      setResults(mapped.results);
      setAggregatedResults(mapped.aggregatedResults);
      setLastSimulationId(response.id);
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
  }, [config]);

  const reset = useCallback(() => {
    setResults([]);
    setAggregatedResults(null);
    setLastSimulationId(null);
    setError(null);
    setActiveSeasonIndex(0);
    setIsPlaying(false);
  }, []);

  return {
    config,
    currentScenario,
    results,
    aggregatedResults,
    isRunning,
    error,
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
