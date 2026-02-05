 import { useSimulation } from "@/hooks/useSimulation";
 import { Navbar } from "@/components/layout/Navbar";
 import { SimulationInputPanel } from "@/components/simulation/SimulationInputPanel";
 import { RiceFieldSimulationPanel } from "@/components/simulation/RiceFieldSimulationPanel";
 import { SimulationResultsPanel } from "@/components/simulation/SimulationResultsPanel";
 
 const Simulator = () => {
   const {
     config,
     results,
     aggregatedResults,
     isRunning,
     activeSeasonIndex,
     setActiveSeasonIndex,
     isPlaying,
     setIsPlaying,
     updateScenario,
     updateProbabilities,
     updateNumSeasons,
     updateNumReplications,
     updateSeed,
     applyPreset,
     runSimulation,
     runAllScenarios,
     reset,
   } = useSimulation();
 
   const currentSeasons = results.length > 0 ? results[0].seasons : [];
 
   const handleStep = () => {
     if (currentSeasons.length > 0) {
       setActiveSeasonIndex((prev) =>
         prev < currentSeasons.length - 1 ? prev + 1 : 0
       );
     }
   };
 
   const handleReset = () => {
     setActiveSeasonIndex(0);
     setIsPlaying(false);
   };
 
   return (
     <div className="min-h-screen bg-background">
       <Navbar />
       
       <main className="container mx-auto px-4 py-6">
         <div className="mb-6">
           <h1 className="text-2xl md:text-3xl font-bold font-serif text-foreground">
             Rice Yield Simulator
           </h1>
           <p className="text-muted-foreground mt-1">
             Configure rainfall scenarios and analyze yield outcomes
           </p>
         </div>
 
         <div className="grid lg:grid-cols-12 gap-6">
           {/* Left Panel - Inputs */}
           <div className="lg:col-span-3">
             <SimulationInputPanel
               scenarioId={config.scenarioId}
               numSeasons={config.numSeasons}
               numReplications={config.numReplications}
               probabilities={config.probabilities}
               seed={config.seed}
               onScenarioChange={updateScenario}
               onNumSeasonsChange={updateNumSeasons}
               onNumReplicationsChange={updateNumReplications}
               onProbabilitiesChange={updateProbabilities}
               onSeedChange={updateSeed}
               onPreset={applyPreset}
               onRun={runSimulation}
               onRunAll={runAllScenarios}
               onReset={reset}
               isRunning={isRunning}
             />
           </div>
 
           {/* Center Panel - Visualization */}
           <div className="lg:col-span-5">
             <RiceFieldSimulationPanel
               seasons={currentSeasons}
               activeSeasonIndex={activeSeasonIndex}
               onSelectSeason={setActiveSeasonIndex}
               isPlaying={isPlaying}
               onPlayPause={() => setIsPlaying(!isPlaying)}
               onStep={handleStep}
               onReset={handleReset}
             />
           </div>
 
           {/* Right Panel - Results */}
           <div className="lg:col-span-4">
             <SimulationResultsPanel
               results={results}
               aggregatedResults={aggregatedResults}
             />
           </div>
         </div>
       </main>
     </div>
   );
 };
 
 export default Simulator;