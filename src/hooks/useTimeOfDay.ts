import { useState, useEffect, useCallback } from "react";

export type TimeOfDay = "sunrise" | "noon" | "sunset" | "night";

const TIME_ORDER: TimeOfDay[] = ["sunrise", "noon", "sunset", "night"];

interface UseTimeOfDayOptions {
  /** Duration of each time period in ms */
  periodDuration?: number;
  /** Whether to cycle automatically */
  autoAdvance?: boolean;
  /** Whether time is paused */
  isPaused?: boolean;
  /** Playback speed multiplier */
  speed?: number;
}

export function useTimeOfDay(options: UseTimeOfDayOptions = {}) {
  const {
    periodDuration = 2000,
    autoAdvance = true,
    isPaused = false,
    speed = 1,
  } = options;

  const [timeIndex, setTimeIndex] = useState(1); // Start at noon
  const currentTime = TIME_ORDER[timeIndex];

  const advanceTime = useCallback(() => {
    setTimeIndex((prev) => (prev + 1) % TIME_ORDER.length);
  }, []);

  const setTime = useCallback((time: TimeOfDay) => {
    const idx = TIME_ORDER.indexOf(time);
    if (idx >= 0) setTimeIndex(idx);
  }, []);

  const resetTime = useCallback(() => {
    setTimeIndex(1); // Reset to noon
  }, []);

  useEffect(() => {
    if (!autoAdvance || isPaused) return;

    const interval = setInterval(() => {
      advanceTime();
    }, periodDuration / speed);

    return () => clearInterval(interval);
  }, [autoAdvance, isPaused, periodDuration, speed, advanceTime]);

  return {
    currentTime,
    timeIndex,
    advanceTime,
    setTime,
    resetTime,
    times: TIME_ORDER,
  };
}

// Time-of-day visual configurations
export const timeOfDayConfig: Record<TimeOfDay, {
  skyGradient: { from: string; to: string };
  ambientLight: number; // 0-1 brightness multiplier
  sunPosition: { x: number; y: number; visible: boolean };
  moonVisible: boolean;
  starOpacity: number;
  cloudTint: string;
  waterTint: string;
  label: string;
  icon: string;
}> = {
  sunrise: {
    skyGradient: {
      from: "hsl(25 80% 60%)",
      to: "hsl(45 70% 75%)",
    },
    ambientLight: 0.7,
    sunPosition: { x: 15, y: 60, visible: true },
    moonVisible: false,
    starOpacity: 0,
    cloudTint: "hsl(25 50% 80%)",
    waterTint: "hsl(25 40% 50%)",
    label: "Sunrise",
    icon: "🌅",
  },
  noon: {
    skyGradient: {
      from: "hsl(200 80% 70%)",
      to: "hsl(200 60% 85%)",
    },
    ambientLight: 1,
    sunPosition: { x: 50, y: 10, visible: true },
    moonVisible: false,
    starOpacity: 0,
    cloudTint: "hsl(0 0% 100%)",
    waterTint: "hsl(200 60% 50%)",
    label: "Noon",
    icon: "☀️",
  },
  sunset: {
    skyGradient: {
      from: "hsl(15 75% 50%)",
      to: "hsl(280 40% 45%)",
    },
    ambientLight: 0.6,
    sunPosition: { x: 85, y: 55, visible: true },
    moonVisible: false,
    starOpacity: 0.2,
    cloudTint: "hsl(15 60% 65%)",
    waterTint: "hsl(15 50% 45%)",
    label: "Sunset",
    icon: "🌇",
  },
  night: {
    skyGradient: {
      from: "hsl(230 50% 15%)",
      to: "hsl(240 40% 25%)",
    },
    ambientLight: 0.3,
    sunPosition: { x: 0, y: 0, visible: false },
    moonVisible: true,
    starOpacity: 1,
    cloudTint: "hsl(230 20% 30%)",
    waterTint: "hsl(230 40% 25%)",
    label: "Night",
    icon: "🌙",
  },
};
