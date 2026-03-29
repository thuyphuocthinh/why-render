import { logWarning } from './logger';

export interface ProfilerOptions {
  slowThresholdMs?: number; // Warn if render duration exceed this (default 20ms)
  frequencyRenders?: number; // Max renders within a time window (default 20)
  frequencyTimeWindowMs?: number; // The time window (default 5000ms = 5s)
}

interface ComponentStat {
  renderTimestamps: number[];
}

const componentStats = new Map<string, ComponentStat>();

/**
 * Checks if a component exceeds the acceptable render duration.
 */
export function checkRenderThresholds(
  componentName: string,
  timeMs: number,
  options?: ProfilerOptions
) {
  const slowThresholdMs = options?.slowThresholdMs || 20;

  if (timeMs > slowThresholdMs) {
    logWarning(
      componentName,
      'slow',
      `render time: ${timeMs.toFixed(2)}ms (Threshold: ${slowThresholdMs}ms)`
    );
  }
}

/**
 * Records individual renders to track excessive re-renders in a short period.
 */
export function trackRenderFrequency(
  componentName: string,
  options?: ProfilerOptions
) {
  const frequencyRenders = options?.frequencyRenders || 20;
  const frequencyTimeWindowMs = options?.frequencyTimeWindowMs || 5000;
  const now = performance.now();

  let stat = componentStats.get(componentName);
  if (!stat) {
    stat = { renderTimestamps: [] };
    componentStats.set(componentName, stat);
  }

  // Clear out old timestamps that fall outside the current time window
  stat.renderTimestamps = stat.renderTimestamps.filter(
    (timestamp) => now - timestamp < frequencyTimeWindowMs
  );

  stat.renderTimestamps.push(now);

  // If we breach the threshold
  if (stat.renderTimestamps.length > frequencyRenders) {
    logWarning(
      componentName,
      'frequency',
      `renders: ${stat.renderTimestamps.length}\nduration: ${(frequencyTimeWindowMs / 1000).toFixed(1)} seconds`
    );
    // Reset current bucket to avoid spamming the console
    stat.renderTimestamps = [];
  }
}
