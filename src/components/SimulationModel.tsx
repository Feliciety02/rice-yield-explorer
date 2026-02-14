import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const highlights = [
  {
    label: "Entity",
    value: "Planting_Season",
    detail: "1 hectare for 1 season",
  },
  {
    label: "Rainfall",
    value: "aRainfallLevel",
    detail: "1 low, 2 normal, 3 high",
  },
  {
    label: "Yield",
    value: "vYield",
    detail: "tons per hectare",
  },
];

const moduleSteps = [
  {
    key: "Create_Season",
    title: "Create Season",
    detail: "Generate one planting season entity.",
  },
  {
    key: "Decide_Rainfall",
    title: "Decide Rainfall",
    detail: "Pick low, normal, or high rainfall by chance.",
  },
  {
    key: "Assign_Low / Assign_Normal / Assign_High",
    title: "Assign Rainfall Level",
    detail: "Store aRainfallLevel = 1, 2, or 3.",
  },
  {
    key: "Assign_Yield",
    title: "Assign Yield",
    detail: "Compute vYield from rainfall class (2.0, 4.0, 3.0).",
  },
  {
    key: "Record_Yield",
    title: "Record Yield",
    detail: "Tally yield statistics (mean, min, max, SD).",
  },
  {
    key: "Decide_LowYield",
    title: "Check Low Yield",
    detail: "Is vYield <= 2.0?",
  },
  {
    key: "Count_LowYield",
    title: "Count Low Yield",
    detail: "Increment low yield counter.",
  },
  {
    key: "Dispose_Season",
    title: "Dispose",
    detail: "End the planting season entity.",
  },
];

