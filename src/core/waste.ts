import { componentStats } from "./profiler";

/**
 * Check if a render is wasted
 */

type Diff<T = any> = {
  prev: T;
  next: T;
  valueEqual: (a: T, b: T) => boolean;
};

type RenderDiffs = {
  propsDiff: Diff[];
  stateDiff: Diff[];
  contextDiff: Diff[];
};

export function wasteDetection({
  propsDiff,
  stateDiff,
  contextDiff,
}: RenderDiffs): 0 | 1 {
  const allDiffs = [...propsDiff, ...stateDiff, ...contextDiff];

  // ∅ ∧ ∅ ∧ ∅
  if (allDiffs.length === 0) return 1;

  // ∀ d ∈ Diff: valueEqual(prev, next)
  const allUnchanged = allDiffs.every((d) => d.valueEqual(d.prev, d.next));

  return allUnchanged ? 1 : 0;
}

/**
 * Wasted ratio of all renders
 * ρ(C) = Σ W(r_i) / N(C, Δt)
 * Với:
 *  ρ ∈ [0, 1]
 *  ρ = 0     → không có render thừa
 *  ρ > 0.5   → hơn nửa số render là lãng phí → cần tối ưu ngay
 */
export function wastedRatio(
  componentName: string,
  timeWindowMs: number,
): number {
  const stat = componentStats.get(componentName);
  if (!stat || stat.renders.length === 0) return 0;

  const now = performance.now();
  const rendersInWindow = stat.renders.filter(
    (r) => now - r.timestamp < timeWindowMs,
  );

  if (rendersInWindow.length === 0) return 0;

  const wastedRendersCount = rendersInWindow.filter((r) => r.isWasted).length;
  return wastedRendersCount / rendersInWindow.length;
}

/**
 * Total wasted time of all wasted renders
 * Tổng thời gian CPU bị lãng phí cho render thừa:
 * T_wasted(C) = Σ { T_actual(r_i) : W(r_i) = 1 }
 * T_wasted_total = Σ T_wasted(C) cho mọi component C trong cây
 */
export function totalWastedTime(): number {
  let totalMs = 0;
  for (const stat of componentStats.values()) {
    for (const render of stat.renders) {
      if (render.isWasted) {
        totalMs += render.durationMs;
      }
    }
  }
  return totalMs;
}
