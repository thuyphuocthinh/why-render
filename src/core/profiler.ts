import { isEnabled } from "./config";
import { coreEmitter } from "./emitter";
import { ComponentReport, ProfilerOptions, RenderRecord } from "./types";

interface ComponentStat {
  renders: RenderRecord[];
}

export const componentStats = new Map<string, ComponentStat>();
const MAX_RECORDS_PER_COMPONENT = 50; // Giới hạn memory leak

/**
 * Main entry point for adapters to report a render
 */
export function reportRender(report: ComponentReport, options?: ProfilerOptions) {
  if (!isEnabled()) return;

  // 1. Emit render event
  coreEmitter.emit("render", { report });

  // 2. Check thresholds
  checkRenderThresholds(report.componentName, report.renderTimeMs, options);

  // 3. Record into stats for frequency analysis
  recordRender(report, options);
}

/**
 * Checks if a component exceeds the acceptable render duration.
 */
function checkRenderThresholds(
  componentName: string,
  timeMs: number,
  options?: ProfilerOptions,
) {
  const slowThresholdMs = options?.slowThresholdMs || 20;

  if (timeMs > slowThresholdMs) {
    coreEmitter.emit("threshold_warning", {
      componentName,
      timeMs,
      thresholdMs: slowThresholdMs,
    });
  }
}

/**
 * Records individual renders to track excessive re-renders in a short period.
 * Also cleans up old records to prevent memory leaks.
 */
function recordRender(
  report: ComponentReport,
  options?: ProfilerOptions,
) {
  const frequencyRenders = options?.frequencyRenders || 20;
  const frequencyTimeWindowMs = options?.frequencyTimeWindowMs || 5000;
  const now = report.timestamp;

  let stat = componentStats.get(report.componentName);
  if (!stat) {
    stat = { renders: [] };
    componentStats.set(report.componentName, stat);
  }

  // Clear out old timestamps that fall outside the current time window
  stat.renders = stat.renders.filter(
    (record) => now - record.timestamp < frequencyTimeWindowMs,
  );

  stat.renders.push({ 
    timestamp: now, 
    durationMs: report.renderTimeMs,
    baseDurationMs: report.baseDurationMs,
    isWasted: report.isWasted,
    reason: report.reason
  });

  // Keep memory in check
  if (stat.renders.length > MAX_RECORDS_PER_COMPONENT) {
    stat.renders = stat.renders.slice(-MAX_RECORDS_PER_COMPONENT);
  }

  // Burst Detection
  if (stat.renders.length > frequencyRenders) {
    coreEmitter.emit("burst_warning", {
      componentName: report.componentName,
      rendersCount: stat.renders.length,
      timeWindowMs: frequencyTimeWindowMs,
    });
    // Reset current bucket to avoid spamming
    stat.renders = [];
  }
}

/**
 * N(C, Δt)
 */
export function countRenders(componentName: string, timeWindowMs: number) {
  const stat = componentStats.get(componentName);
  if (!stat) return 0;
  return stat.renders.filter(
    (record) => performance.now() - record.timestamp < timeWindowMs,
  ).length;
}

/**
 * Memoization Efficiency: η = 1 - (T_actual / T_base)
 */
export function memoizationEfficiency(componentName: string, timeWindowMs: number) {
  const stat = componentStats.get(componentName);
  if (!stat || stat.renders.length === 0) return 0;
  
  const now = performance.now();
  const rendersInWindow = stat.renders.filter(
    (record) => now - record.timestamp < timeWindowMs,
  );

  if (rendersInWindow.length === 0) return 0;

  let totalActual = 0;
  let totalBase = 0;

  for (const render of rendersInWindow) {
    if (render.baseDurationMs && render.baseDurationMs > 0) {
      totalActual += render.durationMs;
      totalBase += render.baseDurationMs;
    }
  }

  if (totalBase === 0) return 0; // cannot calculate without base duration

  return 1 - (totalActual / totalBase);
}

/**
 * f(C) = N(C, Δt) / Δt
 */
export function renderFrequency(componentName: string, timeWindowMs: number) {
  const count = countRenders(componentName, timeWindowMs);
  return count / (timeWindowMs / 1000);
}