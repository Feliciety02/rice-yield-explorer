import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SimulationInputPanel } from "@/components/simulation/SimulationInputPanel";
import type { RainfallProbabilities } from "@/types/simulation";

vi.mock("@/context/scenario-data", () => ({
  useScenarioData: () => ({
    scenarios: [
      {
        id: 1,
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

const toastSpy = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  toast: (args: unknown) => toastSpy(args),
}));

const probabilities: RainfallProbabilities = { low: 10, normal: 80, high: 10 };

describe("SimulationInputPanel validation", () => {
  it("clamps seasons and replications and shows a toast", () => {
    const onNumSeasonsChange = vi.fn();
    const onNumReplicationsChange = vi.fn();

    render(
      <SimulationInputPanel
        scenarioId={1}
        numSeasons={10}
        numReplications={1}
        probabilities={probabilities}
        seed={undefined}
        onScenarioChange={vi.fn()}
        onNumSeasonsChange={onNumSeasonsChange}
        onNumReplicationsChange={onNumReplicationsChange}
        onProbabilitiesChange={vi.fn()}
        onSeedChange={vi.fn()}
        onPreset={vi.fn()}
        onRun={vi.fn()}
        onRunAll={vi.fn()}
        onReset={vi.fn()}
        isRunning={false}
      />
    );

    fireEvent.change(screen.getByLabelText("Number of Seasons"), {
      target: { value: "0" },
    });
    expect(onNumSeasonsChange).toHaveBeenCalledWith(1);

    fireEvent.change(screen.getByLabelText("Number of Replications"), {
      target: { value: "999" },
    });
    expect(onNumReplicationsChange).toHaveBeenCalledWith(100);

    expect(toastSpy).toHaveBeenCalled();
  });

  it("normalizes negative seeds", () => {
    const onSeedChange = vi.fn();

    render(
      <SimulationInputPanel
        scenarioId={1}
        numSeasons={10}
        numReplications={1}
        probabilities={probabilities}
        seed={undefined}
        onScenarioChange={vi.fn()}
        onNumSeasonsChange={vi.fn()}
        onNumReplicationsChange={vi.fn()}
        onProbabilitiesChange={vi.fn()}
        onSeedChange={onSeedChange}
        onPreset={vi.fn()}
        onRun={vi.fn()}
        onRunAll={vi.fn()}
        onReset={vi.fn()}
        isRunning={false}
      />
    );

    fireEvent.change(screen.getByLabelText("Random Seed (optional)"), {
      target: { value: "-42" },
    });
    expect(onSeedChange).toHaveBeenCalledWith(0);
    expect(toastSpy).toHaveBeenCalled();
  });
});