const SimulationModel = () => {
  return (
    <div className="relative space-y-8 overflow-hidden">
      <div className="pointer-events-none absolute -top-24 right-[-10%] h-60 w-60 rounded-full bg-gradient-to-br from-primary/30 via-secondary/20 to-transparent blur-3xl opacity-60" />
      <div className="pointer-events-none absolute -bottom-24 left-[-5%] h-72 w-72 rounded-full bg-gradient-to-tr from-amber-200/50 via-primary/10 to-transparent blur-3xl opacity-60" />

      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/10 shadow-[0_16px_40px_-28px_rgba(17,24,39,0.4)]">
        <div className="pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(circle_at_top,black,transparent_70%)]">
          <div className="h-full w-full bg-[linear-gradient(120deg,rgba(255,255,255,0.4),transparent)]" />
        </div>
        <CardHeader className="relative px-6 pt-6 pb-3">
          <CardTitle className="text-2xl md:text-3xl font-serif text-foreground">
            Rice Yield Simulation Model
          </CardTitle>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            A modern Arena-style view that keeps the flow simple, readable, and
            centered on farmer decisions.
          </p>
        </CardHeader>
        <CardContent className="relative px-6 pb-6">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[11px] text-muted-foreground">
              Event-driven
            </span>
            <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[11px] text-muted-foreground">
              Rainfall-driven yield
            </span>
            <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[11px] text-muted-foreground">
              No queues or resources
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <Card className="border-border/70 bg-background/70 backdrop-blur shadow-[0_18px_36px_-28px_rgba(15,23,42,0.45)]">
            <CardHeader className="px-6 pt-6 pb-3">
              <CardTitle className="text-sm font-semibold">
                Arena Style Flowchart
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                The flowchart mirrors the detailed module description exactly.
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="relative rounded-3xl border border-border/70 bg-gradient-to-b from-muted/30 via-background to-muted/10 p-4 sm:p-6 overflow-hidden">
                <div
                  className="pointer-events-none absolute inset-0 opacity-40"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, rgba(120,113,108,0.18) 1px, transparent 0)",
                    backgroundSize: "18px 18px",
                  }}
                />
                <div className="relative overflow-x-auto">
                  <svg
                    viewBox="0 0 1200 1300"
                    className="min-w-[920px] w-full h-auto text-foreground/80"
                    role="img"
                    aria-label="Arena-style simulation flowchart"
                  >
                    <defs>
                      <marker
                        id="arrow"
                        viewBox="0 0 10 10"
                        refX="9"
                        refY="5"
                        markerWidth="8"
                        markerHeight="8"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                      </marker>
                      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.18" />
                      </filter>
                      <linearGradient id="nodeFill" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.98)" />
                        <stop offset="100%" stopColor="rgba(248,250,252,0.86)" />
                      </linearGradient>
                      <linearGradient id="accentFill" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="rgba(34,197,94,0.18)" />
                        <stop offset="100%" stopColor="rgba(34,197,94,0.06)" />
                      </linearGradient>
                    </defs>

                    <g fontFamily="Poppins, sans-serif" fontSize="12" fill="currentColor">
                      <rect
                        x="500"
                        y="30"
                        width="200"
                        height="52"
                        rx="26"
                        ry="26"
                        fill="url(#accentFill)"
                        stroke="currentColor"
                        opacity="0.9"
                        filter="url(#softShadow)"
                      />
                      <text x="600" y="56" textAnchor="middle" dominantBaseline="middle">
                        Start
                      </text>

                      <rect
                        x="500"
                        y="160"
                        width="200"
                        height="56"
                        rx="16"
                        ry="16"
                        fill="url(#nodeFill)"
                        stroke="currentColor"
                        opacity="0.9"
                        filter="url(#softShadow)"
                      />
                      <text x="600" y="189" textAnchor="middle" dominantBaseline="middle">
                        Create Season
                      </text>

                      <polygon
                        points="600,260 662,312 600,364 538,312"
                        fill="url(#nodeFill)"
                        stroke="currentColor"
                        opacity="0.9"
                        filter="url(#softShadow)"
                      />
                      <text
                        x="600"
                        y="312"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="11"
                      >
                        Decide Rainfall
                      </text>

                      <rect
                        x="80"
                        y="460"
                        width="220"
                        height="52"
                        rx="16"
                        ry="16"
                        fill="url(#nodeFill)"
                        stroke="currentColor"
                        opacity="0.9"
                        filter="url(#softShadow)"
                      />
                      <text x="190" y="486" textAnchor="middle" dominantBaseline="middle">
                        Assign Low
                      </text>

                      <rect
                        x="490"
                        y="460"
                        width="220"
                        height="52"
                        rx="16"
                        ry="16"
                        fill="url(#nodeFill)"
                        stroke="currentColor"
                        opacity="0.9"
                        filter="url(#softShadow)"
                      />
                      <text x="600" y="486" textAnchor="middle" dominantBaseline="middle">
                        Assign Normal
                      </text>

                      <rect
                        x="900"
                        y="460"
                        width="220"
                        height="52"
                        rx="16"
                        ry="16"
                        fill="url(#nodeFill)"
                        stroke="currentColor"
                        opacity="0.9"
                        filter="url(#softShadow)"
                      />
                      <text x="1010" y="486" textAnchor="middle" dominantBaseline="middle">
                        Assign High
                      </text>

                      <rect
                        x="500"
                        y="600"
                        width="200"
                        height="56"
                        rx="16"
                        ry="16"
                        fill="url(#nodeFill)"
                        stroke="currentColor"
                        opacity="0.9"
                        filter="url(#softShadow)"
                      />
                      <text x="600" y="628" textAnchor="middle" dominantBaseline="middle">
                        Assign Yield
                      </text>

                      <rect
                        x="500"
                        y="730"
                        width="200"
                        height="56"
                        rx="16"
                        ry="16"
                        fill="url(#nodeFill)"
                        stroke="currentColor"
                        opacity="0.9"
                        filter="url(#softShadow)"
                      />
                      <text x="600" y="758" textAnchor="middle" dominantBaseline="middle">
                        Record Yield
                      </text>

                      <polygon
                        points="600,820 662,872 600,924 538,872"
                        fill="url(#nodeFill)"
                        stroke="currentColor"
                        opacity="0.9"
                        filter="url(#softShadow)"
                      />
                      <text
                        x="600"
                        y="872"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="11"
                      >
                        Low Yield?
                      </text>

                      <rect
                        x="820"
                        y="846"
                        width="240"
                        height="52"
                        rx="16"
                        ry="16"
                        fill="url(#nodeFill)"
                        stroke="currentColor"
                        opacity="0.9"
                        filter="url(#softShadow)"
                      />
                      <text x="940" y="872" textAnchor="middle" dominantBaseline="middle">
                        Count Low Yield
                      </text>

                      <rect
                        x="500"
                        y="1040"
                        width="200"
                        height="56"
                        rx="16"
                        ry="16"
                        fill="url(#nodeFill)"
                        stroke="currentColor"
                        opacity="0.9"
                        filter="url(#softShadow)"
                      />
                      <text x="600" y="1068" textAnchor="middle" dominantBaseline="middle">
                        Dispose Season
                      </text>

                      <rect
                        x="500"
                        y="1170"
                        width="200"
                        height="52"
                        rx="26"
                        ry="26"
                        fill="url(#accentFill)"
                        stroke="currentColor"
                        opacity="0.9"
                        filter="url(#softShadow)"
                      />
                      <text x="600" y="1196" textAnchor="middle" dominantBaseline="middle">
                        End
                      </text>

                      <g stroke="currentColor" strokeWidth="1.2" opacity="0.7">
                        <line x1="600" y1="82" x2="600" y2="160" markerEnd="url(#arrow)" />
                        <line x1="600" y1="216" x2="600" y2="260" markerEnd="url(#arrow)" />

                        <line x1="600" y1="364" x2="600" y2="408" />
                        <line x1="190" y1="408" x2="1010" y2="408" />

                        <line x1="190" y1="408" x2="190" y2="460" markerEnd="url(#arrow)" />
                        <line x1="600" y1="408" x2="600" y2="460" markerEnd="url(#arrow)" />
                        <line x1="1010" y1="408" x2="1010" y2="460" markerEnd="url(#arrow)" />

                        <text x="170" y="394" fontSize="10" opacity="0.85">
                          Low
                        </text>
                        <text x="588" y="394" fontSize="10" opacity="0.85">
                          Normal
                        </text>
                        <text x="995" y="394" fontSize="10" opacity="0.85">
                          High
                        </text>

                        <line x1="190" y1="512" x2="190" y2="532" />
                        <line x1="600" y1="512" x2="600" y2="532" />
                        <line x1="1010" y1="512" x2="1010" y2="532" />
                        <line x1="190" y1="532" x2="1010" y2="532" />
                        <line x1="600" y1="532" x2="600" y2="600" markerEnd="url(#arrow)" />

                        <line x1="600" y1="656" x2="600" y2="730" markerEnd="url(#arrow)" />
                        <line x1="600" y1="786" x2="600" y2="820" markerEnd="url(#arrow)" />

                        <line x1="662" y1="872" x2="820" y2="872" markerEnd="url(#arrow)" />
                        <text x="725" y="858" fontSize="10" opacity="0.85">
                          Yes
                        </text>

                        <line x1="600" y1="924" x2="600" y2="1004" />
                        <text x="612" y="964" fontSize="10" opacity="0.85">
                          No
                        </text>

                        <line x1="940" y1="898" x2="940" y2="1004" />
                        <line x1="940" y1="1004" x2="600" y2="1004" />
                        <line x1="600" y1="1004" x2="600" y2="1040" markerEnd="url(#arrow)" />

                        <line x1="600" y1="1096" x2="600" y2="1170" markerEnd="url(#arrow)" />
                      </g>
                    </g>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-background/70 backdrop-blur shadow-[0_18px_36px_-28px_rgba(15,23,42,0.45)]">
            <CardHeader className="px-6 pt-6 pb-3">
              <CardTitle className="text-sm font-semibold">
                Simulation Flow Explanation
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Farmer-friendly summary that matches the flowchart.
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="mx-auto max-w-lg space-y-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  {highlights.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-border/70 bg-background/70 p-3"
                    >
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {item.value}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    One-line Flow
                  </p>
                  <p className="mt-2 text-xs font-mono text-foreground/90 leading-relaxed">
                    Create &rarr; Decide Rainfall &rarr; Assign Rainfall Level &rarr;
                    Assign Yield &rarr; Record Yield &rarr; Check Low Yield &rarr;
                    Count Low Yield &rarr; Dispose
                  </p>
                </div>

                <div className="grid gap-3">
                  {moduleSteps.map((step, index) => (
                    <div
                      key={step.key}
                      className="rounded-2xl border border-border/70 bg-background/70 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-foreground">{step.key}</p>
                        <span className="text-[10px] text-muted-foreground">
                          Step {index + 1}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {step.detail}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/10 via-background to-background p-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Scenarios do not change the structure. Only the rainfall
                    probabilities inside <span className="font-semibold text-foreground">Decide_Rainfall</span>{" "}
                    are adjusted for Scenario 1 to Scenario 5.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SimulationModel;
