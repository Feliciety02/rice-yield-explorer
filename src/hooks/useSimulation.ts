 import { useState, useCallback, useMemo } from "react";
 import {
   SimulationConfig,
   SimulationRun,
   SeasonResult,
   RainfallLevel,
   RainfallProbabilities,
   YIELD_BY_RAINFALL,
   SCENARIOS,
   ScenarioId,
 } from "@/types/simulation";
 
 // Simple seeded random number generator
 function seededRandom(seed: number) {
   let state = seed;
   return () => {
     state = (state * 1103515245 + 12345) & 0x7fffffff;
     return state / 0x7fffffff;
   };
 }
 
 function determineRainfall(
   probabilities: RainfallProbabilities,
   random: () => number
 ): RainfallLevel {
   const roll = random() * 100;
   if (roll < probabilities.low) return "low";
   if (roll < probabilities.low + probabilities.normal) return "normal";
   return "high";
 }
 
 function calculateVariability(yields: number[]): "low" | "medium" | "high" {
   if (yields.length === 0) return "low";
   const mean = yields.reduce((a, b) => a + b, 0) / yields.length;
   const variance =
     yields.reduce((acc, y) => acc + Math.pow(y - mean, 2), 0) / yields.length;
   const cv = (Math.sqrt(variance) / mean) * 100;
   if (cv < 15) return "low";
   if (cv < 30) return "medium";
   return "high";
 }
 
 function runSingleSimulation(
   config: SimulationConfig,
   random: () => number
 ): SimulationRun {
   const seasons: SeasonResult[] = [];
 
   for (let i = 0; i < config.numSeasons; i++) {
     const rainfall = determineRainfall(config.probabilities, random);
     seasons.push({
       seasonIndex: i,
       rainfall,
       yield: YIELD_BY_RAINFALL[rainfall],
     });
   }
 
   const yields = seasons.map((s) => s.yield);
   const averageYield = yields.reduce((a, b) => a + b, 0) / yields.length;
   const minYield = Math.min(...yields);
   const maxYield = Math.max(...yields);
   const lowYieldSeasons = seasons.filter((s) => s.rainfall === "low").length;
   const lowYieldPercent = (lowYieldSeasons / config.numSeasons) * 100;
 
   return {
     scenarioId: config.scenarioId,
     seasons,
     averageYield: Math.round(averageYield * 100) / 100,
     minYield,
     maxYield,
     yieldVariability: calculateVariability(yields),
     lowYieldPercent: Math.round(lowYieldPercent * 10) / 10,
   };
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
   const [isRunning, setIsRunning] = useState(false);
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
 
   const runSimulation = useCallback(() => {
     setIsRunning(true);
     setActiveSeasonIndex(0);
     setIsPlaying(false);
 
     const seed = config.seed ?? Date.now();
     const runs: SimulationRun[] = [];
 
     for (let i = 0; i < config.numReplications; i++) {
       const random = seededRandom(seed + i);
       runs.push(runSingleSimulation(config, random));
     }
 
     setResults(runs);
     setIsRunning(false);
   }, [config]);
 
   const runAllScenarios = useCallback(() => {
     setIsRunning(true);
     setActiveSeasonIndex(0);
     setIsPlaying(false);
 
     const seed = config.seed ?? Date.now();
     const runs: SimulationRun[] = [];
 
     SCENARIOS.forEach((scenario, idx) => {
       const scenarioConfig: SimulationConfig = {
         ...config,
         scenarioId: scenario.id,
         probabilities: { ...scenario.defaultProbabilities },
       };
       const random = seededRandom(seed + idx);
       runs.push(runSingleSimulation(scenarioConfig, random));
     });
 
     setResults(runs);
     setIsRunning(false);
   }, [config]);
 
   const reset = useCallback(() => {
     setResults([]);
     setActiveSeasonIndex(0);
     setIsPlaying(false);
   }, []);
 
   const aggregatedResults = useMemo(() => {
     if (results.length === 0) return null;
 
     const allYields = results.flatMap((r) => r.seasons.map((s) => s.yield));
     const avgYield =
       allYields.reduce((a, b) => a + b, 0) / allYields.length;
     const minYield = Math.min(...allYields);
     const maxYield = Math.max(...allYields);
     const lowSeasons = results.flatMap((r) =>
       r.seasons.filter((s) => s.rainfall === "low")
     ).length;
     const totalSeasons = results.reduce((acc, r) => acc + r.seasons.length, 0);
 
     return {
       averageYield: Math.round(avgYield * 100) / 100,
       minYield,
       maxYield,
       yieldVariability: calculateVariability(allYields),
       lowYieldPercent: Math.round((lowSeasons / totalSeasons) * 1000) / 10,
     };
   }, [results]);
 
   return {
     config,
     currentScenario,
     results,
     aggregatedResults,
     isRunning,
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