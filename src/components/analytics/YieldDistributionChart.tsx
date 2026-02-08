import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { SimulationRun } from "@/types/simulation";

interface YieldDistributionChartProps {
  results: SimulationRun[];
}

export function YieldDistributionChart({ results }: YieldDistributionChartProps) {
  // Create yield distribution bins
  const allYields = results.flatMap((r) => r.seasons.map((s) => s.yield));
  
  const bins = [
    { range: "0-1", min: 0, max: 1, count: 0 },
    { range: "1-2", min: 1, max: 2, count: 0 },
    { range: "2-3", min: 2, max: 3, count: 0 },
    { range: "3-4", min: 3, max: 4, count: 0 },
    { range: "4-5", min: 4, max: 5, count: 0 },
  ];

  allYields.forEach((y) => {
    const bin = bins.find((b) => y >= b.min && y < b.max) || bins[bins.length - 1];
    bin.count++;
  });

  const total = allYields.length;
  const data = bins.map((b) => ({
    range: b.range,
    count: b.count,
    percentage: total > 0 ? Math.round((b.count / total) * 100) : 0,
  }));

  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm">Yield Distribution</h4>
      <p className="text-xs text-muted-foreground">
        Frequency of yield outcomes across all seasons
      </p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="range"
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              label={{ value: "Yield (t/ha)", position: "bottom", fontSize: 10 }}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              label={{ value: "Frequency", angle: -90, position: "insideLeft", fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number, name: string) => [
                name === "count" ? `${value} seasons` : `${value}%`,
                name === "count" ? "Count" : "Percentage",
              ]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.range === "2-3"
                      ? "hsl(var(--destructive))"
                      : entry.range === "4-5"
                      ? "hsl(var(--primary))"
                      : "hsl(var(--muted-foreground) / 0.5)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
