 import { Label } from "@/components/ui/label";
 import { Input } from "@/components/ui/input";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader } from "@/components/ui/card";
 import { Slider } from "@/components/ui/slider";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
import { RainfallProbabilities, ScenarioKey } from "@/types/simulation";
import { toast } from "@/hooks/use-toast";
import { useScenarioData } from "@/context/scenario-data";
 import { Play, RotateCcw, Layers } from "lucide-react";
 
interface SimulationInputPanelProps {
  scenarioKey: ScenarioKey;
  numSeasons: number;
  numReplications: number;
  probabilities: RainfallProbabilities;
  seed?: string;
  onScenarioChange: (key: ScenarioKey) => void;
  onNumSeasonsChange: (n: number) => void;
  onNumReplicationsChange: (n: number) => void;
  onProbabilitiesChange: (p: RainfallProbabilities) => void;
  onSeedChange: (seed: string | undefined) => void;
  onPreset: (preset: "balanced" | "drought" | "flood" | "random") => void;
  onRun: () => void;
  onRunAll: () => void;
  onReset: () => void;
  isRunning: boolean;
  validationError?: string | null;
  isValid?: boolean;
}
 
const MIN_SEASONS = 1;
const MAX_SEASONS = 50;
const MIN_REPLICATIONS = 1;
const MAX_REPLICATIONS = 100;

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function SimulationInputPanel({
   scenarioKey,
   numSeasons,
   numReplications,
   probabilities,
   seed,
   onScenarioChange,
   onNumSeasonsChange,
   onNumReplicationsChange,
   onProbabilitiesChange,
   onSeedChange,
   onPreset,
   onRun,
   onRunAll,
   onReset,
   isRunning,
   validationError,
   isValid = true,
}: SimulationInputPanelProps) {
  const { scenarios, isLoading, error } = useScenarioData();
  const currentScenario = scenarios.find((s) => s.key === scenarioKey);
  const inputsDisabled = isLoading || scenarios.length === 0;

  const handleClampedInput = (
    label: string,
    value: string,
    min: number,
    max: number,
    onChange: (next: number) => void
  ) => {
    if (!value) {
      onChange(min);
      return;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }
    const clamped = clampInt(parsed, min, max);
    if (clamped !== parsed) {
      toast({
        variant: "destructive",
        title: `${label} out of range`,
        description: `Adjusted to ${clamped}. Allowed range: ${min}-${max}.`,
      });
    }
    onChange(clamped);
  };

  const handleSeedChange = (value: string) => {
    const trimmed = value.trim();
    onSeedChange(trimmed ? trimmed : undefined);
  };
 
   const handleProbabilityChange = (
     key: keyof RainfallProbabilities,
     value: number
   ) => {
     const others = Object.keys(probabilities).filter(
       (k) => k !== key
     ) as (keyof RainfallProbabilities)[];
     const remaining = 100 - value;
     const otherTotal = probabilities[others[0]] + probabilities[others[1]];
 
     let newProbs: RainfallProbabilities;
     if (otherTotal === 0) {
       newProbs = {
         ...probabilities,
         [key]: value,
         [others[0]]: Math.floor(remaining / 2),
         [others[1]]: Math.ceil(remaining / 2),
       };
     } else {
       const ratio0 = probabilities[others[0]] / otherTotal;
       newProbs = {
         ...probabilities,
         [key]: value,
         [others[0]]: Math.round(remaining * ratio0),
         [others[1]]: remaining - Math.round(remaining * ratio0),
       };
     }
     onProbabilitiesChange(newProbs);
   };
 
   return (
     <Card className="panel h-full">
       <CardHeader className="panel-header">
         <h3 className="font-serif text-lg">Simulation Parameters</h3>
       </CardHeader>
       <CardContent className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
         {/* Scenario Selector */}
        <div className="space-y-2">
          <Label htmlFor="scenario">Scenario</Label>
          <Select
            value={scenarioKey}
            onValueChange={(v) => onScenarioChange(v as ScenarioKey)}
            disabled={inputsDisabled}
          >
            <SelectTrigger id="scenario">
              <SelectValue placeholder="Select scenario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom</SelectItem>
              {scenarios.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isLoading && (
            <p className="text-xs text-muted-foreground">Loading scenarios...</p>
          )}
          {!isLoading && currentScenario && (
            <p className="text-sm text-muted-foreground">
              {currentScenario.description}
            </p>
          )}
          {!isLoading && !currentScenario && scenarioKey === "custom" && (
            <p className="text-sm text-muted-foreground">
              Custom probabilities based on your slider inputs.
            </p>
          )}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>
 
         {/* Number of Seasons */}
         <div className="space-y-2">
           <Label htmlFor="seasons">Number of Seasons</Label>
         <Input
            id="seasons"
            type="number"
            min={MIN_SEASONS}
            max={MAX_SEASONS}
            step={1}
            inputMode="numeric"
            value={numSeasons}
            onChange={(e) =>
              handleClampedInput(
                "Number of seasons",
                e.target.value,
                MIN_SEASONS,
                MAX_SEASONS,
                onNumSeasonsChange
              )
            }
            disabled={inputsDisabled}
          />
          <p className="text-xs text-muted-foreground">
            Range: {MIN_SEASONS}-{MAX_SEASONS}
          </p>
        </div>
 
         {/* Number of Replications */}
         <div className="space-y-2">
           <Label htmlFor="replications">Number of Replications</Label>
         <Input
            id="replications"
            type="number"
            min={MIN_REPLICATIONS}
            max={MAX_REPLICATIONS}
            step={1}
            inputMode="numeric"
            value={numReplications}
            onChange={(e) =>
              handleClampedInput(
                "Number of replications",
                e.target.value,
                MIN_REPLICATIONS,
                MAX_REPLICATIONS,
                onNumReplicationsChange
              )
            }
            disabled={inputsDisabled}
          />
          <p className="text-xs text-muted-foreground">
            Range: {MIN_REPLICATIONS}-{MAX_REPLICATIONS}
          </p>
        </div>
 
         {/* Probability Editor */}
         <div className="space-y-4">
           <div className="flex items-center justify-between">
             <Label>Rainfall Probabilities</Label>
             <span className="text-xs text-muted-foreground">Must sum to 100%</span>
           </div>
 
           <div className="space-y-4">
             <div className="space-y-2">
               <div className="flex justify-between text-sm">
                 <span className="text-amber-600">Low Rainfall</span>
                 <span className="font-medium">{probabilities.low}%</span>
               </div>
              <Slider
                value={[probabilities.low]}
                onValueChange={([v]) => handleProbabilityChange("low", v)}
                max={100}
                step={1}
                className="[&_[role=slider]]:bg-amber-500"
                disabled={inputsDisabled}
              />
            </div>
 
             <div className="space-y-2">
               <div className="flex justify-between text-sm">
                 <span className="text-primary">Normal Rainfall</span>
                 <span className="font-medium">{probabilities.normal}%</span>
               </div>
              <Slider
                value={[probabilities.normal]}
                onValueChange={([v]) => handleProbabilityChange("normal", v)}
                max={100}
                step={1}
                disabled={inputsDisabled}
              />
            </div>
 
             <div className="space-y-2">
               <div className="flex justify-between text-sm">
                 <span className="text-accent">High Rainfall</span>
                 <span className="font-medium">{probabilities.high}%</span>
               </div>
              <Slider
                value={[probabilities.high]}
                onValueChange={([v]) => handleProbabilityChange("high", v)}
                max={100}
                step={1}
                className="[&_[role=slider]]:bg-accent"
                disabled={inputsDisabled}
              />
            </div>
          </div>
 
           {/* Presets */}
           <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPreset("balanced")}
              disabled={inputsDisabled}
            >
              Balanced
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPreset("drought")}
              disabled={inputsDisabled}
            >
              Drought-leaning
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPreset("flood")}
              disabled={inputsDisabled}
            >
              Flood-leaning
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPreset("random")}
              disabled={inputsDisabled}
            >
              Random
            </Button>
          </div>
        </div>
 
         {/* Random Seed */}
         <div className="space-y-2">
           <Label htmlFor="seed">Random Seed (optional)</Label>
         <Input
            id="seed"
            type="text"
            placeholder="Leave empty for random"
            value={seed ?? ""}
            onChange={(e) => handleSeedChange(e.target.value)}
            disabled={inputsDisabled}
          />
           <p className="text-xs text-muted-foreground">
             Set a seed for reproducible results
           </p>
         </div>
 
         {/* Actions */}
         <div className="space-y-2 pt-4 border-t border-border">
          <Button
            className="w-full"
            onClick={onRun}
            disabled={isRunning || inputsDisabled || !isValid}
          >
            <Play className="w-4 h-4 mr-2" />
            {isRunning ? "Running..." : "Run Simulation"}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={onRunAll}
            disabled={isRunning || inputsDisabled || !isValid}
          >
            <Layers className="w-4 h-4 mr-2" />
            {isRunning ? "Running..." : "Compare All Scenarios"}
          </Button>
          {validationError && (
            <p className="text-xs text-destructive text-center">{validationError}</p>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={onReset}
            disabled={inputsDisabled}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
       </CardContent>
     </Card>
   );
 }
 
 export default SimulationInputPanel;
