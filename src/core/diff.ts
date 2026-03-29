export interface DiffResult {
  key: string;
  prev: any;
  next: any;
}

/**
 * Perform a shallow equality check to identify changed properties
 */
export function shallowDiff(
  prev: Record<string, any> = {},
  next: Record<string, any> = {}
): DiffResult[] {
  const changes: DiffResult[] = [];
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);

  for (const key of allKeys) {
    if (Object.is(prev[key], next[key])) continue;

    changes.push({
      key,
      prev: prev[key],
      next: next[key],
    });
  }

  return changes;
}

/**
 * Format the diff changes into a readable reason string
 */
export function getRenderReason(changes: DiffResult[]): string {
  if (changes.length === 0) return '  - Unknown reason (forced update or deep state change)';

  return changes
    .map((c) => {
      const prevVal = formatValue(c.prev);
      const nextVal = formatValue(c.next);
      return `  - ${c.key} changed (${prevVal} -> ${nextVal})`;
    })
    .join('\n');
}

/**
 * Format string outputs safely
 */
function formatValue(val: any): string {
  if (typeof val === 'function') return 'Function';
  if (typeof val === 'object' && val !== null) return 'Object/Array';
  return String(val);
}
