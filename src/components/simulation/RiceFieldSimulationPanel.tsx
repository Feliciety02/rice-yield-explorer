 import { useEffect, useRef } from "react";
 import { Play, Pause, SkipForward, RotateCcw, Sun, Cloud, CloudRain } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader } from "@/components/ui/card";
 import { SeasonResult, RainfallLevel } from "@/types/simulation";
 import { cn } from "@/lib/utils";
 
 interface RiceFieldSimulationPanelProps {
   seasons: SeasonResult[];
   activeSeasonIndex: number;
   onSelectSeason: (index: number) => void;
   isPlaying: boolean;
   onPlayPause: () => void;
   onStep: () => void;
   onReset: () => void;
 }
 
 const RainfallIcon = ({ level }: { level: RainfallLevel }) => {
   switch (level) {
     case "low":
       return <Sun className="w-4 h-4 text-amber-500" />;
     case "normal":
       return <Cloud className="w-4 h-4 text-slate-500" />;
     case "high":
       return <CloudRain className="w-4 h-4 text-blue-500" />;
   }
 };
 
 const getStatusText = (season: SeasonResult) => {
   const labels: Record<RainfallLevel, string> = {
     low: "Low rainfall",
     normal: "Normal rainfall",
     high: "High rainfall",
   };
   return `${labels[season.rainfall]} • ${season.yield.toFixed(1)} t/ha`;
 };
 
 export function RiceFieldSimulationPanel({
   seasons,
   activeSeasonIndex,
   onSelectSeason,
   isPlaying,
   onPlayPause,
   onStep,
   onReset,
 }: RiceFieldSimulationPanelProps) {
   const intervalRef = useRef<NodeJS.Timeout | null>(null);
   const currentSeason = seasons[activeSeasonIndex];
 
   useEffect(() => {
     if (isPlaying && seasons.length > 0) {
       intervalRef.current = setInterval(() => {
         onSelectSeason(
           activeSeasonIndex < seasons.length - 1 ? activeSeasonIndex + 1 : 0
         );
       }, 800);
     }
     return () => {
       if (intervalRef.current) clearInterval(intervalRef.current);
     };
   }, [isPlaying, activeSeasonIndex, seasons.length, onSelectSeason]);
 
   if (seasons.length === 0) {
     return (
       <Card className="panel h-full">
         <CardHeader className="panel-header">
           <h3 className="font-serif text-lg">Rice Field Simulation</h3>
         </CardHeader>
         <CardContent className="flex items-center justify-center h-80">
           <p className="text-muted-foreground text-center">
             Configure parameters and run simulation to see the visualization
           </p>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card className="panel h-full">
       <CardHeader className="panel-header flex flex-row items-center justify-between gap-4">
         <div className="flex items-center gap-3">
           <h3 className="font-serif text-lg">Rice Field Simulation</h3>
           <span
             className={cn(
               "status-pill",
               currentSeason?.rainfall === "low" && "status-pill-low",
               currentSeason?.rainfall === "normal" && "status-pill-normal",
               currentSeason?.rainfall === "high" && "status-pill-high"
             )}
           >
             {currentSeason && getStatusText(currentSeason)}
           </span>
         </div>
         <div className="flex items-center gap-2">
           <Button
             variant="outline"
             size="icon"
             onClick={onPlayPause}
             aria-label={isPlaying ? "Pause" : "Play"}
           >
             {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
           </Button>
           <Button
             variant="outline"
             size="icon"
             onClick={onStep}
             aria-label="Next season"
           >
             <SkipForward className="w-4 h-4" />
           </Button>
           <Button
             variant="outline"
             size="icon"
             onClick={onReset}
             aria-label="Reset"
           >
             <RotateCcw className="w-4 h-4" />
           </Button>
         </div>
       </CardHeader>
       <CardContent className="p-4 space-y-4">
         {/* Simulation Stage */}
         <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
           <RiceFieldVisual rainfall={currentSeason?.rainfall || "normal"} />
         </div>
 
         {/* Timeline Scrubber */}
         <div className="space-y-2">
           <p className="text-sm text-muted-foreground">
             Season {activeSeasonIndex + 1} of {seasons.length}
           </p>
           <div
             className="flex gap-2 flex-wrap"
             role="tablist"
             aria-label="Season timeline"
           >
             {seasons.map((season, idx) => (
               <button
                 key={idx}
                 onClick={() => onSelectSeason(idx)}
                 role="tab"
                 aria-selected={idx === activeSeasonIndex}
                 aria-label={`Season ${idx + 1}: ${season.rainfall} rainfall, ${season.yield} tons per hectare`}
                 className={cn(
                   "timeline-dot",
                   idx === activeSeasonIndex && "timeline-dot-active",
                   season.rainfall === "low" && "bg-sun-yellow/20 border-amber-400",
                   season.rainfall === "normal" && "bg-primary/10 border-primary",
                   season.rainfall === "high" && "bg-rain-blue/20 border-blue-400"
                 )}
               >
                 <RainfallIcon level={season.rainfall} />
               </button>
             ))}
           </div>
         </div>
       </CardContent>
     </Card>
   );
 }
 
 function RiceFieldVisual({ rainfall }: { rainfall: RainfallLevel }) {
   const skyClass =
     rainfall === "low"
       ? "bg-gradient-to-b from-sky-300 to-sky-200"
       : rainfall === "normal"
       ? "bg-gradient-to-b from-slate-300 to-slate-200"
       : "bg-gradient-to-b from-slate-500 to-slate-400";
 
   const waterLevel = rainfall === "low" ? "h-1" : rainfall === "normal" ? "h-3" : "h-6";
   const plantDensity = rainfall === "low" ? 8 : rainfall === "normal" ? 16 : 12;
 
   return (
     <div className={cn("relative w-full h-full", skyClass)}>
       {/* Sun (for low rainfall) */}
       {rainfall === "low" && (
         <div className="absolute top-4 right-8 animate-sun-pulse">
           <div className="w-12 h-12 bg-sun-yellow rounded-full shadow-lg" />
         </div>
       )}
 
       {/* Clouds */}
       {(rainfall === "normal" || rainfall === "high") && (
         <>
           <div className="absolute top-4 left-8 animate-cloud">
             <CloudShape dark={rainfall === "high"} />
           </div>
           <div className="absolute top-8 right-12 animate-cloud" style={{ animationDelay: "2s" }}>
             <CloudShape dark={rainfall === "high"} size="small" />
           </div>
           {rainfall === "high" && (
             <div className="absolute top-2 left-1/3 animate-cloud" style={{ animationDelay: "4s" }}>
               <CloudShape dark size="large" />
             </div>
           )}
         </>
       )}
 
       {/* Rain drops */}
       {rainfall === "high" && <RainDrops />}
 
       {/* Horizon line */}
       <div className="absolute bottom-1/3 w-full h-px bg-earth-brown/30" />
 
       {/* Paddy field */}
       <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-b from-earth-brown to-soil-dark">
         {/* Water channels */}
         <div className={cn("absolute bottom-0 left-0 right-0 bg-water-blue/60 transition-all duration-500", waterLevel)} />
         
         {/* Rice plants */}
         <div className="absolute bottom-1 left-0 right-0 flex justify-around items-end px-4">
           {Array.from({ length: plantDensity }).map((_, i) => (
             <RicePlant 
               key={i} 
               height={rainfall === "low" ? 20 : 35} 
               delay={i * 0.1}
             />
           ))}
         </div>
 
         {/* Small hut */}
         <div className="absolute bottom-6 right-8">
           <Hut />
         </div>
       </div>
 
       {/* Cracked soil texture for drought */}
       {rainfall === "low" && (
         <div className="absolute bottom-0 left-0 right-0 h-1/3 opacity-30">
           <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
             <path d="M10 0 L12 25 L8 50" stroke="hsl(25 30% 20%)" strokeWidth="0.5" fill="none" />
             <path d="M30 0 L28 30 L35 50" stroke="hsl(25 30% 20%)" strokeWidth="0.5" fill="none" />
             <path d="M50 5 L48 25 L55 45" stroke="hsl(25 30% 20%)" strokeWidth="0.5" fill="none" />
             <path d="M70 0 L72 35 L68 50" stroke="hsl(25 30% 20%)" strokeWidth="0.5" fill="none" />
             <path d="M90 10 L88 30 L92 50" stroke="hsl(25 30% 20%)" strokeWidth="0.5" fill="none" />
           </svg>
         </div>
       )}
     </div>
   );
 }
 
 function CloudShape({ dark = false, size = "medium" }: { dark?: boolean; size?: "small" | "medium" | "large" }) {
   const sizeClasses = {
     small: "w-12 h-6",
     medium: "w-16 h-8",
     large: "w-24 h-12",
   };
   
   return (
     <div className={cn(
       "rounded-full",
       sizeClasses[size],
       dark ? "bg-slate-600" : "bg-white/80"
     )} />
   );
 }
 
 function RainDrops() {
   return (
     <div className="absolute inset-0 overflow-hidden pointer-events-none">
       {Array.from({ length: 30 }).map((_, i) => (
         <div
           key={i}
           className="absolute w-0.5 h-4 bg-rain-blue/60 animate-rain"
           style={{
             left: `${(i * 3.3) + Math.random() * 2}%`,
             animationDelay: `${Math.random() * 0.5}s`,
             top: `${Math.random() * 20}%`,
           }}
         />
       ))}
     </div>
   );
 }
 
 function RicePlant({ height, delay }: { height: number; delay: number }) {
   return (
     <div 
       className="flex flex-col items-center animate-sway origin-bottom"
       style={{ animationDelay: `${delay}s`, height: `${height}px` }}
     >
       <div className="w-0.5 bg-rice-green flex-1" />
       <div className="w-2 h-3 bg-rice-gold rounded-full -mt-1 transform rotate-12" />
     </div>
   );
 }
 
 function Hut() {
   return (
     <svg width="30" height="25" viewBox="0 0 30 25">
       {/* Roof */}
       <polygon points="15,0 0,12 30,12" fill="hsl(25 50% 35%)" />
       {/* Walls */}
       <rect x="5" y="12" width="20" height="13" fill="hsl(35 30% 50%)" />
       {/* Door */}
       <rect x="12" y="17" width="6" height="8" fill="hsl(25 40% 25%)" />
     </svg>
   );
 }
 
 export default RiceFieldSimulationPanel;