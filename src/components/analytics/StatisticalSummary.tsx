import { SimulationRun } from "@/types/simulation";
import { Calculator, Sigma, TrendingUp, BarChart3 } from "lucide-react";

interface StatisticalSummaryProps {
  results: SimulationRun[];
}

export function StatisticalSummary({ results }: StatisticalSummaryProps) {
  const allYields = results.flatMap((r) => r.seasons.map((s) => s.yield));
  const n = allYields.length;

  if (n === 0) return null;

  // Calculate statistics
  const mean = allYields.reduce((a, b) => a + b, 0) / n;
  const variance = allYields.reduce((acc, y) => acc + Math.pow(y - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / mean) * 100;

  // Sorted for percentiles
  const sorted = [...allYields].sort((a, b) => a - b);
  const median = n % 2 === 0 
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 
    : sorted[Math.floor(n / 2)];

  // Mode (most frequent yield)
  const yieldCounts = allYields.reduce((acc, y) => {
    acc[y] = (acc[y] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  const mode = Object.entries(yieldCounts).sort((a, b) => b[1] - a[1])[0][0];

  // Skewness
  const skewness = allYields.reduce((acc, y) => acc + Math.pow((y - mean) / stdDev, 3), 0) / n;

  // Risk metrics
  const belowThreshold = allYields.filter((y) => y < 3).length;
  const riskRatio = (belowThreshold / n) * 100;

  // Expected shortfall (average of worst 10%)
  const worstCount = Math.max(1, Math.floor(n * 0.1));
  const expectedShortfall = sorted.slice(0, worstCount).reduce((a, b) => a + b, 0) / worstCount;

  const stats = [
    {
      icon: Calculator,
      label: "Mean",
      value: mean.toFixed(2),
      unit: "t/ha",
      description: "Average yield across all seasons",
    },
    {
      icon: BarChart3,
      label: "Median",
      value: median.toFixed(2),
      unit: "t/ha",
      description: "Middle value of yield distribution",
    },
    {
      icon: Sigma,
      label: "Std Deviation",
      value: stdDev.toFixed(2),
      unit: "t/ha",
      description: "Measure of yield variability",
    },
    {
      icon: TrendingUp,
      label: "CV",
      value: cv.toFixed(1),
      unit: "%",
      description: "Coefficient of variation (risk indicator)",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-sm">Statistical Summary</h4>
        <p className="text-xs text-muted-foreground">
          Detailed statistical analysis of simulation outcomes
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-muted/30 rounded-lg p-3 space-y-1"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <stat.icon className="w-3.5 h-3.5" />
              <span className="text-xs">{stat.label}</span>
            </div>
            <p className="text-lg font-semibold">
              {stat.value}
              <span className="text-xs font-normal text-muted-foreground ml-1">
                {stat.unit}
              </span>
            </p>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 space-y-3">
        <h5 className="text-sm font-medium">Risk Metrics</h5>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Below-target risk ({"<"}3 t/ha)</span>
            <span className={riskRatio > 30 ? "text-destructive font-medium" : "font-medium"}>
              {riskRatio.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                riskRatio > 30 ? "bg-destructive" : "bg-primary"
              }`}
              style={{ width: `${Math.min(riskRatio, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Expected Shortfall (worst 10%)</span>
          <span className="font-medium">{expectedShortfall.toFixed(2)} t/ha</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Mode (most common yield)</span>
          <span className="font-medium">{mode} t/ha</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Skewness</span>
          <span className="font-medium">
            {skewness > 0 ? "+" : ""}{skewness.toFixed(2)}
            <span className="text-xs text-muted-foreground ml-1">
              ({skewness > 0.5 ? "Right-skewed" : skewness < -0.5 ? "Left-skewed" : "Symmetric"})
            </span>
          </span>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-muted-foreground">
        <strong className="text-foreground">Interpretation:</strong>{" "}
        {cv < 15
          ? "Low variability indicates stable, predictable yields across seasons."
          : cv < 30
          ? "Moderate variability suggests some seasonal fluctuation in yields."
          : "High variability indicates significant risk and unpredictable outcomes."}
        {riskRatio > 30 && " Consider drought-resistant varieties or irrigation to reduce below-target risk."}
      </div>
    </div>
  );
}
