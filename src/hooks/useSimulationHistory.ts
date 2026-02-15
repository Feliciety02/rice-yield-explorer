import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { SavedSimulation, ScenarioId, SimulationSummary } from "@/types/simulation";
import {
  clearSimulations as clearSimulationsApi,
  deleteSimulation as deleteSimulationApi,
  listSimulations,
  renameSimulation as renameSimulationApi,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const DEFAULT_LIMIT = 10;

export type HistoryFilters = {
  sortBy: "created_at" | "average_yield";
  sortOrder: "asc" | "desc";
  scenarioId: "all" | ScenarioId;
  minAvgYield: string;
  maxAvgYield: string;
  createdAfter: string;
  createdBefore: string;
};

const DEFAULT_FILTERS: HistoryFilters = {
  sortBy: "created_at",
  sortOrder: "desc",
  scenarioId: "all",
  minAvgYield: "",
  maxAvgYield: "",
  createdAfter: "",
  createdBefore: "",
};

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

type SimulationPage = {
  items: SavedSimulation[];
  total: number;
  limit: number;
  offset: number;
};

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function fetchSimulations(
  limit: number,
  offset: number,
  filters: HistoryFilters
): Promise<SimulationPage> {
  const response = await listSimulations(limit, offset, {
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    scenarioId: filters.scenarioId === "all" ? undefined : filters.scenarioId,
    minAvgYield: parseOptionalNumber(filters.minAvgYield),
    maxAvgYield: parseOptionalNumber(filters.maxAvgYield),
    createdAfter: filters.createdAfter || undefined,
    createdBefore: filters.createdBefore || undefined,
  });
  return {
    ...response,
    items: response.items.map(mapSummaryToSaved),
  };
}

export function useSimulationHistory() {
  const queryClient = useQueryClient();
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [comparisonMap, setComparisonMap] = useState<Record<string, SavedSimulation>>({});
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [offset, setOffset] = useState(0);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [filters, setFilters] = useState<HistoryFilters>(DEFAULT_FILTERS);
  const lastQueryErrorRef = useRef<string | null>(null);

  const {
    data,
    error: queryError,
    isLoading: isQueryLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["simulations", limit, offset, filters],
    queryFn: () => fetchSimulations(limit, offset, filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: false,
    enabled: false, // Disabled: backend API not available in preview
  });

  const savedSimulations = data?.items ?? [];
  const total = data?.total ?? 0;

  const queryErrorMessage =
    queryError instanceof Error ? queryError.message : null;
  const error = mutationError || queryErrorMessage;

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / limit));
  }, [limit, total]);

  const currentPage = useMemo(() => {
    return Math.floor(offset / limit) + 1;
  }, [limit, offset]);

  useEffect(() => {
    if (!data || isFetching) {
      return;
    }
    if (data.limit !== limit) {
      setLimit(data.limit);
    }
    if (data.offset !== offset) {
      setOffset(data.offset);
    }
  }, [data, isFetching, limit, offset]);

  useEffect(() => {
    setOffset(0);
  }, [filters]);

  useEffect(() => {
    if (!queryErrorMessage) {
      lastQueryErrorRef.current = null;
      return;
    }
    if (lastQueryErrorRef.current === queryErrorMessage) {
      return;
    }
    lastQueryErrorRef.current = queryErrorMessage;
    toast({
      variant: "destructive",
      title: "Failed to load history",
      description: queryErrorMessage,
    });
  }, [queryErrorMessage]);

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
    return refetch();
  }, [refetch]);

  const updateFilters = useCallback((patch: Partial<HistoryFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
  }, []);

  const loadNextPage = useCallback(() => {
    const nextOffset = offset + limit;
    if (nextOffset >= total) {
      return;
    }
    setOffset(nextOffset);
  }, [limit, offset, total]);

  const loadPrevPage = useCallback(() => {
    const nextOffset = Math.max(0, offset - limit);
    setOffset(nextOffset);
  }, [limit, offset]);

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      renameSimulationApi(id, name),
    onMutate: () => {
      setMutationError(null);
    },
    onSuccess: (updated, variables) => {
      setComparisonMap((prev) =>
        prev[variables.id]
          ? { ...prev, [variables.id]: { ...prev[variables.id], name: updated.name } }
          : prev
      );
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Rename failed";
      setMutationError(message);
      toast({
        variant: "destructive",
        title: "Rename failed",
        description: message,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSimulationApi(id),
    onMutate: () => {
      setMutationError(null);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Delete failed";
      setMutationError(message);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: message,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => clearSimulationsApi(),
    onMutate: () => {
      setMutationError(null);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Failed to clear history";
      setMutationError(message);
      toast({
        variant: "destructive",
        title: "Clear history failed",
        description: message,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
    },
  });

  const renameSimulation = useCallback(
    async (id: string, newName: string) => {
      try {
        await renameMutation.mutateAsync({ id, name: newName });
      } catch {
        // errors handled in mutation
      }
    },
    [renameMutation]
  );

  const saveSimulation = useCallback(
    async (id: string | null, name: string) => {
      if (!id) {
        const message = "Run a simulation before saving.";
        setMutationError(message);
        toast({
          variant: "destructive",
          title: "Save failed",
          description: message,
        });
        return;
      }
      await renameSimulation(id, name);
      await refreshHistory();
    },
    [refreshHistory, renameSimulation]
  );

  const deleteSimulation = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        setSelectedForComparison((prev) => prev.filter((sid) => sid !== id));
        setComparisonMap((prev) => {
          if (!prev[id]) {
            return prev;
          }
          const next = { ...prev };
          delete next[id];
          return next;
        });
        if (savedSimulations.length === 1 && offset > 0) {
          setOffset(Math.max(0, offset - limit));
        }
      } catch {
        // errors handled in mutation
      }
    },
    [deleteMutation, limit, offset, savedSimulations.length]
  );

  const clearHistory = useCallback(async () => {
    try {
      await clearMutation.mutateAsync();
      setSelectedForComparison([]);
      setComparisonMap({});
      setOffset(0);
    } catch {
      // errors handled in mutation
    }
  }, [clearMutation]);

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

  const isLoading =
    isQueryLoading ||
    isFetching ||
    renameMutation.isPending ||
    deleteMutation.isPending ||
    clearMutation.isPending;

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
    filters,
    updateFilters,
    resetFilters,
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
