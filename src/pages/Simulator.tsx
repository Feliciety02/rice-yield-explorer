import { useEffect, useState } from "react";
import { useSimulation } from "@/hooks/useSimulation";
import { useSimulationHistory } from "@/hooks/useSimulationHistory";
import { Navbar } from "@/components/layout/Navbar";
import { SimulationInputPanel } from "@/components/simulation/SimulationInputPanel";
import { RiceFieldSimulationPanel } from "@/components/simulation/RiceFieldSimulationPanel";
import { SimulationResultsPanel } from "@/components/simulation/SimulationResultsPanel";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Table2, BookOpen } from "lucide-react";
import FarmerGuide from "@/components/FarmerGuide";

const Simulator = () => {
  const [resultsView, setResultsView] = useState<
    "summary" | "analytics" | "guide"
  >("summary");
  
  const {
    config,
    results,
    aggregatedResults,
    replicationResults,
    comparisonResults,
    isRunning,
    error: simulationError,
    validationError,
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
  } = useSimulation();

  const {
    savedSimulations,
    selectedForComparison,
    isLoading: isHistoryLoading,
    error: historyError,
    total: totalHistory,
    currentPage: historyPage,
    totalPages: historyTotalPages,
    filters: historyFilters,
    updateFilters: updateHistoryFilters,
    resetFilters: resetHistoryFilters,
    comparisonSimulations,
    loadNextPage,
    loadPrevPage,
    refreshHistory,
    saveSimulation,
    deleteSimulation,
    renameSimulation,
    toggleComparison,
    clearComparison,
    clearHistory,
  } = useSimulationHistory();

  const currentSeasons = results.length > 0 ? results[0].seasons : [];

  const handleStep = () => {
    if (currentSeasons.length > 0) {
      setActiveSeasonIndex((prev) =>
        prev < currentSeasons.length - 1 ? prev + 1 : 0
      );
    }
  };

  const handleReset = () => {
    setActiveSeasonIndex(0);
    setIsPlaying(false);
  };

  const handleSaveSimulation = (name: string) => {
    if (aggregatedResults) {
      saveSimulation(lastSimulationId, name);
    }
  };

  const handleRefreshHistory = () => {
    refreshHistory();
  };

  useEffect(() => {
    if (lastSimulationId) {
      refreshHistory();
    }
  }, [lastSimulationId, refreshHistory]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold font-serif text-foreground">
            Rice Yield Simulator
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure rainfall scenarios and analyze yield outcomes
          </p>
          {simulationError && (
            <p className="mt-3 text-sm text-destructive">{simulationError}</p>
          )}
          {historyError && (
            <p className="mt-1 text-sm text-destructive">{historyError}</p>
          )}
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Panel - Inputs */}
          <div className="lg:col-span-3">
            <SimulationInputPanel
              scenarioKey={config.scenarioKey}
              numSeasons={config.numSeasons}
              numReplications={config.numReplications}
              probabilities={config.probabilities}
              seed={config.seed}
              onScenarioChange={updateScenario}
              onNumSeasonsChange={updateNumSeasons}
              onNumReplicationsChange={updateNumReplications}
              onProbabilitiesChange={updateProbabilities}
              onSeedChange={updateSeed}
              onPreset={applyPreset}
              onRun={runSimulation}
              onRunAll={runAllScenarios}
              onReset={reset}
              isRunning={isRunning}
              validationError={validationError}
              isValid={!validationError}
            />
          </div>

          {/* Center Panel - Visualization */}
          <div className="lg:col-span-5">
            <RiceFieldSimulationPanel
              seasons={currentSeasons}
              activeSeasonIndex={activeSeasonIndex}
              onSelectSeason={setActiveSeasonIndex}
              isPlaying={isPlaying}
              onPlayPause={() => setIsPlaying(!isPlaying)}
              onStep={handleStep}
              onReset={handleReset}
            />
          </div>

          {/* Right Panel - Results with View Toggle */}
          <div className="lg:col-span-4">
            <div className="space-y-2">
              {/* View Toggle */}
              <div className="flex items-center justify-end gap-2">
              <Tabs
                value={resultsView}
                onValueChange={(v) =>
                  setResultsView(v as "summary" | "analytics" | "guide")
                }
              >
                  <TabsList className="h-8">
                    <TabsTrigger value="summary" className="text-xs h-7 px-2.5">
                      <Table2 className="w-3.5 h-3.5 mr-1" />
                      Summary
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="text-xs h-7 px-2.5">
                      <BarChart3 className="w-3.5 h-3.5 mr-1" />
                      Analytics
                    </TabsTrigger>
                    <TabsTrigger value="guide" className="text-xs h-7 px-2.5">
                      <BookOpen className="w-3.5 h-3.5 mr-1" />
                      Guide
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Results Content */}
              {resultsView === "summary" ? (
                <SimulationResultsPanel
                  results={results}
                  aggregatedResults={aggregatedResults}
                  replicationResults={replicationResults}
                  comparisonResults={comparisonResults}
                  isRunning={isRunning}
                />
              ) : resultsView === "analytics" ? (
                <AnalyticsDashboard
                  results={results}
                  config={config}
                  aggregatedResults={aggregatedResults}
                  isRunning={isRunning}
                  savedSimulations={savedSimulations}
                  selectedForComparison={selectedForComparison}
                  comparisonSimulations={comparisonSimulations}
                  isHistoryLoading={isHistoryLoading}
                  historyTotal={totalHistory}
                  historyPage={historyPage}
                  historyTotalPages={historyTotalPages}
                  historyFilters={historyFilters}
                  onUpdateHistoryFilters={updateHistoryFilters}
                  onResetHistoryFilters={resetHistoryFilters}
                  onLoadNextPage={loadNextPage}
                  onLoadPrevPage={loadPrevPage}
                  onRefreshHistory={handleRefreshHistory}
                  onSaveSimulation={handleSaveSimulation}
                  onDeleteSimulation={deleteSimulation}
                  onRenameSimulation={renameSimulation}
                  onToggleComparison={toggleComparison}
                  onClearComparison={clearComparison}
                  onClearHistory={clearHistory}
                />
              ) : (
                <FarmerGuide />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Simulator;
