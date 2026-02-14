import { useCallback, useEffect, useMemo, useState } from "react";
import type { SavedSimulation, SimulationSummary } from "@/types/simulation";
import {
  clearSimulations as clearSimulationsApi,
  deleteSimulation as deleteSimulationApi,
  listSimulations,
  renameSimulation as renameSimulationApi,
} from "@/lib/api";

const DEFAULT_LIMIT = 10;

function mapSummaryToSaved(summary: SimulationSummary): SavedSimulation {
  const timestamp = Number.isNaN(Date.parse(summary.createdAt))
    ? Date.now()
    : new Date(summary.createdAt).getTime();

  return {
    id: summary.id,
    name: summary.name,
    timestamp,
    aggregatedResults: {
      averageYield: summary.averageYield,
      minYield: summary.minYield,
      maxYield: summary.maxYield,
      yieldVariability: summary.yieldVariability,
      lowYieldPercent: summary.lowYieldPercent,
    },
  };
}

export function useSimulationHistory() {
  const [savedSimulations, setSavedSimulations] = useState<SavedSimulation[]>([]);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [comparisonMap, setComparisonMap] = useState<Record<string, SavedSimulation>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / limit));
  }, [limit, total]);

  const currentPage = useMemo(() => {
    return Math.floor(offset / limit) + 1;
  }, [limit, offset]);

  const fetchPage = useCallback(async (nextOffset: number, nextLimit: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listSimulations(nextLimit, nextOffset);
      const mapped = response.items.map(mapSummaryToSaved);
      setSavedSimulations(mapped);
      setLimit(response.limit);
      setOffset(response.offset);
      setTotal(response.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load history";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(0, DEFAULT_LIMIT);
  }, [fetchPage]);

  useEffect(() => {
    if (selectedForComparison.length === 0) {
      setComparisonMap({});
      return;
    }

    setComparisonMap((prev) => {
      const next = { ...prev };
      savedSimulations.forEach((sim) => {
        if (selectedForComparison.includes(sim.id)) {
          next[sim.id] = sim;
        }
      });
      return next;
    });
  }, [savedSimulations, selectedForComparison]);

  const refreshHistory = useCallback(() => {
    return fetchPage(offset, limit);
  }, [fetchPage, limit, offset]);

  const loadNextPage = useCallback(() => {
    const nextOffset = offset + limit;
    if (nextOffset >= total) {
      return;
    }
    fetchPage(nextOffset, limit);
  }, [fetchPage, limit, offset, total]);

  const loadPrevPage = useCallback(() => {
    const nextOffset = Math.max(0, offset - limit);
    fetchPage(nextOffset, limit);
  }, [fetchPage, limit, offset]);

  const renameSimulation = useCallback(async (id: string, newName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await renameSimulationApi(id, newName);
      setSavedSimulations((prev) =>
        prev.map((sim) =>
          sim.id === id ? { ...sim, name: updated.name } : sim
        )
      );
      setComparisonMap((prev) =>
        prev[id] ? { ...prev, [id]: { ...prev[id], name: updated.name } } : prev
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Rename failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSimulation = useCallback(
    async (id: string | null, name: string) => {
      if (!id) {
        setError("Run a simulation before saving.");
        return;
      }
      await renameSimulation(id, name);
      await refreshHistory();
    },
    [refreshHistory, renameSimulation]
  );

  const deleteSimulation = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteSimulationApi(id);
      setSavedSimulations((prev) => prev.filter((sim) => sim.id !== id));
      setSelectedForComparison((prev) => prev.filter((sid) => sid !== id));
      setComparisonMap((prev) => {
        if (!prev[id]) {
          return prev;
        }
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setTotal((prev) => Math.max(0, prev - 1));
      if (savedSimulations.length === 1 && offset > 0) {
        const nextOffset = Math.max(0, offset - limit);
        fetchPage(nextOffset, limit);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage, limit, offset, savedSimulations.length]);

  const clearHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await clearSimulationsApi();
      setSavedSimulations([]);
      setSelectedForComparison([]);
      setComparisonMap({});
      setTotal(0);
      setOffset(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to clear history";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleComparison = useCallback((id: string) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(id)) {
        setComparisonMap((prevMap) => {
          if (!prevMap[id]) {
            return prevMap;
          }
          const next = { ...prevMap };
          delete next[id];
          return next;
        });
        return prev.filter((sid) => sid !== id);
      }

      const removed = prev.length >= 4 ? prev[0] : null;
      const nextSelected = prev.length >= 4 ? [...prev.slice(1), id] : [...prev, id];
      const selectedSimulation = savedSimulations.find((sim) => sim.id === id);

      setComparisonMap((prevMap) => {
        let nextMap = { ...prevMap };
        if (removed) {
          delete nextMap[removed];
        }
        if (selectedSimulation) {
          nextMap[id] = selectedSimulation;
        }
        return nextMap;
      });

      return nextSelected;
    });
  }, [savedSimulations]);

  const clearComparison = useCallback(() => {
    setSelectedForComparison([]);
    setComparisonMap({});
  }, []);

  const comparisonSimulations = useMemo(() => {
    return selectedForComparison
      .map((id) => comparisonMap[id])
      .filter((sim): sim is SavedSimulation => Boolean(sim));
  }, [comparisonMap, selectedForComparison]);

  const getComparisonSimulations = useCallback(() => {
    return comparisonSimulations;
  }, [comparisonSimulations]);

  return {
    savedSimulations,
    selectedForComparison,
    isLoading,
    error,
    limit,
    offset,
    total,
    currentPage,
    totalPages,
    comparisonSimulations,
    refreshHistory,
    loadNextPage,
    loadPrevPage,
    saveSimulation,
    deleteSimulation,
    renameSimulation,
    toggleComparison,
    clearComparison,
    clearHistory,
    getComparisonSimulations,
  };
}
