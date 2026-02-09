import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SimulationRun, SimulationConfig, SavedSimulation, SCENARIOS } from "@/types/simulation";
import { YieldDistributionChart } from "./YieldDistributionChart";
import { CumulativeProbabilityChart } from "./CumulativeProbabilityChart";
import { StatisticalSummary } from "./StatisticalSummary";
import { RainfallImpactChart } from "./RainfallImpactChart";
import { SeasonalTrendChart } from "./SeasonalTrendChart";
import { MonteCarloAnalysis } from "./MonteCarloAnalysis";
import { HistoricalComparison } from "./HistoricalComparison";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Printer,
  Target,
  History,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AnalyticsDashboardProps {
  results: SimulationRun[];
  config: SimulationConfig;
  aggregatedResults: {
    averageYield: number;
    minYield: number;
    maxYield: number;
    yieldVariability: "low" | "medium" | "high";
    lowYieldPercent: number;
  } | null;
  // History props
  savedSimulations: SavedSimulation[];
  selectedForComparison: string[];
  onSaveSimulation: (name: string) => void;
  onDeleteSimulation: (id: string) => void;
  onRenameSimulation: (id: string, newName: string) => void;
  onToggleComparison: (id: string) => void;
  onClearComparison: () => void;
  onClearHistory: () => void;
}

export function AnalyticsDashboard({
  results,
  config,
  aggregatedResults,
  savedSimulations,
  selectedForComparison,
  onSaveSimulation,
  onDeleteSimulation,
  onRenameSimulation,
  onToggleComparison,
  onClearComparison,
  onClearHistory,
}: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!aggregatedResults || results.length === 0) {
    return (
      <Card className="panel h-full">
        <CardHeader className="panel-header">
          <h3 className="font-serif text-lg">Analytics Dashboard</h3>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <div className="text-center space-y-2">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Run a simulation to see analytics
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const exportCSV = () => {
    const headers = ["Scenario", "Season", "Rainfall", "Yield (t/ha)"];
    const rows = results.flatMap((r) => {
      const scenario = SCENARIOS.find((s) => s.id === r.scenarioId)?.name || `Scenario ${r.scenarioId}`;
      return r.seasons.map((s) => [
        scenario,
        s.seasonIndex + 1,
        s.rainfall,
        s.yield,
      ]);
    });

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rice_simulation_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const exportData = {
      generatedAt: new Date().toISOString(),
      summary: aggregatedResults,
      scenarios: results.map((r) => ({
        scenario: SCENARIOS.find((s) => s.id === r.scenarioId)?.name || `Scenario ${r.scenarioId}`,
        metrics: {
          averageYield: r.averageYield,
          minYield: r.minYield,
          maxYield: r.maxYield,
          variability: r.yieldVariability,
          lowYieldPercent: r.lowYieldPercent,
        },
        seasons: r.seasons,
      })),
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rice_simulation_report.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <Card className="panel h-full overflow-hidden print:shadow-none">
      <CardHeader className="panel-header flex flex-row items-center justify-between print:hidden">
        <h3 className="font-serif text-lg">Analytics Dashboard</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportCSV}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportJSON}>
              <FileJson className="w-4 h-4 mr-2" />
              Export as JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={printReport}>
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="p-0 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="border-b px-4 print:hidden overflow-x-auto">
            <TabsList className="h-10">
              <TabsTrigger value="overview" className="text-xs">
                <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="distribution" className="text-xs">
                <PieChart className="w-3.5 h-3.5 mr-1.5" />
                Distribution
              </TabsTrigger>
              <TabsTrigger value="montecarlo" className="text-xs">
                <Target className="w-3.5 h-3.5 mr-1.5" />
                Monte Carlo
              </TabsTrigger>
              <TabsTrigger value="trends" className="text-xs">
                <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                Trends
              </TabsTrigger>
              <TabsTrigger value="statistics" className="text-xs">
                <Activity className="w-3.5 h-3.5 mr-1.5" />
                Statistics
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs">
                <History className="w-3.5 h-3.5 mr-1.5" />
                History
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-4 overflow-y-auto max-h-[calc(100vh-280px)]">
            <TabsContent value="overview" className="mt-0 space-y-6">
              {/* Quick stats */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{aggregatedResults.averageYield}</p>
                  <p className="text-xs text-muted-foreground">Avg Yield (t/ha)</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{aggregatedResults.minYield}</p>
                  <p className="text-xs text-muted-foreground">Min Yield</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{aggregatedResults.maxYield}</p>
                  <p className="text-xs text-muted-foreground">Max Yield</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${
                  aggregatedResults.lowYieldPercent > 30 ? "bg-destructive/10" : "bg-muted"
                }`}>
                  <p className={`text-2xl font-bold ${
                    aggregatedResults.lowYieldPercent > 30 ? "text-destructive" : ""
                  }`}>
                    {aggregatedResults.lowYieldPercent}%
                  </p>
                  <p className="text-xs text-muted-foreground">Low Yield Risk</p>
                </div>
              </div>

              <RainfallImpactChart results={results} />
              
              {results.length === 1 && <SeasonalTrendChart results={results} />}
            </TabsContent>

            <TabsContent value="distribution" className="mt-0 space-y-6">
              <YieldDistributionChart results={results} />
              <CumulativeProbabilityChart results={results} />
            </TabsContent>

            <TabsContent value="montecarlo" className="mt-0">
              <MonteCarloAnalysis results={results} />
            </TabsContent>

            <TabsContent value="trends" className="mt-0 space-y-6">
              {results.length === 1 ? (
                <SeasonalTrendChart results={results} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Run a single scenario to see seasonal trends</p>
                  <p className="text-xs mt-1">
                    Multi-scenario comparison shows aggregate data only
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="statistics" className="mt-0">
              <StatisticalSummary results={results} />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <HistoricalComparison
                savedSimulations={savedSimulations}
                selectedForComparison={selectedForComparison}
                currentResults={results}
                currentConfig={config}
                currentAggregated={aggregatedResults}
                onSave={onSaveSimulation}
                onDelete={onDeleteSimulation}
                onRename={onRenameSimulation}
                onToggleComparison={onToggleComparison}
                onClearComparison={onClearComparison}
                onClearHistory={onClearHistory}
              />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
