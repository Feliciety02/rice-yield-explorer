import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { SimulationRun, RainfallLevel } from "@/types/simulation";

interface SeasonalTrendChartProps {
  results: SimulationRun[];
}

const RAINFALL_COLORS: Record<RainfallLevel, string> = {
  low: "hsl(var(--chart-1))",
  normal: "hsl(var(--primary))",
  high: "hsl(var(--chart-2))",
};

export function SeasonalTrendChart({ results }: SeasonalTrendChartProps) {
  if (results.length === 0) return null;

  const firstRun = results[0];
  
  // Calculate running average
  let runningSum = 0;
  const data = firstRun.seasons.map((season, idx) => {
    runningSum += season.yield;
    const runningAvg = runningSum / (idx + 1);
    
    return {
      season: `S${season.seasonIndex + 1}`,
      yield: season.yield,
      rainfall: season.rainfall,
      runningAvg: Math.round(runningAvg * 100) / 100,
      color: RAINFALL_COLORS[season.rainfall],
    };
  });

  // Trend line calculation (simple linear regression)
  const n = data.length;
  const xMean = (n + 1) / 2;
  const yMean = data.reduce((acc, d) => acc + d.yield, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  data.forEach((d, i) => {
    const x = i + 1;
    numerator += (x - xMean) * (d.yield - yMean);
    denominator += Math.pow(x - xMean, 2);
  });
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;
  
  const trendData = data.map((d, i) => ({
    ...d,
    trend: Math.round((intercept + slope * (i + 1)) * 100) / 100,
  }));

  const trendDirection = slope > 0.05 ? "improving" : slope < -0.05 ? "declining" : "stable";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-sm">Seasonal Trend Analysis</h4>
          <p className="text-xs text-muted-foreground">
            Yield progression with running average and trend
          </p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            trendDirection === "improving"
              ? "bg-primary/20 text-primary"
              : trendDirection === "declining"
              ? "bg-destructive/20 text-destructive"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {trendDirection === "improving" ? "↑" : trendDirection === "declining" ? "↓" : "→"}{" "}
          {trendDirection}
        </span>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="season"
              tick={{ fontSize: 10 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              domain={[0, 5]}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              label={{ value: "Yield (t/ha)", angle: -90, position: "insideLeft", fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number, name: string) => [
                `${value} t/ha`,
                name === "yield" ? "Yield" : name === "runningAvg" ? "Running Avg" : "Trend",
              ]}
              labelFormatter={(label, payload) => {
                const rainfall = payload?.[0]?.payload?.rainfall;
                return `${label} - ${rainfall ? rainfall.charAt(0).toUpperCase() + rainfall.slice(1) : ""} Rainfall`;
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 10 }}
              formatter={(value) =>
                value === "yield" ? "Season Yield" : value === "runningAvg" ? "Running Avg" : "Trend Line"
              }
            />
            <ReferenceLine
              y={yMean}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              label={{ value: "Mean", fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            />
            <Bar dataKey="yield" fill="hsl(var(--primary) / 0.6)" radius={[4, 4, 0, 0]} />
            <Line
              type="monotone"
              dataKey="runningAvg"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="linear"
              dataKey="trend"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="text-xs text-muted-foreground">
        <strong className="text-foreground">Trend coefficient:</strong> {slope.toFixed(3)} t/ha per season
        {Math.abs(slope) > 0.05 && (
          <span>
            {" "}— Yields are {slope > 0 ? "increasing" : "decreasing"} by approximately{" "}
            {Math.abs(slope * 10).toFixed(2)} t/ha over 10 seasons.
          </span>
        )}
      </div>
    </div>
  );
}
