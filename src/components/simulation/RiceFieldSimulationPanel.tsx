import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Sun,
  Cloud,
  CloudRain,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Repeat,
  Settings2,
  Sunrise,
  Sunset,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SeasonResult, RainfallLevel } from "@/types/simulation";
import { cn } from "@/lib/utils";
import { useZoomPan } from "@/hooks/useZoomPan";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTimeOfDay, TimeOfDay, timeOfDayConfig } from "@/hooks/useTimeOfDay";

interface RiceFieldSimulationPanelProps {
  seasons: SeasonResult[];
  activeSeasonIndex: number;
  onSelectSeason: (index: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onStep: () => void;
  onReset: () => void;
}

type PlaybackSpeed = 0.5 | 1 | 2;

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

const TimeIcon = ({ time }: { time: TimeOfDay }) => {
  switch (time) {
    case "sunrise":
      return <Sunrise className="w-3.5 h-3.5 text-orange-400" />;
    case "noon":
      return <Sun className="w-3.5 h-3.5 text-amber-500" />;
    case "sunset":
      return <Sunset className="w-3.5 h-3.5 text-rose-400" />;
    case "night":
      return <Moon className="w-3.5 h-3.5 text-indigo-300" />;
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
  const prefersReducedMotion = useReducedMotion();

  // Enhanced state
  const [smoothTransitions, setSmoothTransitions] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [isLooping, setIsLooping] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [enableTimeOfDay, setEnableTimeOfDay] = useState(true);

  // Time of day cycling
  const { currentTime, timeIndex, times, setTime, resetTime } = useTimeOfDay({
    periodDuration: 2500,
    autoAdvance: enableTimeOfDay,
    isPaused: !isPlaying,
    speed: playbackSpeed,
  });

  // Zoom and pan
  const {
    containerRef,
    scale,
    translateX,
    translateY,
    handleDoubleClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetZoom,
    panTo,
    isZoomed,
  } = useZoomPan({ minScale: 1, maxScale: 3 });

  // Timeline scrubbing
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const effectiveTransitions = smoothTransitions && !prefersReducedMotion;

  // Calculate interval based on speed
  const getIntervalMs = useCallback(() => {
    const baseInterval = 800;
    return baseInterval / playbackSpeed;
  }, [playbackSpeed]);
 
   useEffect(() => {
     if (isPlaying && seasons.length > 0) {
       intervalRef.current = setInterval(() => {
         if (activeSeasonIndex < seasons.length - 1) {
           onSelectSeason(activeSeasonIndex + 1);
         } else if (isLooping) {
           onSelectSeason(0);
         } else {
           onPlayPause();
         }
       }, getIntervalMs());
     }
     return () => {
       if (intervalRef.current) clearInterval(intervalRef.current);
     };
   }, [isPlaying, activeSeasonIndex, seasons.length, onSelectSeason, isLooping, getIntervalMs, onPlayPause]);
 
   // Timeline scrubbing handlers
   const handleTimelineMouseDown = useCallback((e: React.MouseEvent) => {
     setIsDragging(true);
     handleTimelineScrub(e);
   }, []);
 
   const handleTimelineScrub = useCallback((e: React.MouseEvent) => {
     if (!timelineRef.current || seasons.length === 0) return;
     const rect = timelineRef.current.getBoundingClientRect();
     const x = e.clientX - rect.left;
     const progress = Math.max(0, Math.min(1, x / rect.width));
     const seasonIndex = Math.round(progress * (seasons.length - 1));
     onSelectSeason(seasonIndex);
   }, [seasons.length, onSelectSeason]);
 
   const handleTimelineMouseMove = useCallback((e: React.MouseEvent) => {
     if (isDragging) handleTimelineScrub(e);
   }, [isDragging, handleTimelineScrub]);
 
   const handleTimelineMouseUp = useCallback(() => {
     setIsDragging(false);
   }, []);
 
   // Keyboard shortcuts
   useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
       if (e.target instanceof HTMLInputElement) return;
       switch (e.key) {
         case " ":
           e.preventDefault();
           onPlayPause();
           break;
         case "ArrowRight":
           onStep();
           break;
         case "ArrowLeft":
           onSelectSeason(Math.max(0, activeSeasonIndex - 1));
           break;
         case "r":
           onReset();
           break;
         case "0":
           resetZoom();
           break;
       }
     };
     window.addEventListener("keydown", handleKeyDown);
     return () => window.removeEventListener("keydown", handleKeyDown);
   }, [onPlayPause, onStep, onReset, resetZoom, activeSeasonIndex, onSelectSeason]);
 
   // Minimap click handler
   const handleMinimapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
     const rect = e.currentTarget.getBoundingClientRect();
     const clickX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
     const clickY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
     
     if (containerRef.current) {
       const parentRect = containerRef.current.getBoundingClientRect();
       const maxX = (parentRect.width * (scale - 1)) / 2;
       const maxY = (parentRect.height * (scale - 1)) / 2;
       panTo(-clickX * maxX, -clickY * maxY);
     }
   }, [scale, panTo, containerRef]);
 
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
 
   const viewportPercent = 100 / scale;
   const viewportX = 50 - (translateX / (containerRef.current?.offsetWidth || 1)) * 50 / (scale - 1 || 1);
   const viewportY = 50 - (translateY / (containerRef.current?.offsetHeight || 1)) * 50 / (scale - 1 || 1);
 
   return (
     <TooltipProvider>
       <Card className="panel h-full">
         <CardHeader className="panel-header flex flex-row items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-serif text-lg">Rice Field Simulation</h3>
              <span
                className={cn(
                  "status-pill transition-all",
                  effectiveTransitions && "duration-500",
                  currentSeason?.rainfall === "low" && "status-pill-low",
                  currentSeason?.rainfall === "normal" && "status-pill-normal",
                  currentSeason?.rainfall === "high" && "status-pill-high"
                )}
              >
                {currentSeason && getStatusText(currentSeason)}
              </span>
              {/* Time of day indicator */}
              {enableTimeOfDay && (
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all",
                  effectiveTransitions && "duration-500",
                  currentTime === "sunrise" && "bg-orange-100 text-orange-700",
                  currentTime === "noon" && "bg-amber-100 text-amber-700",
                  currentTime === "sunset" && "bg-rose-100 text-rose-700",
                  currentTime === "night" && "bg-indigo-100 text-indigo-700"
                )}>
                  <TimeIcon time={currentTime} />
                  {timeOfDayConfig[currentTime].label}
                </span>
              )}
            </div>
           <div className="flex items-center gap-2">
             {/* Playback controls */}
             <Tooltip>
               <TooltipTrigger asChild>
                 <Button
                   variant="outline"
                   size="icon"
                   onClick={onPlayPause}
                   aria-label={isPlaying ? "Pause (Space)" : "Play (Space)"}
                 >
                   {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                 </Button>
               </TooltipTrigger>
               <TooltipContent>
                 <p>{isPlaying ? "Pause" : "Play"} (Space)</p>
               </TooltipContent>
             </Tooltip>
 
             <Tooltip>
               <TooltipTrigger asChild>
                 <Button
                   variant="outline"
                   size="icon"
                   onClick={onStep}
                   aria-label="Next season (→)"
                 >
                   <SkipForward className="w-4 h-4" />
                 </Button>
               </TooltipTrigger>
               <TooltipContent>
                 <p>Next season (→)</p>
               </TooltipContent>
             </Tooltip>
 
             <Tooltip>
               <TooltipTrigger asChild>
                 <Button
                   variant="outline"
                   size="icon"
                   onClick={onReset}
                   aria-label="Reset (R)"
                 >
                   <RotateCcw className="w-4 h-4" />
                 </Button>
               </TooltipTrigger>
               <TooltipContent>
                 <p>Reset (R)</p>
               </TooltipContent>
             </Tooltip>
 
             <div className="w-px h-6 bg-border mx-1" />
 
             {/* Loop toggle */}
             <Tooltip>
               <TooltipTrigger asChild>
                 <Button
                   variant={isLooping ? "default" : "outline"}
                   size="icon"
                   onClick={() => setIsLooping(!isLooping)}
                   aria-label={isLooping ? "Loop enabled" : "Loop disabled"}
                 >
                   <Repeat className="w-4 h-4" />
                 </Button>
               </TooltipTrigger>
               <TooltipContent>
                 <p>{isLooping ? "Loop on" : "Loop off"}</p>
               </TooltipContent>
             </Tooltip>
 
             {/* Settings popover */}
             <Popover>
               <PopoverTrigger asChild>
                 <Button variant="outline" size="icon" aria-label="Settings">
                   <Settings2 className="w-4 h-4" />
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-64" align="end">
                 <div className="space-y-4">
                   <div className="space-y-2">
                     <label className="text-sm font-medium">Playback Speed</label>
                     <div className="flex gap-2">
                       {([0.5, 1, 2] as PlaybackSpeed[]).map((speed) => (
                         <Button
                           key={speed}
                           variant={playbackSpeed === speed ? "default" : "outline"}
                           size="sm"
                           onClick={() => setPlaybackSpeed(speed)}
                           className="flex-1"
                         >
                           {speed}x
                         </Button>
                       ))}
                     </div>
                   </div>
                   <div className="flex items-center justify-between">
                     <label className="text-sm font-medium">Smooth Transitions</label>
                     <Switch
                       checked={smoothTransitions}
                       onCheckedChange={setSmoothTransitions}
                       aria-label="Toggle smooth transitions"
                     />
                   </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Show Minimap</label>
                      <Switch
                        checked={showMinimap}
                        onCheckedChange={setShowMinimap}
                        aria-label="Toggle minimap"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Day/Night Cycle</label>
                      <Switch
                        checked={enableTimeOfDay}
                        onCheckedChange={setEnableTimeOfDay}
                        aria-label="Toggle time of day cycle"
                      />
                    </div>
                    {/* Time of day selector when enabled */}
                    {enableTimeOfDay && (
                      <div className="space-y-2 pt-2 border-t">
                        <label className="text-sm font-medium text-muted-foreground">Current Time</label>
                        <div className="flex gap-1">
                          {times.map((time) => (
                            <Tooltip key={time}>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={currentTime === time ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setTime(time)}
                                  className="flex-1 px-2"
                                >
                                  <TimeIcon time={time} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{timeOfDayConfig[time].label}</p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
               </PopoverContent>
             </Popover>
           </div>
         </CardHeader>
 
         <CardContent className="p-4 space-y-4">
           {/* Simulation Stage with Zoom/Pan */}
           <div
             ref={containerRef}
             className={cn(
               "relative aspect-video rounded-lg overflow-hidden border border-border select-none",
               isZoomed && "cursor-grab active:cursor-grabbing"
             )}
             onDoubleClick={handleDoubleClick}
             onMouseDown={handleMouseDown}
             onMouseMove={handleMouseMove}
             onMouseUp={handleMouseUp}
             onMouseLeave={handleMouseUp}
             role="img"
             aria-label={`Rice field visualization showing ${currentSeason?.rainfall} rainfall conditions with ${currentSeason?.yield} tons per hectare yield. Season ${activeSeasonIndex + 1} of ${seasons.length}. ${isZoomed ? `Zoomed to ${scale.toFixed(1)}x` : "Double-click to zoom"}`}
           >
             <div
               className={cn(
                 "w-full h-full origin-center",
                 effectiveTransitions && "transition-transform duration-300"
               )}
               style={{
                 transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
               }}
             >
                <RiceFieldVisual
                  rainfall={currentSeason?.rainfall || "normal"}
                  timeOfDay={enableTimeOfDay ? currentTime : "noon"}
                  smoothTransitions={effectiveTransitions}
                  isPaused={!isPlaying}
                />
             </div>
 
             {/* Zoom controls */}
             <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Button
                     variant="secondary"
                     size="icon"
                     className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                     onClick={() => {
                       if (scale < 3) {
                         const event = new WheelEvent("wheel", { deltaY: -100 });
                         containerRef.current?.dispatchEvent(event);
                       }
                     }}
                     aria-label="Zoom in"
                   >
                     <ZoomIn className="w-4 h-4" />
                   </Button>
                 </TooltipTrigger>
                 <TooltipContent side="left">Zoom in</TooltipContent>
               </Tooltip>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Button
                     variant="secondary"
                     size="icon"
                     className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                     onClick={() => {
                       if (scale > 1) {
                         const event = new WheelEvent("wheel", { deltaY: 100 });
                         containerRef.current?.dispatchEvent(event);
                       }
                     }}
                     aria-label="Zoom out"
                   >
                     <ZoomOut className="w-4 h-4" />
                   </Button>
                 </TooltipTrigger>
                 <TooltipContent side="left">Zoom out</TooltipContent>
               </Tooltip>
               {isZoomed && (
                 <Tooltip>
                   <TooltipTrigger asChild>
                     <Button
                       variant="secondary"
                       size="icon"
                       className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                       onClick={resetZoom}
                       aria-label="Reset zoom (0)"
                     >
                       <Maximize2 className="w-4 h-4" />
                     </Button>
                   </TooltipTrigger>
                   <TooltipContent side="left">Reset zoom (0)</TooltipContent>
                 </Tooltip>
               )}
             </div>
 
             {/* Minimap */}
             {isZoomed && showMinimap && (
               <div
                 className="absolute bottom-2 left-2 w-24 h-16 bg-background/90 backdrop-blur-sm rounded border border-border overflow-hidden cursor-pointer z-10"
                 onClick={handleMinimapClick}
                 aria-label="Minimap navigation"
               >
                 <div className="w-full h-full relative">
                    <RiceFieldVisual
                      rainfall={currentSeason?.rainfall || "normal"}
                      timeOfDay="noon"
                      smoothTransitions={false}
                      isPaused={true}
                      isMinimized={true}
                    />
                   {/* Viewport indicator */}
                   <div
                     className="absolute border-2 border-primary bg-primary/20 pointer-events-none"
                     style={{
                       width: `${viewportPercent}%`,
                       height: `${viewportPercent}%`,
                       left: `${Math.max(0, Math.min(100 - viewportPercent, viewportX - viewportPercent / 2))}%`,
                       top: `${Math.max(0, Math.min(100 - viewportPercent, viewportY - viewportPercent / 2))}%`,
                     }}
                   />
                 </div>
               </div>
             )}
 
             {/* Zoom level indicator */}
             {isZoomed && (
               <div className="absolute bottom-2 right-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded text-xs font-medium z-10">
                 {scale.toFixed(1)}x
               </div>
             )}
           </div>
 
           {/* Enhanced Timeline Scrubber */}
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <p className="text-sm text-muted-foreground">
                 Season {activeSeasonIndex + 1} of {seasons.length}
               </p>
               <p className="text-xs text-muted-foreground">
                 Speed: {playbackSpeed}x • {isLooping ? "Looping" : "Once"}
               </p>
             </div>
 
             {/* Continuous timeline bar */}
             <div
               ref={timelineRef}
               className="relative h-8 bg-muted rounded-full cursor-pointer group"
               onMouseDown={handleTimelineMouseDown}
               onMouseMove={handleTimelineMouseMove}
               onMouseUp={handleTimelineMouseUp}
               onMouseLeave={handleTimelineMouseUp}
               role="slider"
               aria-label="Season timeline"
               aria-valuemin={1}
               aria-valuemax={seasons.length}
               aria-valuenow={activeSeasonIndex + 1}
               tabIndex={0}
             >
               {/* Progress fill */}
               <div
                 className={cn(
                   "absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-primary/60 to-primary",
                   effectiveTransitions && "transition-all duration-300"
                 )}
                 style={{ width: `${((activeSeasonIndex + 1) / seasons.length) * 100}%` }}
               />
 
               {/* Season markers */}
               {seasons.map((season, idx) => (
                 <Tooltip key={idx}>
                   <TooltipTrigger asChild>
                     <div
                       className={cn(
                         "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 cursor-pointer transition-all duration-200",
                         idx === activeSeasonIndex
                           ? "w-5 h-5 border-primary bg-background ring-2 ring-primary ring-offset-2"
                           : idx < activeSeasonIndex
                           ? "border-primary-foreground bg-primary"
                           : "border-muted-foreground bg-background",
                         season.rainfall === "low" && idx > activeSeasonIndex && "border-amber-400",
                         season.rainfall === "normal" && idx > activeSeasonIndex && "border-primary",
                         season.rainfall === "high" && idx > activeSeasonIndex && "border-blue-400"
                       )}
                       style={{ left: `${((idx + 0.5) / seasons.length) * 100}%` }}
                       onClick={(e) => {
                         e.stopPropagation();
                         onSelectSeason(idx);
                       }}
                     />
                   </TooltipTrigger>
                   <TooltipContent>
                     <p className="font-medium">Season {idx + 1}</p>
                     <p className="text-xs text-muted-foreground capitalize">
                       {season.rainfall} rainfall • {season.yield.toFixed(1)} t/ha
                     </p>
                   </TooltipContent>
                 </Tooltip>
               ))}
             </div>
 
             {/* Icon timeline (compact) */}
             <div
               className="flex gap-1 flex-wrap justify-center"
               role="tablist"
               aria-label="Season icons"
             >
               {seasons.map((season, idx) => (
                 <button
                   key={idx}
                   onClick={() => onSelectSeason(idx)}
                   role="tab"
                   aria-selected={idx === activeSeasonIndex}
                   aria-label={`Season ${idx + 1}: ${season.rainfall} rainfall, ${season.yield} tons per hectare`}
                   className={cn(
                     "w-6 h-6 rounded-full flex items-center justify-center cursor-pointer border-2 transition-all duration-200",
                     idx === activeSeasonIndex && "ring-2 ring-primary ring-offset-1 scale-110",
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
     </TooltipProvider>
   );
 }
 
interface RiceFieldVisualProps {
  rainfall: RainfallLevel;
  timeOfDay?: TimeOfDay;
  smoothTransitions?: boolean;
  isPaused?: boolean;
  isMinimized?: boolean;
}

function RiceFieldVisual({
  rainfall,
  timeOfDay = "noon",
  smoothTransitions = true,
  isPaused = false,
  isMinimized = false,
}: RiceFieldVisualProps) {
  const transitionClass = smoothTransitions ? "transition-all duration-700 ease-in-out" : "";
  const config = timeOfDayConfig[timeOfDay];

  // Combine time of day and rainfall for sky gradient
  const skyStyles = useMemo(() => {
    // Base sky from time of day
    let fromColor = config.skyGradient.from;
    let toColor = config.skyGradient.to;
    
    // Modify based on rainfall
    if (rainfall === "high") {
      // Stormy overlay - darken the sky
      if (timeOfDay === "night") {
        fromColor = "hsl(230 50% 10%)";
        toColor = "hsl(240 40% 20%)";
      } else {
        fromColor = "hsl(220 35% 40%)";
        toColor = "hsl(210 30% 55%)";
      }
    } else if (rainfall === "low" && timeOfDay === "noon") {
      // Extra bright for drought at noon
      fromColor = "hsl(200 80% 75%)";
      toColor = "hsl(45 75% 88%)";
    }
    
    return {
      background: `linear-gradient(180deg, ${fromColor} 0%, ${toColor} 100%)`,
    };
  }, [rainfall, timeOfDay, config]);

  const waterLevel = rainfall === "low" ? 2 : rainfall === "normal" ? 12 : 24;
  const plantDensity = isMinimized ? 6 : rainfall === "low" ? 10 : rainfall === "normal" ? 18 : 14;
  const plantHealth = rainfall === "low" ? 0.6 : rainfall === "normal" ? 1 : 0.85;
  
  // Adjust ambient light based on time
  const ambientFilter = `brightness(${config.ambientLight})`;
  
  // Sun/Moon visibility based on time and weather
  const showSun = config.sunPosition.visible && rainfall !== "high";
  const showMoon = config.moonVisible && rainfall !== "high";
  const showStars = config.starOpacity > 0 && rainfall !== "high";

  // Sun color changes by time
  const sunColor = timeOfDay === "sunrise" ? "hsl(35 90% 55%)" : 
                   timeOfDay === "sunset" ? "hsl(20 85% 50%)" : 
                   "hsl(45 95% 60%)";

  return (
    <div
      className={cn("relative w-full h-full overflow-hidden", transitionClass)}
      style={{
        ...skyStyles,
        filter: ambientFilter,
      }}
    >
      {/* Stars (for night) */}
      {showStars && !isMinimized && (
        <div 
          className={cn("absolute inset-0 pointer-events-none", transitionClass)}
          style={{ opacity: config.starOpacity }}
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute rounded-full bg-white",
                !isPaused && "animate-[twinkle_3s_ease-in-out_infinite]"
              )}
              style={{
                width: Math.random() > 0.7 ? "3px" : "2px",
                height: Math.random() > 0.7 ? "3px" : "2px",
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 40}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Moon (for night) */}
      {showMoon && (
        <div
          className={cn(
            "absolute",
            transitionClass,
            !isPaused && "animate-[moon-glow_4s_ease-in-out_infinite]"
          )}
          style={{
            top: isMinimized ? "8%" : "8%",
            right: isMinimized ? "15%" : "20%",
          }}
        >
          <div 
            className={cn(
              "rounded-full bg-gradient-to-br from-slate-100 to-slate-200",
              isMinimized ? "w-4 h-4" : "w-10 h-10"
            )}
            style={{
              boxShadow: "0 0 20px hsl(45 20% 90% / 0.5)",
            }}
          >
            {/* Moon craters */}
            {!isMinimized && (
              <>
                <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-slate-300/50" />
                <div className="absolute top-4 right-3 w-1.5 h-1.5 rounded-full bg-slate-300/40" />
                <div className="absolute bottom-2 left-4 w-1 h-1 rounded-full bg-slate-300/30" />
              </>
            )}
          </div>
        </div>
      )}

      {/* Sun (position varies by time) */}
      {showSun && (
        <div
          className={cn(
            "absolute",
            transitionClass,
            !isPaused && "animate-sun-pulse"
          )}
          style={{
            top: `${config.sunPosition.y}%`,
            left: timeOfDay === "sunrise" ? `${config.sunPosition.x}%` : "auto",
            right: timeOfDay !== "sunrise" ? `${100 - config.sunPosition.x}%` : "auto",
            transform: "translate(-50%, -50%)",
          }}
        >
          <div 
            className={cn("rounded-full shadow-lg", isMinimized ? "w-4 h-4" : "w-12 h-12")} 
            style={{ backgroundColor: sunColor }}
          />
          {/* Sun rays */}
          {!isMinimized && (
            <div className={cn("absolute inset-0", !isPaused && "animate-spin-slow")}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-0.5 h-4 origin-bottom"
                  style={{
                    backgroundColor: `${sunColor}99`,
                    transform: `translate(-50%, -100%) rotate(${i * 45}deg) translateY(-8px)`,
                  }}
                />
              ))}
            </div>
          )}
          {/* Sunrise/sunset glow */}
          {(timeOfDay === "sunrise" || timeOfDay === "sunset") && !isMinimized && (
            <div 
              className={cn(
                "absolute -inset-8 rounded-full pointer-events-none",
                !isPaused && "animate-[sunrise-pulse_3s_ease-in-out_infinite]"
              )}
              style={{
                background: `radial-gradient(circle, ${sunColor}40 0%, transparent 70%)`,
              }}
            />
          )}
        </div>
      )}

      {/* Clouds with smooth transition - tinted by time */}
      <div
        className={cn(
          transitionClass,
          rainfall === "low" && timeOfDay !== "night" ? "opacity-20" : 
          rainfall === "low" && timeOfDay === "night" ? "opacity-0" : "opacity-100"
        )}
      >
        <div className={cn("absolute top-4 left-8", !isPaused && "animate-cloud-drift")}>
          <CloudShape
            dark={rainfall === "high"}
            tint={config.cloudTint}
            size={isMinimized ? "small" : "medium"}
            smoothTransitions={smoothTransitions}
          />
        </div>
        <div
          className={cn("absolute top-8 right-12", !isPaused && "animate-cloud-drift")}
          style={{ animationDelay: "2s" }}
        >
          <CloudShape
            dark={rainfall === "high"}
            tint={config.cloudTint}
            size="small"
            smoothTransitions={smoothTransitions}
          />
        </div>
        <div
          className={cn(
            "absolute top-2 left-1/3",
            transitionClass,
            rainfall === "high" ? "opacity-100" : "opacity-0",
            !isPaused && "animate-cloud-drift"
          )}
          style={{ animationDelay: "4s" }}
        >
          <CloudShape 
            dark 
            tint={rainfall === "high" ? undefined : config.cloudTint}
            size={isMinimized ? "medium" : "large"} 
            smoothTransitions={smoothTransitions} 
          />
        </div>
      </div>

      {/* Rain drops */}
      <RainDrops
        active={rainfall === "high"}
        smoothTransitions={smoothTransitions}
        isPaused={isPaused}
        isMinimized={isMinimized}
      />

      {/* Fireflies at night */}
      {timeOfDay === "night" && !isMinimized && !isPaused && rainfall !== "high" && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-yellow-300 animate-[firefly_4s_ease-in-out_infinite]"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${40 + Math.random() * 40}%`,
                animationDelay: `${i * 0.7}s`,
                boxShadow: "0 0 6px hsl(60 80% 60% / 0.8)",
              }}
            />
          ))}
        </div>
      )}

      {/* Horizon line - tinted by time */}
      <div 
        className={cn("absolute bottom-1/3 w-full h-px", transitionClass)}
        style={{ 
          backgroundColor: timeOfDay === "night" ? "hsl(230 20% 15%)" : "hsl(25 40% 30% / 0.3)" 
        }}
      />

      {/* Paddy field with smooth transitions */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-1/3",
          transitionClass
        )}
        style={{
          background: timeOfDay === "night" 
            ? `linear-gradient(180deg, hsl(230 25% 18%) 0%, hsl(230 20% 12%) 100%)`
            : `linear-gradient(180deg, hsl(25 ${35 - (rainfall === "low" ? 10 : 0)}% ${(35 + (rainfall === "low" ? 5 : 0)) * config.ambientLight}%) 0%, hsl(20 30% ${25 * config.ambientLight}%) 100%)`,
        }}
      >
        {/* Water with smooth level transition - tinted by time */}
        <div
          className={cn("absolute bottom-0 left-0 right-0", transitionClass)}
          style={{ 
            height: `${waterLevel}px`,
            backgroundColor: `${config.waterTint}99`,
          }}
        >
          {/* Water shimmer effect */}
          {!isMinimized && !isPaused && rainfall !== "low" && (
            <div 
              className="absolute inset-0 animate-water-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" 
              style={{ opacity: timeOfDay === "night" ? 0.3 : 1 }}
            />
          )}
        </div>

        {/* Rice plants */}
        <div className={cn("absolute bottom-1 left-0 right-0 flex justify-around items-end", isMinimized ? "px-1" : "px-4")}>
          {Array.from({ length: plantDensity }).map((_, i) => (
            <RicePlant
              key={i}
              height={isMinimized ? 8 : rainfall === "low" ? 20 : 35}
              health={plantHealth}
              delay={i * 0.1}
              isPaused={isPaused}
              smoothTransitions={smoothTransitions}
              isMinimized={isMinimized}
              timeOfDay={timeOfDay}
            />
          ))}
        </div>

        {/* Small hut with lighting */}
        {!isMinimized && (
          <div className="absolute bottom-6 right-8">
            <Hut timeOfDay={timeOfDay} />
          </div>
        )}
      </div>

      {/* Cracked soil texture for drought */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none",
          transitionClass,
          rainfall === "low" ? "opacity-30" : "opacity-0"
        )}
      >
        <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
          <path d="M10 0 L12 25 L8 50" stroke="hsl(25 30% 20%)" strokeWidth="0.5" fill="none" />
          <path d="M30 0 L28 30 L35 50" stroke="hsl(25 30% 20%)" strokeWidth="0.5" fill="none" />
          <path d="M50 5 L48 25 L55 45" stroke="hsl(25 30% 20%)" strokeWidth="0.5" fill="none" />
          <path d="M70 0 L72 35 L68 50" stroke="hsl(25 30% 20%)" strokeWidth="0.5" fill="none" />
          <path d="M90 10 L88 30 L92 50" stroke="hsl(25 30% 20%)" strokeWidth="0.5" fill="none" />
        </svg>
      </div>
    </div>
  );
}
 
