import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { SimulationRun, RainfallLevel } from "@/types/simulation";
import { CloudRain, Sun, CloudSun } from "lucide-react";

interface RainfallImpactChartProps {
  results: SimulationRun[];
}

const RAINFALL_CONFIG: Record<RainfallLevel, { label: string; color: string; icon: typeof Sun }> = {
  low: { label: "Low (Drought)", color: "hsl(var(--chart-1))", icon: Sun },
  normal: { label: "Normal", color: "hsl(var(--primary))", icon: CloudSun },
  high: { label: "High (Flood)", color: "hsl(var(--chart-2))", icon: CloudRain },
};

export function RainfallImpactChart({ results }: RainfallImpactChartProps) {
  const allSeasons = results.flatMap((r) => r.seasons);
  
  const rainfallStats = (["low", "normal", "high"] as RainfallLevel[]).map((level) => {
    const seasons = allSeasons.filter((s) => s.rainfall === level);
    const count = seasons.length;
    const avgYield = count > 0 
      ? seasons.reduce((acc, s) => acc + s.yield, 0) / count 
      : 0;
    const percentage = allSeasons.length > 0 
      ? (count / allSeasons.length) * 100 
      : 0;

    return {
      rainfall: level,
      label: RAINFALL_CONFIG[level].label,
      count,
      avgYield: Math.round(avgYield * 100) / 100,
      percentage: Math.round(percentage),
      color: RAINFALL_CONFIG[level].color,
    };
  });

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-sm">Rainfall Impact Analysis</h4>
        <p className="text-xs text-muted-foreground">
          How different rainfall conditions affect yield
        </p>
      </div>

      {/* Rainfall frequency cards */}
      <div className="grid grid-cols-3 gap-2">
        {rainfallStats.map((stat) => {
          const Icon = RAINFALL_CONFIG[stat.rainfall].icon;
          return (
            <div
              key={stat.rainfall}
              className="bg-muted/30 rounded-lg p-2 text-center space-y-1"
            >
              <Icon className="w-4 h-4 mx-auto text-muted-foreground" />
              <p className="text-lg font-bold">{stat.percentage}%</p>
              <p className="text-[10px] text-muted-foreground capitalize">
                {stat.rainfall}
              </p>
            </div>
          );
        })}
      </div>

      {/* Yield by rainfall bar chart */}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rainfallStats} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 5]}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 10 }}
              stroke="hsl(var(--muted-foreground))"
              width={80}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [`${value} t/ha`, "Avg Yield"]}
            />
            <Bar dataKey="avgYield" radius={[0, 4, 4, 0]}>
              {rainfallStats.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList
                dataKey="avgYield"
                position="right"
                formatter={(value: number) => `${value} t/ha`}
                style={{ fontSize: 10, fill: "hsl(var(--foreground))" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Impact summary */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          <strong className="text-foreground">Yield Gap:</strong>{" "}
          {(() => {
            const normal = rainfallStats.find((s) => s.rainfall === "normal")?.avgYield || 0;
            const low = rainfallStats.find((s) => s.rainfall === "low")?.avgYield || 0;
            const high = rainfallStats.find((s) => s.rainfall === "high")?.avgYield || 0;
            const droughtLoss = normal - low;
            const floodLoss = normal - high;
            return `Drought reduces yield by ${droughtLoss.toFixed(1)} t/ha, flooding by ${floodLoss.toFixed(1)} t/ha compared to normal conditions.`;
          })()}
        </p>
      </div>
    </div>
  );
}
