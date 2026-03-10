import { useCallback } from "react";

export type AnimationPhase = "track" | "split" | "remix" | "recombine";

interface PhaseInfo {
  phase: AnimationPhase;
  progress: number; // 0-1 within the current phase
}

const PHASES: { phase: AnimationPhase; start: number; end: number }[] = [
  { phase: "track", start: 0, end: 2 },
  { phase: "split", start: 2, end: 4 },
  { phase: "remix", start: 4, end: 7 },
  { phase: "recombine", start: 7, end: 9 },
];

const CYCLE_DURATION = 10;

export function useAnimationPhase(): {
  getPhase: (elapsedTime: number) => PhaseInfo;
} {
  const getPhase = useCallback((elapsedTime: number): PhaseInfo => {
    const t = elapsedTime % CYCLE_DURATION;

    if (t >= 9) {
      return { phase: "recombine", progress: 1 };
    }

    for (const { phase, start, end } of PHASES) {
      if (t >= start && t < end) {
        return { phase, progress: (t - start) / (end - start) };
      }
    }

    return { phase: "track", progress: 0 };
  }, []);

  return { getPhase };
}
