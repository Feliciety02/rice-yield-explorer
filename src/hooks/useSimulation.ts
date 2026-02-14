import { useState, useCallback, useMemo } from "react";
import {
  SimulationConfig,
  SimulationExecuteRequest,
  SimulationResponse,
  SimulationRun,
  RainfallProbabilities,
  SCENARIOS,
  ScenarioId,
} from "@/types/simulation";
import { runSimulation as runSimulationApi } from "@/lib/api";

type AggregatedResults = {
  averageYield: number;
  minYield: number;
  maxYield: number;
  yieldVariability: "low" | "medium" | "high";
  lowYieldPercent: number;
};

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
  const [config, setConfig] = useState<SimulationConfig>({
    scenarioId: 1,
    numSeasons: 10,
    numReplications: 1,
    probabilities: { ...SCENARIOS[0].defaultProbabilities },
    seed: undefined,
  });

  const [results, setResults] = useState<SimulationRun[]>([]);
  const [aggregatedResults, setAggregatedResults] = useState<AggregatedResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSimulationId, setLastSimulationId] = useState<string | null>(null);
  const [activeSeasonIndex, setActiveSeasonIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentScenario = useMemo(
    () => SCENARIOS.find((s) => s.id === config.scenarioId) || SCENARIOS[0],
    [config.scenarioId]
  );

  const updateScenario = useCallback((scenarioId: ScenarioId) => {
    const scenario = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];
    setConfig((prev) => ({
      ...prev,
      scenarioId,
      probabilities: { ...scenario.defaultProbabilities },
    }));
  }, []);

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
