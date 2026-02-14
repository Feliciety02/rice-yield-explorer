import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Droplets, Sun, Sprout, AlertTriangle, ThermometerSun, CalendarDays, TrendingUp, ShieldCheck } from "lucide-react";

const FarmerGuide = () => {
  return (
    <div className="space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
      {/* Quick Reference Card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sprout className="w-4 h-4 text-primary" />
            Quick Yield Reference
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-background rounded-md p-2 text-center border">
              <Droplets className="w-4 h-4 mx-auto mb-1 text-blue-500" />
              <p className="font-semibold text-foreground">Wet Season</p>
              <p className="text-muted-foreground">4.5-6.0 t/ha</p>
            </div>
            <div className="bg-background rounded-md p-2 text-center border">
              <Sun className="w-4 h-4 mx-auto mb-1 text-amber-500" />
              <p className="font-semibold text-foreground">Normal</p>
              <p className="text-muted-foreground">3.5-5.0 t/ha</p>
            </div>
            <div className="bg-background rounded-md p-2 text-center border">
              <ThermometerSun className="w-4 h-4 mx-auto mb-1 text-red-500" />
              <p className="font-semibold text-foreground">Dry Season</p>
              <p className="text-muted-foreground">1.5-3.0 t/ha</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Practical Advice Accordion */}
      <Accordion type="multiple" defaultValue={["rainfall", "timing"]} className="space-y-2">
        <AccordionItem value="rainfall" className="border rounded-lg px-3">
          <AccordionTrigger className="text-xs font-semibold py-3 hover:no-underline">
            <span className="flex items-center gap-2">
              <Droplets className="w-3.5 h-3.5 text-blue-500" />
              Understanding Rainfall Impact
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground space-y-2 pb-3">
            <p>
              Rainfall is the <span className="font-semibold text-foreground">single most important factor</span> affecting
              rainfed rice yields. Here's what to watch for:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li><span className="font-medium text-foreground">Below Normal (&lt;200mm/month):</span> Expect significant yield losses. Consider drought-resistant varieties.</li>
              <li><span className="font-medium text-foreground">Normal (200-300mm/month):</span> Ideal growing conditions for most rice varieties.</li>
              <li><span className="font-medium text-foreground">Above Normal (&gt;300mm/month):</span> Good yields possible, but watch for flooding and pest outbreaks.</li>
            </ul>
            <div className="flex gap-1.5 mt-2">
              <Badge variant="outline" className="text-[10px]">Irrigation</Badge>
              <Badge variant="outline" className="text-[10px]">Water Management</Badge>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="timing" className="border rounded-lg px-3">
          <AccordionTrigger className="text-xs font-semibold py-3 hover:no-underline">
            <span className="flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5 text-primary" />
              Best Planting Schedule
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground space-y-2 pb-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/50 rounded p-2">
                <p className="font-semibold text-foreground text-[11px]">Wet Season Crop</p>
                <p className="text-[10px]">Plant: June-July</p>
                <p className="text-[10px]">Harvest: Oct-Nov</p>
              </div>
              <div className="bg-muted/50 rounded p-2">
                <p className="font-semibold text-foreground text-[11px]">Dry Season Crop</p>
                <p className="text-[10px]">Plant: Nov-Dec</p>
                <p className="text-[10px]">Harvest: Mar-Apr</p>
              </div>
            </div>
            <p>
              Timing your planting to coincide with the onset of rains can increase yields by <span className="font-semibold text-foreground">15-25%</span>.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="risk" className="border rounded-lg px-3">
          <AccordionTrigger className="text-xs font-semibold py-3 hover:no-underline">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Risk Management Tips
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground space-y-2 pb-3">
            <ul className="list-disc pl-4 space-y-1.5">
              <li><span className="font-medium text-foreground">Diversify varieties:</span> Plant both early and late-maturing varieties to spread risk.</li>
              <li><span className="font-medium text-foreground">Stagger planting:</span> Don't plant everything at once - 2-week intervals reduce total loss risk.</li>
              <li><span className="font-medium text-foreground">Soil moisture monitoring:</span> Check soil moisture before planting; 60-80% field capacity is ideal.</li>
              <li><span className="font-medium text-foreground">Crop insurance:</span> Consider weather-index insurance where available for drought protection.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="interpret" className="border rounded-lg px-3">
          <AccordionTrigger className="text-xs font-semibold py-3 hover:no-underline">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              Reading Your Simulation Results
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground space-y-2 pb-3">
            <p>Here's how to interpret the key numbers from the simulator:</p>
            <div className="space-y-2">
              <div className="bg-muted/50 rounded p-2">
                <p className="font-semibold text-foreground text-[11px]">Average Yield</p>
                <p className="text-[10px]">The most likely outcome. Use this for planning expected income.</p>
              </div>
              <div className="bg-muted/50 rounded p-2">
                <p className="font-semibold text-foreground text-[11px]">Min / Max Range</p>
                <p className="text-[10px]">Shows best-case and worst-case. Wider range = more uncertainty.</p>
              </div>
              <div className="bg-muted/50 rounded p-2">
                <p className="font-semibold text-foreground text-[11px]">Coefficient of Variation (CV)</p>
                <p className="text-[10px]">Below 15% = stable. 15-25% = moderate risk. Above 25% = high risk.</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="practices" className="border rounded-lg px-3">
          <AccordionTrigger className="text-xs font-semibold py-3 hover:no-underline">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              Best Practices for Higher Yields
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground space-y-2 pb-3">
            <ol className="list-decimal pl-4 space-y-1.5">
              <li><span className="font-medium text-foreground">Seed selection:</span> Use certified seeds from trusted sources - yields can improve by 10-20%.</li>
              <li><span className="font-medium text-foreground">Proper spacing:</span> 20x20 cm hills with 2-3 seedlings per hill gives optimal results.</li>
              <li><span className="font-medium text-foreground">Balanced fertilizer:</span> Apply N-P-K based on soil test results, not guesswork.</li>
              <li><span className="font-medium text-foreground">Weed control:</span> First 45 days are critical - keep fields weed-free during this window.</li>
              <li><span className="font-medium text-foreground">Pest scouting:</span> Weekly field visits can catch problems early and save up to 30% of yield.</li>
            </ol>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default FarmerGuide;
