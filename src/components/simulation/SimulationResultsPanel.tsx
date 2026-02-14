import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AggregatedResults,
  ComparisonScenario,
  ReplicationSummary,
  SimulationRun,
} from "@/types/simulation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScenarioData } from "@/context/scenario-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SimulationResultsPanelProps {
  results: SimulationRun[];
  aggregatedResults: AggregatedResults | null;
  replicationResults: ReplicationSummary[];
  comparisonResults: ComparisonScenario[];
  isRunning?: boolean;
}

export function SimulationResultsPanel({
  results,
  aggregatedResults,
  replicationResults,
  comparisonResults,
  isRunning = false,
}: SimulationResultsPanelProps) {
  const { scenarios } = useScenarioData();
  const hasComparison = comparisonResults.length > 0;

  if (isRunning && (!aggregatedResults || results.length === 0) && !hasComparison) {
    return (
      <Card className="panel h-full">
        <CardHeader className="panel-header">
          <h3 className="font-serif text-lg">Results & Analysis</h3>
        </CardHeader>
        <CardContent className="p-4 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={`metric-skeleton-${idx}`} className="metric-card">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasComparison) {
    const comparisonData = comparisonResults.map((scenario) => {
      const name = scenarios.find((s) => s.key === scenario.scenario)?.name ?? scenario.scenario;
      return {
        name,
        averageYield: scenario.overall.averageYield,
        minYield: scenario.overall.minYield,
        maxYield: scenario.overall.maxYield,
        sdYield: scenario.overall.sdYield,
        lowYieldPercent: scenario.overall.lowYieldPercent,
      };
    });

    return (
      <Card className="panel h-full overflow-hidden">
        <CardHeader className="panel-header">
          <h3 className="font-serif text-lg">Scenario Comparison</h3>
        </CardHeader>
        <CardContent className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Average Yield by Scenario</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="averageYield" radius={[4, 4, 0, 0]}>
                    {comparisonData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? "hsl(var(--primary))" : `hsl(var(--primary) / ${0.7 - index * 0.08})`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Scenario Metrics</h4>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scenario</TableHead>
                    <TableHead className="text-right">Mean</TableHead>
                    <TableHead className="text-right">SD</TableHead>
                    <TableHead className="text-right">Min</TableHead>
                    <TableHead className="text-right">Max</TableHead>
                    <TableHead className="text-right">Low Yield</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonResults.map((scenario) => {
                    const name = scenarios.find((s) => s.key === scenario.scenario)?.name ?? scenario.scenario;
                    return (
                      <TableRow key={scenario.scenario}>
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell className="text-right">{scenario.overall.averageYield}</TableCell>
                        <TableCell className="text-right">{scenario.overall.sdYield}</TableCell>
                        <TableCell className="text-right">{scenario.overall.minYield}</TableCell>
                        <TableCell className="text-right">{scenario.overall.maxYield}</TableCell>
                        <TableCell className="text-right">{scenario.overall.lowYieldPercent}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!aggregatedResults || results.length === 0) {
    return (
      <Card className="panel h-full">
        <CardHeader className="panel-header">
          <h3 className="font-serif text-lg">Results & Analysis</h3>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <p className="text-muted-foreground text-center">
            Run a simulation to see results
          </p>
        </CardContent>
      </Card>
    );
  }

  const firstRun = results[0];
  const seasonData = firstRun.seasons.map((s) => ({
    season: `S${s.seasonIndex + 1}`,
    yield: s.yield,
    rainfall: s.rainfall,
  }));

  const exportCSV = () => {
    const headers = ["Season", "Rainfall", "Yield (t/ha)"];
    const rows = firstRun.seasons.map((s) => [
      s.seasonIndex + 1,
      s.rainfall,
      s.yield,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rice_simulation_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="panel h-full overflow-hidden">
      <CardHeader className="panel-header flex flex-row items-center justify-between">
        <h3 className="font-serif text-lg">Results & Analysis</h3>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <div className="metric-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Mean Yield</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {aggregatedResults.averageYield} <span className="text-sm font-normal">t/ha</span>
            </p>
          </div>

          <div className="metric-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-xs">Std. Dev.</span>
            </div>
            <p className="text-2xl font-bold">
              {aggregatedResults.sdYield} <span className="text-sm font-normal">t/ha</span>
            </p>
          </div>

          <div className="metric-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xs">Min Yield</span>
            </div>
            <p className="text-2xl font-bold">
              {aggregatedResults.minYield} <span className="text-sm font-normal">t/ha</span>
            </p>
          </div>

          <div className="metric-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Max Yield</span>
            </div>
            <p className="text-2xl font-bold">
              {aggregatedResults.maxYield} <span className="text-sm font-normal">t/ha</span>
            </p>
          </div>

          <div className="metric-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs">Low Yield Rate</span>
            </div>
            <p className="text-2xl font-bold text-destructive">
              {aggregatedResults.lowYieldPercent}%
            </p>
          </div>
        </div>

        {firstRun.seasons.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Yield by Season</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={seasonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="season" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="yield"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {replicationResults.length > 1 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Replication Summary</h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={replicationResults}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="replication" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [`${value} t/ha`, "Mean Yield"]}
                  />
                  <Bar dataKey="averageYield" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Replication</TableHead>
                    <TableHead className="text-right">Mean</TableHead>
                    <TableHead className="text-right">SD</TableHead>
                    <TableHead className="text-right">Min</TableHead>
                    <TableHead className="text-right">Max</TableHead>
                    <TableHead className="text-right">Low Yield</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {replicationResults.map((rep) => (
                    <TableRow key={rep.replication}>
                      <TableCell className="font-medium">{rep.replication}</TableCell>
                      <TableCell className="text-right">{rep.averageYield}</TableCell>
                      <TableCell className="text-right">{rep.sdYield}</TableCell>
                      <TableCell className="text-right">{rep.minYield}</TableCell>
                      <TableCell className="text-right">{rep.maxYield}</TableCell>
                      <TableCell className="text-right">{rep.lowYieldPercent}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SimulationResultsPanel;