function CloudShape({
  dark = false,
  tint,
  size = "medium",
  smoothTransitions = true,
}: {
  dark?: boolean;
  tint?: string;
  size?: "small" | "medium" | "large";
  smoothTransitions?: boolean;
}) {
  const sizeClasses = {
    small: "w-12 h-6",
    medium: "w-16 h-8",
    large: "w-24 h-12",
  };

  // Use tint if provided, otherwise default colors
  const bgColor = tint || (dark ? "hsl(220 20% 35%)" : "hsla(0 0% 100% / 0.8)");

  return (
    <div
      className={cn(
        "rounded-full",
        sizeClasses[size],
        smoothTransitions && "transition-colors duration-700"
      )}
      style={{
        backgroundColor: dark && !tint ? "hsl(220 20% 35%)" : bgColor,
      }}
    />
  );
}
 
 function RainDrops({
   active,
   smoothTransitions,
   isPaused,
   isMinimized,
 }: {
   active: boolean;
   smoothTransitions: boolean;
   isPaused: boolean;
   isMinimized: boolean;
 }) {
   const dropCount = isMinimized ? 10 : 30;
 
   return (
     <div
       className={cn(
         "absolute inset-0 overflow-hidden pointer-events-none",
         smoothTransitions && "transition-opacity duration-500",
         active ? "opacity-100" : "opacity-0"
       )}
     >
       {Array.from({ length: dropCount }).map((_, i) => (
         <div
           key={i}
           className={cn(
             "absolute bg-rain-blue/60",
             isMinimized ? "w-px h-2" : "w-0.5 h-4",
             active && !isPaused && "animate-rain"
           )}
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
 
function RicePlant({
  height,
  health,
  delay,
  isPaused,
  smoothTransitions,
  isMinimized,
  timeOfDay = "noon",
}: {
  height: number;
  health: number;
  delay: number;
  isPaused: boolean;
  smoothTransitions: boolean;
  isMinimized: boolean;
  timeOfDay?: TimeOfDay;
}) {
  const config = timeOfDayConfig[timeOfDay];
  const lightMultiplier = config.ambientLight;
  
  // Adjust colors based on time of day
  const baseStemLightness = 35 + (1 - health) * 15;
  const adjustedStemLightness = baseStemLightness * lightMultiplier;
  const stemColor = `hsl(95 ${45 * health}% ${Math.max(10, adjustedStemLightness)}%)`;
  
  const baseGrainLightness = 50 + (1 - health) * 10;
  const adjustedGrainLightness = baseGrainLightness * lightMultiplier;
  const grainColor = `hsl(45 ${70 * health}% ${Math.max(15, adjustedGrainLightness)}%)`;

  return (
    <div
      className={cn(
        "flex flex-col items-center origin-bottom",
        !isPaused && "animate-sway",
        smoothTransitions && "transition-all duration-500"
      )}
      style={{
        animationDelay: `${delay}s`,
        height: `${height}px`,
      }}
    >
      <div
        className={cn("flex-1", smoothTransitions && "transition-colors duration-500")}
        style={{
          width: isMinimized ? "1px" : "2px",
          backgroundColor: stemColor,
        }}
      />
      <div
        className={cn(
          "rounded-full -mt-1 transform rotate-12",
          smoothTransitions && "transition-all duration-500"
        )}
        style={{
          width: isMinimized ? "3px" : "8px",
          height: isMinimized ? "4px" : "12px",
          backgroundColor: grainColor,
        }}
      />
    </div>
  );
}

function Hut({ timeOfDay = "noon" }: { timeOfDay?: TimeOfDay }) {
  const isNight = timeOfDay === "night";
  const config = timeOfDayConfig[timeOfDay];
  
  // Adjust hut colors based on ambient light
  const roofLightness = 35 * config.ambientLight;
  const wallLightness = 50 * config.ambientLight;
  const doorLightness = 25 * config.ambientLight;
  
  return (
    <svg width="30" height="25" viewBox="0 0 30 25">
      {/* Roof */}
      <polygon points="15,0 0,12 30,12" fill={`hsl(25 50% ${Math.max(15, roofLightness)}%)`} />
      {/* Walls */}
      <rect x="5" y="12" width="20" height="13" fill={`hsl(35 30% ${Math.max(20, wallLightness)}%)`} />
      {/* Door */}
      <rect x="12" y="17" width="6" height="8" fill={`hsl(25 40% ${Math.max(10, doorLightness)}%)`} />
      {/* Window light at night */}
      {isNight && (
        <>
          <rect x="7" y="15" width="4" height="4" fill="hsl(45 80% 70%)" opacity="0.9" />
          {/* Window glow */}
          <rect x="6" y="14" width="6" height="6" fill="hsl(45 80% 70%)" opacity="0.3" />
        </>
      )}
    </svg>
  );
}

export default RiceFieldSimulationPanel;