 import { Navbar } from "@/components/layout/Navbar";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
import { Droplets, Sun, CloudRain } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useScenarioData } from "@/context/scenario-data";
 
const About = () => {
  const { scenarios, yieldByRainfall, isLoading, error } = useScenarioData();
  return (
     <div className="min-h-screen bg-background">
       <Navbar />
       
       <main className="container mx-auto px-4 py-8 md:py-12">
         <div className="max-w-4xl mx-auto space-y-8">
           {/* Header */}
           <div className="text-center mb-12">
             <h1 className="text-3xl md:text-4xl font-bold font-serif text-foreground mb-4">
               About This Project
             </h1>
             <p className="text-lg text-muted-foreground">
               Understanding the methodology behind rice yield simulation
             </p>
           </div>
 
           {/* Project Overview */}
           <Card>
             <CardHeader>
               <CardTitle className="font-serif">Project Overview</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4 text-muted-foreground">
               <p>
                 This simulation tool models the relationship between rainfall variability 
                 and rice crop yields using a discrete event simulation approach. The model 
                 generates stochastic rainfall events based on user-defined probability 
                 distributions and calculates corresponding yield outcomes.
               </p>
               <p>
                 The tool is designed for educational purposes and agricultural decision 
                 support, helping users understand how climate uncertainty affects crop 
                 production and how different planting strategies can mitigate risk.
               </p>
             </CardContent>
           </Card>
 
           {/* Methodology */}
           <Card>
             <CardHeader>
               <CardTitle className="font-serif">Simulation Methodology</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4 text-muted-foreground">
               <h4 className="font-semibold text-foreground">Discrete Event Simulation</h4>
               <p>
                 The model uses a Monte Carlo approach where each growing season is treated 
                 as an independent event. For each season:
               </p>
               <ol className="list-decimal list-inside space-y-2 ml-4">
                 <li>A random number is generated using the configured probability distribution</li>
                 <li>The rainfall level (low, normal, or high) is determined based on cumulative probabilities</li>
                 <li>Yield is calculated using the rainfall-yield mapping function</li>
                 <li>Results are aggregated across all seasons and replications</li>
               </ol>
               
               <h4 className="font-semibold text-foreground mt-6">Key Assumptions</h4>
               <ul className="list-disc list-inside space-y-2 ml-4">
                 <li>Rainfall events are independent between seasons</li>
                 <li>Yield response is deterministic given rainfall level</li>
                 <li>No carry-over effects between consecutive seasons</li>
                 <li>All other factors (soil, variety, management) are held constant</li>
               </ul>
             </CardContent>
           </Card>
 
           {/* Rainfall-Yield Assumptions */}
           <Card>
             <CardHeader>
               <CardTitle className="font-serif flex items-center gap-2">
                 <Droplets className="w-5 h-5 text-primary" />
                 Rainfall-Yield Relationships
               </CardTitle>
             </CardHeader>
             <CardContent>
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Rainfall Level</TableHead>
                     <TableHead>Condition</TableHead>
                     <TableHead className="text-right">Yield (t/ha)</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                  <TableRow>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-500" />
                      Low Rainfall
                    </TableCell>
                    <TableCell>Drought stress, reduced water availability</TableCell>
                    <TableCell className="text-right font-mono">
                      {yieldByRainfall ? (
                        yieldByRainfall.low
                      ) : isLoading ? (
                        <Skeleton className="h-4 w-10 ml-auto" />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-primary" />
                      Normal Rainfall
                    </TableCell>
                    <TableCell>Optimal growing conditions</TableCell>
                    <TableCell className="text-right font-mono">
                      {yieldByRainfall ? (
                        yieldByRainfall.normal
                      ) : isLoading ? (
                        <Skeleton className="h-4 w-10 ml-auto" />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium flex items-center gap-2">
                      <CloudRain className="w-4 h-4 text-blue-500" />
                      High Rainfall
                    </TableCell>
                    <TableCell>Excess water, potential flooding/waterlogging</TableCell>
                    <TableCell className="text-right font-mono">
                      {yieldByRainfall ? (
                        yieldByRainfall.high
                      ) : isLoading ? (
                        <Skeleton className="h-4 w-10 ml-auto" />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              {error && (
                <p className="mt-2 text-xs text-destructive">{error}</p>
              )}
            </CardContent>
          </Card>
 
           {/* Scenario Defaults */}
           <Card>
             <CardHeader>
               <CardTitle className="font-serif">Scenario Default Probabilities</CardTitle>
             </CardHeader>
             <CardContent>
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Scenario</TableHead>
                     <TableHead className="text-right">Low %</TableHead>
                     <TableHead className="text-right">Normal %</TableHead>
                     <TableHead className="text-right">High %</TableHead>
                   </TableRow>
                 </TableHeader>
                <TableBody>
                  {isLoading && scenarios.length === 0 && (
                    <>
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <TableRow key={`scenario-skeleton-${idx}`}>
                          <TableCell>
                            <Skeleton className="h-4 w-40" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-4 w-10 ml-auto" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-4 w-10 ml-auto" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-4 w-10 ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                  {scenarios.map((scenario) => (
                    <TableRow key={scenario.id}>
                      <TableCell className="font-medium">{scenario.name}</TableCell>
                      <TableCell className="text-right font-mono">
                        {scenario.defaultProbabilities.low}
                       </TableCell>
                       <TableCell className="text-right font-mono">
                         {scenario.defaultProbabilities.normal}
                       </TableCell>
                       <TableCell className="text-right font-mono">
                         {scenario.defaultProbabilities.high}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
           </Card>
 
           {/* Metrics Explanation */}
           <Card>
             <CardHeader>
               <CardTitle className="font-serif">Output Metrics</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4 text-muted-foreground">
               <div className="grid md:grid-cols-2 gap-6">
                 <div>
                   <h4 className="font-semibold text-foreground mb-2">Average Yield</h4>
                   <p className="text-sm">
                     Mean yield across all simulated seasons, calculated as the sum of 
                     all yields divided by the number of seasons.
                   </p>
                 </div>
                 <div>
                   <h4 className="font-semibold text-foreground mb-2">Yield Variability</h4>
                   <p className="text-sm">
                     Classified as Low (&lt;15% CV), Medium (15-30% CV), or High (&gt;30% CV) 
                     based on the coefficient of variation.
                   </p>
                 </div>
                 <div>
                   <h4 className="font-semibold text-foreground mb-2">Min/Max Yield</h4>
                   <p className="text-sm">
                     The lowest and highest yields observed across all simulated seasons.
                   </p>
                 </div>
                 <div>
                   <h4 className="font-semibold text-foreground mb-2">Low Yield Seasons %</h4>
                   <p className="text-sm">
                     Percentage of seasons with drought conditions (low rainfall), 
                     indicating crop failure risk.
                   </p>
                 </div>
               </div>
             </CardContent>
           </Card>
 
           {/* Technical Notes */}
           <Card>
             <CardHeader>
               <CardTitle className="font-serif">Technical Notes</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4 text-muted-foreground text-sm">
               <p>
                 <strong>Random Number Generation:</strong> The simulation uses a seeded 
                 Linear Congruential Generator (LCG) for reproducibility. Users can 
                 specify a seed value to replicate exact results.
               </p>
               <p>
                 <strong>Browser-Based:</strong> All computations run entirely in the 
                 browser using JavaScript. No data is sent to external servers.
               </p>
               <p>
                 <strong>Limitations:</strong> This is a simplified model for educational 
                 purposes. Real-world rice production involves many additional factors 
                 including soil type, variety selection, pest pressure, and management 
                 practices.
               </p>
             </CardContent>
           </Card>
         </div>
       </main>
 
       {/* Footer */}
       <footer className="py-8 border-t border-border bg-muted/20 mt-12">
         <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Rice Yield Simulation Tool - Academic Research Application</p>
         </div>
       </footer>
     </div>
   );
 };
 
 export default About;
