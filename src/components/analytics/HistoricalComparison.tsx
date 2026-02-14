import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { SavedSimulation, SCENARIOS, SimulationRun, SimulationConfig } from "@/types/simulation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  History,
  Save,
  Trash2,
  GitCompare,
  X,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Check,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface HistoricalComparisonProps {
  savedSimulations: SavedSimulation[];
  selectedForComparison: string[];
  comparisonSimulations: SavedSimulation[];
  isLoading: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onLoadNextPage: () => void;
  onLoadPrevPage: () => void;
  onRefresh: () => void;
  currentResults: SimulationRun[];
  currentConfig: SimulationConfig;
  currentAggregated: {
    averageYield: number;
    minYield: number;
    maxYield: number;
    yieldVariability: "low" | "medium" | "high";
    lowYieldPercent: number;
  } | null;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onToggleComparison: (id: string) => void;
  onClearComparison: () => void;
  onClearHistory: () => void;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
];

export function HistoricalComparison({
  savedSimulations,
  selectedForComparison,
  comparisonSimulations,
  isLoading,
  totalCount,
  currentPage,
  totalPages,
  onLoadNextPage,
  onLoadPrevPage,
  onRefresh,
  currentResults,
  currentConfig,
  currentAggregated,
  onSave,
  onDelete,
  onRename,
  onToggleComparison,
  onClearComparison,
  onClearHistory,
}: HistoricalComparisonProps) {
  const [saveName, setSaveName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleSave = () => {
    if (saveName.trim() && currentResults.length > 0) {
      onSave(saveName.trim());
      setSaveName("");
    }
  };

  const handleStartEdit = (sim: SavedSimulation) => {
    setEditingId(sim.id);
    setEditName(sim.name);
  };

  const handleFinishEdit = () => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName("");
  };

  // Prepare comparison chart data
  const comparisonData = comparisonSimulations.map((sim, idx) => ({
    name: sim.name.length > 12 ? sim.name.slice(0, 12) + "..." : sim.name,
    fullName: sim.name,
    avgYield: sim.aggregatedResults.averageYield,
    minYield: sim.aggregatedResults.minYield,
    maxYield: sim.aggregatedResults.maxYield,
    lowRisk: sim.aggregatedResults.lowYieldPercent,
    color: CHART_COLORS[idx % CHART_COLORS.length],
  }));

  // Radar chart data for multi-dimensional comparison
  const radarData = [
    {
      metric: "Avg Yield",
      ...Object.fromEntries(
        comparisonSimulations.map((sim) => [
          sim.id,
          (sim.aggregatedResults.averageYield / 4) * 100,
        ])
      ),
    },
    {
      metric: "Min Yield",
      ...Object.fromEntries(
        comparisonSimulations.map((sim) => [
          sim.id,
          (sim.aggregatedResults.minYield / 4) * 100,
        ])
      ),
    },
    {
      metric: "Max Yield",
      ...Object.fromEntries(
        comparisonSimulations.map((sim) => [
          sim.id,
          (sim.aggregatedResults.maxYield / 4) * 100,
        ])
      ),
    },
    {
      metric: "Stability",
      ...Object.fromEntries(
        comparisonSimulations.map((sim) => [
          sim.id,
          100 - sim.aggregatedResults.lowYieldPercent,
        ])
      ),
    },
    {
      metric: "Consistency",
      ...Object.fromEntries(
        comparisonSimulations.map((sim) => [
          sim.id,
          sim.aggregatedResults.yieldVariability === "low"
            ? 100
            : sim.aggregatedResults.yieldVariability === "medium"
            ? 60
            : 30,
        ])
      ),
    },
  ];

  // Timeline data for yield trends
  const timelineData = savedSimulations
    .slice()
    .reverse()
    .map((sim, idx) => ({
      index: idx + 1,
      name: sim.name,
      avgYield: sim.aggregatedResults.averageYield,
      timestamp: new Date(sim.timestamp).toLocaleDateString(),
    }));

  return (
    <div className="space-y-6">
      {/* Save Current Simulation */}
      {currentResults.length > 0 && currentAggregated && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Current Simulation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter a name for this simulation..."
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="flex-1"
              />
              <Button onClick={handleSave} disabled={!saveName.trim() || isLoading}>
                Save
              </Button>
            </div>
            <div className="mt-2 flex gap-2 flex-wrap text-xs text-muted-foreground">
              <span>
                Scenario:{" "}
                {SCENARIOS.find((s) => s.id === currentConfig.scenarioId)?.name}
              </span>
              <span>•</span>
              <span>Avg: {currentAggregated.averageYield} t/ha</span>
              <span>•</span>
              <span>Risk: {currentAggregated.lowYieldPercent}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Simulations List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="w-4 h-4" />
              Saved Simulations ({totalCount})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={onRefresh}
                disabled={isLoading}
              >
                Refresh
              </Button>
              {totalCount > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all saved simulations. This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onClearHistory}>
                        Delete All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && savedSimulations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Loading saved simulations...</p>
            </div>
          ) : savedSimulations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No saved simulations yet</p>
              <p className="text-xs mt-1">
                Run a simulation and save it to compare later
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {savedSimulations.map((sim, idx) => (
                  <div
                    key={sim.id}
                    className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                      selectedForComparison.includes(sim.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox
                      checked={selectedForComparison.includes(sim.id)}
                      onCheckedChange={() => onToggleComparison(sim.id)}
                      aria-label={`Select ${sim.name} for comparison`}
                    />
                    <div className="flex-1 min-w-0">
                      {editingId === sim.id ? (
                        <div className="flex gap-1">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleFinishEdit()
                            }
                            className="h-6 text-sm"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={handleFinishEdit}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {sim.name}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                              onClick={() => handleStartEdit(sim)}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(sim.timestamp).toLocaleDateString()}
                            <span>•</span>
                            <span>{sim.aggregatedResults.averageYield} t/ha</span>
                          </div>
                        </>
                      )}
                    </div>
                    <Badge
                      variant={
                        sim.aggregatedResults.lowYieldPercent > 30
                          ? "destructive"
                          : sim.aggregatedResults.lowYieldPercent > 15
                          ? "secondary"
                          : "default"
                      }
                      className="text-xs"
                    >
                      {sim.aggregatedResults.lowYieldPercent}% risk
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => onDelete(sim.id)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={onLoadPrevPage}
                disabled={currentPage <= 1 || isLoading}
              >
                Previous
              </Button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={onLoadNextPage}
                disabled={currentPage >= totalPages || isLoading}
              >
                Next
              </Button>
            </div>
          )}
          {isLoading && savedSimulations.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">Updating history...</p>
          )}
        </CardContent>
      </Card>

      {/* Comparison View */}
      {comparisonSimulations.length >= 2 && (
        <>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <GitCompare className="w-4 h-4" />
              Comparing {comparisonSimulations.length} Simulations
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearComparison}
              className="h-7 text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Clear Selection
            </Button>
          </div>

          {/* Bar Chart Comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Yield Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 5]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [`${value} t/ha`]}
                      labelFormatter={(label, payload) =>
                        payload?.[0]?.payload?.fullName || label
                      }
                    />
                    <Legend />
                    <Bar
                      dataKey="avgYield"
                      name="Avg Yield"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="minYield"
                      name="Min Yield"
                      fill="hsl(var(--muted-foreground))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="maxYield"
                      name="Max Yield"
                      fill="hsl(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Radar Chart for Multi-dimensional Comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Performance Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid className="stroke-muted" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fontSize: 8 }}
                    />
                    {comparisonSimulations.map((sim, idx) => (
                      <Radar
                        key={sim.id}
                        name={sim.name}
                        dataKey={sim.id}
                        stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                        fill={CHART_COLORS[idx % CHART_COLORS.length]}
                        fillOpacity={0.2}
                      />
                    ))}
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Summary Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Detailed Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Metric</th>
                      {comparisonSimulations.map((sim, idx) => (
                        <th
                          key={sim.id}
                          className="text-center py-2 font-medium"
                          style={{ color: CHART_COLORS[idx] }}
                        >
                          {sim.name.length > 10
                            ? sim.name.slice(0, 10) + "..."
                            : sim.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 text-muted-foreground">Avg Yield</td>
                      {comparisonSimulations.map((sim) => (
                        <td key={sim.id} className="text-center py-2 font-mono">
                          {sim.aggregatedResults.averageYield} t/ha
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-muted-foreground">Yield Range</td>
                      {comparisonSimulations.map((sim) => (
                        <td key={sim.id} className="text-center py-2 font-mono">
                          {sim.aggregatedResults.minYield} -{" "}
                          {sim.aggregatedResults.maxYield}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-muted-foreground">Low Yield Risk</td>
                      {comparisonSimulations.map((sim) => (
                        <td key={sim.id} className="text-center py-2">
                          <Badge
                            variant={
                              sim.aggregatedResults.lowYieldPercent > 30
                                ? "destructive"
                                : sim.aggregatedResults.lowYieldPercent > 15
                                ? "secondary"
                                : "default"
                            }
                          >
                            {sim.aggregatedResults.lowYieldPercent}%
                          </Badge>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 text-muted-foreground">Variability</td>
                      {comparisonSimulations.map((sim) => (
                        <td key={sim.id} className="text-center py-2 capitalize">
                          {sim.aggregatedResults.yieldVariability}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Historical Trend */}
      {savedSimulations.length >= 3 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Historical Yield Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="index" tick={{ fontSize: 10 }} label={{ value: "Run #", position: "bottom", fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 5]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`${value} t/ha`, "Avg Yield"]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.name || ""
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="avgYield"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Average yield across {savedSimulations.length} loaded simulations
            </p>
          </CardContent>
        </Card>
      )}

      {comparisonSimulations.length === 1 && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          <GitCompare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Select at least 2 simulations to compare</p>
        </div>
      )}
    </div>
  );
}
