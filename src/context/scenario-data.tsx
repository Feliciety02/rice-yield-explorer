import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Scenario, YieldByRainfall } from "@/types/simulation";
import { getYieldByRainfall, listScenarios } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

type ScenarioDataState = {
  scenarios: Scenario[];
  yieldByRainfall: YieldByRainfall | null;
  isLoading: boolean;
  error: string | null;
};

const ScenarioDataContext = createContext<ScenarioDataState | null>(null);

export function ScenarioDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const scenariosQuery = useQuery({
    queryKey: ["scenarios"],
    queryFn: listScenarios,
    staleTime: 5 * 60 * 1000,
  });
  const yieldQuery = useQuery({
    queryKey: ["yield-by-rainfall"],
    queryFn: getYieldByRainfall,
    staleTime: 5 * 60 * 1000,
  });
  const lastScenarioErrorRef = useRef<string | null>(null);
  const lastYieldErrorRef = useRef<string | null>(null);

  const scenarioError =
    scenariosQuery.error instanceof Error
      ? scenariosQuery.error.message
      : scenariosQuery.error
      ? "Failed to load scenarios"
      : null;
  const yieldError =
    yieldQuery.error instanceof Error
      ? yieldQuery.error.message
      : yieldQuery.error
      ? "Failed to load yield mapping"
      : null;

  const scenarios = scenariosQuery.data ?? [];
  const yieldByRainfall = yieldQuery.data ?? null;
  const isLoading = scenariosQuery.isPending || yieldQuery.isPending;
  const error = [scenarioError, yieldError].filter(Boolean).join(" | ") || null;

  useEffect(() => {
    if (!scenarioError) {
      lastScenarioErrorRef.current = null;
      return;
    }
    if (lastScenarioErrorRef.current === scenarioError) {
      return;
    }
    lastScenarioErrorRef.current = scenarioError;
    toast({
      variant: "destructive",
      title: "Failed to load scenarios",
      description: scenarioError,
    });
  }, [scenarioError]);

  useEffect(() => {
    if (!yieldError) {
      lastYieldErrorRef.current = null;
      return;
    }
    if (lastYieldErrorRef.current === yieldError) {
      return;
    }
    lastYieldErrorRef.current = yieldError;
    toast({
      variant: "destructive",
      title: "Failed to load yield mapping",
      description: yieldError,
    });
  }, [yieldError]);

  const value = useMemo(
    () => ({ scenarios, yieldByRainfall, isLoading, error }),
    [scenarios, yieldByRainfall, isLoading, error]
  );

  return (
    <ScenarioDataContext.Provider value={value}>
      {children}
    </ScenarioDataContext.Provider>
  );
}

export function useScenarioData(): ScenarioDataState {
  const context = useContext(ScenarioDataContext);
  if (!context) {
    throw new Error("useScenarioData must be used within ScenarioDataProvider");
  }
  return context;
}
