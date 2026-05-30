export interface RenderReason {
  type: "props" | "state" | "hooks" | "parent" | "unknown";
  changedProps?: string[];
  changedKey?: string;
  oldValue?: unknown;
  newValue?: unknown;
  changes?: { key: string; prev: any; next: any }[];
}

export interface ComponentReport {
  componentName: string;
  framework: "react" | "vue";
  renderTimeMs: number;
  reason: RenderReason;
  timestamp: number;
  isWasted: boolean;
}

export interface ProfilerOptions {
  slowThresholdMs?: number; // Warn if render duration exceed this (default 20ms)
  frequencyRenders?: number; // Max renders within a time window (default 20)
  frequencyTimeWindowMs?: number; // The time window (default 5000ms = 5s)
}

export interface RenderRecord {
  timestamp: number;
  durationMs: number;
  isWasted: boolean;
  reason: RenderReason;
}
