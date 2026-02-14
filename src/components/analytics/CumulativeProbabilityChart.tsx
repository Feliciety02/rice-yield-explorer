import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { SimulationRun } from "@/types/simulation";

interface CumulativeProbabilityChartProps {
  results: SimulationRun[];
}

export function CumulativeProbabilityChart({ results }: CumulativeProbabilityChartProps) {
  const allYields = results.flatMap((r) => r.seasons.map((s) => s.yield)).sort((a, b) => a - b);
  const total = allYields.length;

  if (total === 0) return null;

  // Create CDF data points
  const yieldLevels = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  const data = yieldLevels.map((threshold) => {
    const belowCount = allYields.filter((y) => y <= threshold).length;
    return {
      yield: threshold,
      probability: Math.round((belowCount / total) * 100),
    };
  });

  // Calculate key percentiles
  const p25Index = Math.floor(total * 0.25);
  const p50Index = Math.floor(total * 0.5);
  const p75Index = Math.floor(total * 0.75);

  const percentiles = {
    p25: allYields[p25Index] || 0,
    p50: allYields[p50Index] || 0,
    p75: allYields[p75Index] || 0,
  };

  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm">Cumulative Probability</h4>
      <p className="text-xs text-muted-foreground">
        Probability of achieving at least a given yield
      </p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="probabilityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="yield"
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              label={{ value: "Yield Threshold (t/ha)", position: "bottom", fontSize: 10 }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              label={{ value: "Probability (%)", angle: -90, position: "insideLeft", fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [`${value}%`, "P(Yield <= X)"]}
              labelFormatter={(label) => `Yield <= ${label} t/ha`}
            />
            <ReferenceLine
              x={percentiles.p50}
              stroke="hsl(var(--primary))"
              strokeDasharray="5 5"
              label={{ value: "Median", fontSize: 9, fill: "hsl(var(--primary))" }}
            />
            <Area
              type="monotone"
              dataKey="probability"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#probabilityGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground px-2">
        <span>25th: {percentiles.p25} t/ha</span>
        <span>50th: {percentiles.p50} t/ha</span>
        <span>75th: {percentiles.p75} t/ha</span>
      </div>
    </div>
  );
}
