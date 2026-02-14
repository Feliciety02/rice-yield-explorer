 import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SimulationRun } from "@/types/simulation";
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
   aggregatedResults: {
     averageYield: number;
     minYield: number;
     maxYield: number;
     yieldVariability: "low" | "medium" | "high";
     lowYieldPercent: number;
   } | null;
  isRunning?: boolean;
 }
 
export function SimulationResultsPanel({
  results,
  aggregatedResults,
  isRunning = false,
}: SimulationResultsPanelProps) {
  const { scenarios } = useScenarioData();
  if (isRunning && (!aggregatedResults || results.length === 0)) {
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
 
  const comparisonData = results.map((r) => {
    const scenario = scenarios.find((s) => s.id === r.scenarioId);
    return {
      name: scenario?.name.split(" ")[0] || `Scenario ${r.scenarioId}`,
      fullName: scenario?.name || `Scenario ${r.scenarioId}`,
      averageYield: r.averageYield,
      minYield: r.minYield,
       maxYield: r.maxYield,
     };
   });
 
   const variabilityColor = {
     low: "text-primary",
     medium: "text-secondary-foreground",
     high: "text-destructive",
   };
 
  const exportCSV = () => {
    const headers = ["Scenario", "Season", "Rainfall", "Yield (t/ha)"];
    const rows = results.flatMap((r) => {
      const scenario = scenarios.find((s) => s.id === r.scenarioId)?.name || `Scenario ${r.scenarioId}`;
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
         {/* Metric Cards */}
         <div className="grid grid-cols-2 gap-3">
           <div className="metric-card">
             <div className="flex items-center gap-2 text-muted-foreground mb-1">
               <TrendingUp className="w-4 h-4" />
               <span className="text-xs">Average Yield</span>
             </div>
             <p className="text-2xl font-bold text-primary">
               {aggregatedResults.averageYield} <span className="text-sm font-normal">t/ha</span>
             </p>
           </div>
 
           <div className="metric-card">
             <div className="flex items-center gap-2 text-muted-foreground mb-1">
               <TrendingDown className="w-4 h-4" />
               <span className="text-xs">Min / Max Yield</span>
             </div>
             <p className="text-2xl font-bold">
               {aggregatedResults.minYield} - {aggregatedResults.maxYield}{" "}
               <span className="text-sm font-normal">t/ha</span>
             </p>
           </div>
 
           <div className="metric-card">
             <div className="flex items-center gap-2 text-muted-foreground mb-1">
               <Activity className="w-4 h-4" />
               <span className="text-xs">Yield Variability</span>
             </div>
             <p className={`text-2xl font-bold capitalize ${variabilityColor[aggregatedResults.yieldVariability]}`}>
               {aggregatedResults.yieldVariability}
             </p>
           </div>
 
           <div className="metric-card">
             <div className="flex items-center gap-2 text-muted-foreground mb-1">
               <AlertTriangle className="w-4 h-4" />
               <span className="text-xs">Low Yield Seasons</span>
             </div>
             <p className="text-2xl font-bold text-destructive">
               {aggregatedResults.lowYieldPercent}%
             </p>
           </div>
         </div>
 
         {/* Yield by Season Chart */}
         {results.length === 1 && (
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
 
         {/* Scenario Comparison Chart */}
         {results.length > 1 && (
           <div className="space-y-2">
             <h4 className="font-semibold text-sm">Scenario Comparison</h4>
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
                     labelFormatter={(_, payload) => payload[0]?.payload?.fullName || ""}
                   />
                   <Bar dataKey="averageYield" radius={[4, 4, 0, 0]}>
                     {comparisonData.map((_, index) => (
                       <Cell
                         key={`cell-${index}`}
                         fill={index === 0 ? "hsl(var(--primary))" : `hsl(var(--primary) / ${0.7 - index * 0.1})`}
                       />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
           </div>
         )}
 
         {/* Results Table */}
         <div className="space-y-2">
           <h4 className="font-semibold text-sm">Detailed Results</h4>
           <div className="border rounded-lg overflow-hidden">
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Scenario</TableHead>
                   <TableHead className="text-right">Avg Yield</TableHead>
                   <TableHead className="text-right">Min</TableHead>
                   <TableHead className="text-right">Max</TableHead>
                   <TableHead className="text-right">Low %</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                {results.map((r) => {
                  const scenario = scenarios.find((s) => s.id === r.scenarioId);
                  return (
                    <TableRow key={r.scenarioId}>
                      <TableCell className="font-medium">
                        {scenario?.name || `Scenario ${r.scenarioId}`}
                       </TableCell>
                       <TableCell className="text-right">{r.averageYield} t/ha</TableCell>
                       <TableCell className="text-right">{r.minYield} t/ha</TableCell>
                       <TableCell className="text-right">{r.maxYield} t/ha</TableCell>
                       <TableCell className="text-right">{r.lowYieldPercent}%</TableCell>
                     </TableRow>
                   );
                 })}
               </TableBody>
             </Table>
           </div>
         </div>
 
         {/* Risk Insight */}
         {results.length > 1 && (
           <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
             <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
               <Activity className="w-4 h-4 text-primary" />
               Risk Insight
             </h4>
             <p className="text-sm text-muted-foreground">
               {(() => {
                 const sorted = [...results].sort((a, b) => b.averageYield - a.averageYield);
                 const best = scenarios.find((s) => s.id === sorted[0].scenarioId);
                 const mostStable = [...results].sort(
                   (a, b) => a.lowYieldPercent - b.lowYieldPercent
                 )[0];
                 const stableScenario = scenarios.find((s) => s.id === mostStable.scenarioId);
                 return (
                   <>
                     <strong>{best?.name}</strong> produces the highest average yield ({sorted[0].averageYield} t/ha),
                     while <strong>{stableScenario?.name}</strong> offers the most stable outcomes with only {mostStable.lowYieldPercent}% low-yield seasons.
                   </>
                 );
               })()}
             </p>
           </div>
         )}
       </CardContent>
     </Card>
   );
 }
 
 export default SimulationResultsPanel;
