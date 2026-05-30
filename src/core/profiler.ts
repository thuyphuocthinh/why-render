import { logWarning } from "./logger";
import { isEnabled } from "./config";

export interface ProfilerOptions {
  slowThresholdMs?: number; // Warn if render duration exceed this (default 20ms)
  frequencyRenders?: number; // Max renders within a time window (default 20)
  frequencyTimeWindowMs?: number; // The time window (default 5000ms = 5s)
}

export interface RenderRecord {
  timestamp: number;
  durationMs: number;
  isWasted: boolean;
}

interface ComponentStat {
  renders: RenderRecord[];
}

export const componentStats = new Map<string, ComponentStat>();

/**
 * Checks if a component exceeds the acceptable render duration.
 */
export function checkRenderThresholds(
  componentName: string,
  timeMs: number,
  options?: ProfilerOptions,
) {
  if (!isEnabled()) return;

  const slowThresholdMs = options?.slowThresholdMs || 20;

  if (timeMs > slowThresholdMs) {
    logWarning(
      componentName,
      "slow",
      `render time: ${timeMs.toFixed(2)}ms (Threshold: ${slowThresholdMs}ms)`,
    );
  }
}

/**
 * Records individual renders to track excessive re-renders in a short period.
 * Tracks wasteful renders and durations.
 */
export function recordRender(
  componentName: string,
  durationMs: number,
  isWasted: boolean = false,
  options?: ProfilerOptions,
) {
  if (!isEnabled()) return;

  const frequencyRenders = options?.frequencyRenders || 20;
  const frequencyTimeWindowMs = options?.frequencyTimeWindowMs || 5000;
  const now = performance.now();

  let stat = componentStats.get(componentName);
  if (!stat) {
    stat = { renders: [] };
    componentStats.set(componentName, stat);
  }

  // Clear out old timestamps that fall outside the current time window
  stat.renders = stat.renders.filter(
    (record) => now - record.timestamp < frequencyTimeWindowMs,
  );

  stat.renders.push({ timestamp: now, durationMs, isWasted });

  // If we breach the threshold
  if (stat.renders.length > frequencyRenders) {
    logWarning(
      componentName,
      "frequency",
      `renders: ${stat.renders.length}\nduration: ${(frequencyTimeWindowMs / 1000).toFixed(1)} seconds`,
    );
    // Reset current bucket to avoid spamming the console
    stat.renders = [];
  }
}

/**
 * Backward compatible wrapper for renderBurstDetection
 */
export function renderBurstDetection(
  componentName: string,
  options?: ProfilerOptions,
) {
  // Use recordRender with 0 duration and not wasted if called directly
  recordRender(componentName, 0, false, options);
}

/**
 * Số lần render của component `C` trong khoảng thời gian `Δt`:
 * N(C, Δt) = |{ r_i : r_i.component = C ∧ r_i.timestamp ∈ [t, t + Δt] }|
 */
export function countRenders(componentName: string, timeWindowMs: number) {
  const stat = componentStats.get(componentName);
  if (!stat) return 0;
  return stat.renders.filter(
    (record) => performance.now() - record.timestamp < timeWindowMs,
  ).length;
}

/**
 * Tần suất render trung bình (renders/second):
 * f(C) = N(C, Δt) / Δt
 */
export function renderFrequency(componentName: string, timeWindowMs: number) {
  const count = countRenders(componentName, timeWindowMs);
  return count / (timeWindowMs / 1000);
}

/**
 * ```
η = 1 - (T_actual / T_base)
Với:
  η ∈ [0, 1]
  η = 0  → memo không có tác dụng (render toàn bộ)
  η = 1  → memo hoàn hảo (không render gì thêm)
  η < 0  → memo overhead > benefit (xảy ra khi cây nhỏ)
 */

export function memoizationEfficiency(componentName: string, timeWindowMs: number) {
  const stat = componentStats.get(componentName);
  if (!stat) return 0;
  return stat.renders.filter(
    (record) => performance.now() - record.timestamp < timeWindowMs,
  ).length;
}