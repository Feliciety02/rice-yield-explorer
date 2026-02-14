import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { HistoricalComparison } from "@/components/analytics/HistoricalComparison";
import type { HistoryFilters } from "@/hooks/useSimulationHistory";
import type { SimulationConfig, SimulationRun } from "@/types/simulation";

vi.mock("@/context/scenario-data", () => ({
  useScenarioData: () => ({
    scenarios: [
      {
        id: 1,
        key: "balanced",
        name: "Scenario 1",
        description: "Test scenario",
        defaultProbabilities: { low: 0, normal: 100, high: 0 },
      },
    ],
    yieldByRainfall: null,
    isLoading: false,
    error: null,
  }),
}));

const baseFilters: HistoryFilters = {
  sortBy: "created_at",
  sortOrder: "desc",
  scenarioId: "all",
  minAvgYield: "",
  maxAvgYield: "",
  createdAfter: "",
  createdBefore: "",
};

const baseConfig: SimulationConfig = {
  scenarioKey: "balanced",
  numSeasons: 1,
  numReplications: 1,
  probabilities: { low: 0, normal: 100, high: 0 },
};

const baseResults: SimulationRun[] = [];

describe("HistoricalComparison filters", () => {
  it("updates numeric and date filters", () => {
    const onUpdateFilters = vi.fn();

    render(
      <HistoricalComparison
        savedSimulations={[]}
        selectedForComparison={[]}
        comparisonSimulations={[]}
        isLoading={false}
        totalCount={0}
        currentPage={1}
        totalPages={1}
        filters={baseFilters}
        onUpdateFilters={onUpdateFilters}
        onResetFilters={vi.fn()}
        onLoadNextPage={vi.fn()}
        onLoadPrevPage={vi.fn()}
        onRefresh={vi.fn()}
        currentResults={baseResults}
        currentConfig={baseConfig}
        currentAggregated={null}
        onSave={vi.fn()}
        onDelete={vi.fn()}
        onRename={vi.fn()}
        onToggleComparison={vi.fn()}
        onClearComparison={vi.fn()}
        onClearHistory={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Minimum average yield"), {
      target: { value: "2.5" },
    });
    expect(onUpdateFilters).toHaveBeenCalledWith({ minAvgYield: "2.5" });

    fireEvent.change(screen.getByLabelText("Maximum average yield"), {
      target: { value: "4.0" },
    });
    expect(onUpdateFilters).toHaveBeenCalledWith({ maxAvgYield: "4.0" });

    fireEvent.change(screen.getByLabelText("Created after"), {
      target: { value: "2025-01-01" },
    });
    expect(onUpdateFilters).toHaveBeenCalledWith({ createdAfter: "2025-01-01" });

    fireEvent.change(screen.getByLabelText("Created before"), {
      target: { value: "2025-12-31" },
    });
    expect(onUpdateFilters).toHaveBeenCalledWith({ createdBefore: "2025-12-31" });
  });

  it("resets filters", () => {
    const onResetFilters = vi.fn();

    render(
      <HistoricalComparison
        savedSimulations={[]}
        selectedForComparison={[]}
        comparisonSimulations={[]}
        isLoading={false}
        totalCount={0}
        currentPage={1}
        totalPages={1}
        filters={baseFilters}
        onUpdateFilters={vi.fn()}
        onResetFilters={onResetFilters}
        onLoadNextPage={vi.fn()}
        onLoadPrevPage={vi.fn()}
        onRefresh={vi.fn()}
        currentResults={baseResults}
        currentConfig={baseConfig}
        currentAggregated={null}
        onSave={vi.fn()}
        onDelete={vi.fn()}
        onRename={vi.fn()}
        onToggleComparison={vi.fn()}
        onClearComparison={vi.fn()}
        onClearHistory={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onResetFilters).toHaveBeenCalledTimes(1);
  });
});
