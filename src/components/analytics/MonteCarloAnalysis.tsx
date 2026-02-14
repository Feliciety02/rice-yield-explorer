import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimulationRun } from "@/types/simulation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";
import { Target, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useScenarioData } from "@/context/scenario-data";

interface MonteCarloAnalysisProps {
  results: SimulationRun[];
}

interface ConfidenceInterval {
  lower: number;
  upper: number;
  mean: number;
  level: number;
}

interface ScenarioProbability {
  scenario: string;
  probability: number;
  expectedYield: number;
  riskScore: number;
  color: string;
}

export function MonteCarloAnalysis({ results }: MonteCarloAnalysisProps) {
  const { scenarios } = useScenarioData();
  const analysis = useMemo(() => {
    if (results.length === 0) return null;

    // Collect all yields
    const allYields = results.flatMap((r) => r.seasons.map((s) => s.yield));
    const sortedYields = [...allYields].sort((a, b) => a - b);
    const n = sortedYields.length;

    if (n === 0) return null;

    // Calculate mean and standard deviation
    const mean = allYields.reduce((sum, y) => sum + y, 0) / n;
    const variance = allYields.reduce((sum, y) => sum + Math.pow(y - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Calculate confidence intervals
    const getPercentile = (p: number) => {
      const index = Math.floor(p * n);
      return sortedYields[Math.min(index, n - 1)];
    };

    const confidenceIntervals: ConfidenceInterval[] = [
      {
        level: 50,
        lower: getPercentile(0.25),
        upper: getPercentile(0.75),
        mean,
      },
      {
        level: 80,
        lower: getPercentile(0.10),
        upper: getPercentile(0.90),
        mean,
      },
      {
        level: 95,
        lower: getPercentile(0.025),
        upper: getPercentile(0.975),
        mean,
      },
    ];

    // Generate probability density data (kernel density estimation approximation)
    const numBins = 30;
    const minYield = sortedYields[0];
    const maxYield = sortedYields[n - 1];
    const range = maxYield - minYield || 1;
    const binWidth = range / numBins;

    const densityData = Array.from({ length: numBins }, (_, i) => {
      const binStart = minYield + i * binWidth;
      const binEnd = binStart + binWidth;
      const binCenter = (binStart + binEnd) / 2;
      const count = allYields.filter((y) => y >= binStart && y < binEnd).length;
      const density = count / n;

      // Calculate confidence band values
      const ci50 = binCenter >= confidenceIntervals[0].lower && binCenter <= confidenceIntervals[0].upper;
      const ci80 = binCenter >= confidenceIntervals[1].lower && binCenter <= confidenceIntervals[1].upper;
      const ci95 = binCenter >= confidenceIntervals[2].lower && binCenter <= confidenceIntervals[2].upper;

      return {
        yield: binCenter.toFixed(2),
        density: density * 100,
        ci50: ci50 ? density * 100 : 0,
        ci80: ci80 && !ci50 ? density * 100 : 0,
        ci95: ci95 && !ci80 ? density * 100 : 0,
        outside: !ci95 ? density * 100 : 0,
      };
    });

    // Scenario probability analysis
    const scenarioColors = [
      "hsl(var(--primary))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))",
    ];

    const scenarioProbabilities: ScenarioProbability[] = results.map((r, idx) => {
      const scenario = scenarios.find((s) => s.key === r.scenarioKey);
      const seasonYields = r.seasons.map((s) => s.yield);
      const avgYield = seasonYields.reduce((a, b) => a + b, 0) / seasonYields.length;
      
      // Risk score: lower is better (based on low yield percentage and variability)
      const riskScore = r.lowYieldPercent / 100 + (r.yieldVariability === "high" ? 0.3 : r.yieldVariability === "medium" ? 0.15 : 0);

      return {
        scenario: scenario?.name || r.scenarioKey,
        probability: (1 / results.length) * 100,
        expectedYield: avgYield,
        riskScore: Math.min(riskScore, 1),
        color: scenarioColors[idx % scenarioColors.length],
      };
    });

    // Value at Risk (VaR) calculations
    const var5 = getPercentile(0.05); // 5% VaR
    const var10 = getPercentile(0.10); // 10% VaR
    const cvar5 = sortedYields.slice(0, Math.floor(n * 0.05)).reduce((a, b) => a + b, 0) / Math.floor(n * 0.05) || var5;

    // Probability of exceeding thresholds
    const thresholds = [2.5, 3.0, 3.5, 4.0];
    const exceedanceProbabilities = thresholds.map((threshold) => ({
      threshold,
      probability: (allYields.filter((y) => y >= threshold).length / n) * 100,
    }));

    return {
      mean,
      stdDev,
      confidenceIntervals,
      densityData,
      scenarioProbabilities,
      var5,
      var10,
      cvar5,
      exceedanceProbabilities,
      n,
    };
  }, [results, scenarios]);

  if (!analysis) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Run a simulation to see Monte Carlo analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Confidence Interval Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {analysis.confidenceIntervals.map((ci) => (
          <Card key={ci.level} className="bg-muted/50">
            <CardContent className="p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">
                {ci.level}% CI
              </div>
              <div className="font-mono text-sm font-semibold">
                [{ci.lower.toFixed(2)}, {ci.upper.toFixed(2)}]
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                t/ha
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Probability Distribution with Confidence Bands */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4" />
            Yield Probability Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analysis.densityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="yield"
                  tick={{ fontSize: 10 }}
                  label={{ value: "Yield (t/ha)", position: "bottom", fontSize: 10 }}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  label={{ value: "Probability (%)", angle: -90, position: "insideLeft", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, "Probability"]}
                />
                <Area
                  type="monotone"
                  dataKey="ci50"
                  stackId="1"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.8}
                  stroke="none"
                  name="50% CI"
                />
                <Area
                  type="monotone"
                  dataKey="ci80"
                  stackId="1"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.5}
                  stroke="none"
                  name="80% CI"
                />
                <Area
                  type="monotone"
                  dataKey="ci95"
                  stackId="1"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.25}
                  stroke="none"
                  name="95% CI"
                />
                <Area
                  type="monotone"
                  dataKey="outside"
                  stackId="1"
                  fill="hsl(var(--muted-foreground))"
                  fillOpacity={0.2}
                  stroke="none"
                  name="Tail"
                />
                <ReferenceLine
                  x={analysis.mean.toFixed(2)}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{
                    value: `mu=${analysis.mean.toFixed(2)}`,
                    position: "top",
                    fontSize: 10,
                    fill: "hsl(var(--primary))",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-primary opacity-80" />
              <span>50% CI</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-primary opacity-50" />
              <span>80% CI</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-primary opacity-25" />
              <span>95% CI</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-accent-foreground" />
              Value at Risk (VaR)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">VaR (5%)</span>
              <span className="font-mono font-semibold">{analysis.var5.toFixed(2)} t/ha</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">VaR (10%)</span>
              <span className="font-mono font-semibold">{analysis.var10.toFixed(2)} t/ha</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">CVaR (5%)</span>
              <span className="font-mono font-semibold">{analysis.cvar5.toFixed(2)} t/ha</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t">
              5% chance of yield falling below {analysis.var5.toFixed(2)} t/ha
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Exceedance Probability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analysis.exceedanceProbabilities.map(({ threshold, probability }) => (
              <div key={threshold} className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">&gt;= {threshold} t/ha</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${probability}%` }}
                    />
                  </div>
                  <span className="font-mono text-sm w-12 text-right">{probability.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Scenario Comparison */}
      {results.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Scenario Risk-Return Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analysis.scenarioProbabilities}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 5]} />
                  <YAxis dataKey="scenario" type="category" tick={{ fontSize: 10 }} width={75} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => [
                      name === "expectedYield" ? `${value.toFixed(2)} t/ha` : `${(value * 100).toFixed(0)}%`,
                      name === "expectedYield" ? "Expected Yield" : "Risk Score",
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="expectedYield" name="Expected Yield" radius={[0, 4, 4, 0]}>
                    {analysis.scenarioProbabilities.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-2">
              {analysis.scenarioProbabilities.map((sp) => (
                <div key={sp.scenario} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: sp.color }}
                    />
                    <span className="text-muted-foreground">{sp.scenario}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      sp.riskScore < 0.3
                        ? "bg-primary/20 text-primary"
                        : sp.riskScore < 0.6
                        ? "bg-accent text-accent-foreground"
                        : "bg-destructive/20 text-destructive"
                    }`}>
                      {sp.riskScore < 0.3 ? "Low Risk" : sp.riskScore < 0.6 ? "Medium Risk" : "High Risk"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sample Size Note */}
      <p className="text-xs text-center text-muted-foreground">
        Analysis based on {analysis.n.toLocaleString()} simulated outcomes
      </p>
    </div>
  );
}
