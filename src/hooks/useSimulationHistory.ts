import { useState, useCallback, useEffect } from "react";
import { SavedSimulation, SimulationRun, SimulationConfig } from "@/types/simulation";

const STORAGE_KEY = "rice_simulation_history";
const MAX_HISTORY = 20;

export function useSimulationHistory() {
  const [savedSimulations, setSavedSimulations] = useState<SavedSimulation[]>([]);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedSimulation[];
        setSavedSimulations(parsed);
      }
    } catch (error) {
      console.error("Failed to load simulation history:", error);
    }
  }, []);

  // Save to localStorage when history changes
  const persistHistory = useCallback((simulations: SavedSimulation[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(simulations));
    } catch (error) {
      console.error("Failed to persist simulation history:", error);
    }
  }, []);

  const saveSimulation = useCallback(
    (
      name: string,
      config: SimulationConfig,
      results: SimulationRun[],
      aggregatedResults: {
        averageYield: number;
        minYield: number;
        maxYield: number;
        yieldVariability: "low" | "medium" | "high";
        lowYieldPercent: number;
      }
    ) => {
      const newSimulation: SavedSimulation = {
        id: crypto.randomUUID(),
        name,
        timestamp: Date.now(),
        config,
        results,
        aggregatedResults,
      };

      setSavedSimulations((prev) => {
        const updated = [newSimulation, ...prev].slice(0, MAX_HISTORY);
        persistHistory(updated);
        return updated;
      });

      return newSimulation.id;
    },
    [persistHistory]
  );

  const deleteSimulation = useCallback(
    (id: string) => {
      setSavedSimulations((prev) => {
        const updated = prev.filter((s) => s.id !== id);
        persistHistory(updated);
        return updated;
      });
      setSelectedForComparison((prev) => prev.filter((sid) => sid !== id));
    },
    [persistHistory]
  );

  const renameSimulation = useCallback(
    (id: string, newName: string) => {
      setSavedSimulations((prev) => {
        const updated = prev.map((s) =>
          s.id === id ? { ...s, name: newName } : s
        );
        persistHistory(updated);
        return updated;
      });
    },
    [persistHistory]
  );

  const toggleComparison = useCallback((id: string) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(id)) {
        return prev.filter((sid) => sid !== id);
      }
      // Limit to 4 comparisons
      if (prev.length >= 4) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  }, []);

  const clearComparison = useCallback(() => {
    setSelectedForComparison([]);
  }, []);

  const clearHistory = useCallback(() => {
    setSavedSimulations([]);
    setSelectedForComparison([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getComparisonSimulations = useCallback(() => {
    return savedSimulations.filter((s) => selectedForComparison.includes(s.id));
  }, [savedSimulations, selectedForComparison]);

  return {
    savedSimulations,
    selectedForComparison,
    saveSimulation,
    deleteSimulation,
    renameSimulation,
    toggleComparison,
    clearComparison,
    clearHistory,
    getComparisonSimulations,
  };
}
