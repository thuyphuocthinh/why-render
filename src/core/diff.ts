import { CHANGE_CLASSIFICATION } from "./";

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
  next: Record<string, any> = {},
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
  if (changes.length === 0)
    return "  - Unknown reason (forced update or deep state change)";

  return changes
    .map((c) => {
      const prevVal = formatValue(c.prev);
      const nextVal = formatValue(c.next);
      return `  - ${c.key} changed (${prevVal} -> ${nextVal})`;
    })
    .join("\n");
}

/**
 * Format string outputs safely
 */
function formatValue(val: any): string {
  if (typeof val === "function") return "Function";
  if (typeof val === "object" && val !== null) return "Object/Array";
  return String(val);
}

/**
 *
 * @param prev
 * @param next
 * @param maxDepth
 * @param currentDepth
 * @return boolean
 * Object Deep comparison
 */
export function deepEqual(
  prev: any,
  next: any,
  maxDepth: number = 5,
  currentDepth: number = 0,
) {
  if (currentDepth > maxDepth) return false;
  if (Object.is(prev, next)) return true;
  if (typeof prev !== typeof next) return false;
  if (prev === null || next === null) return false;

  if (Array.isArray(prev) && Array.isArray(next)) {
    if (prev.length !== next.length) return false;
    for (let i = 0; i < prev.length; i++) {
      if (!deepEqual(prev[i], next[i], maxDepth, currentDepth + 1))
        return false;
    }
    return true;
  }

  if (typeof prev === "object" && typeof next === "object") {
    const prevKeys = Object.keys(prev);
    const nextKeys = Object.keys(next);
    if (prevKeys.length !== nextKeys.length) return false;
    for (const key of prevKeys) {
      if (!nextKeys.includes(key)) return false;
      if (!deepEqual(prev[key], next[key], maxDepth, currentDepth + 1))
        return false;
    }
    return true;
  }

  return false;
}

/**
 *
 * @param changes
 * Detect change classfications
 */
export function classfiy(changes: DiffResult) {
  const { prev, next } = changes;

  if (typeof prev !== typeof next) return CHANGE_CLASSIFICATION.TYPE_CHANGE; // Type thay đổi hoàn toàn

  if (typeof prev === "function")
    if (prev.toString() === next.toString()) {
      return CHANGE_CLASSIFICATION.UNSTABLE_CALLBACK; // Cùng logic nhưng khác reference
    } else {
      return CHANGE_CLASSIFICATION.CALLBACK_CHANGE; // Logic thực sự thay đổi
    }

  if (typeof prev === "object" && prev !== null) {
    if (deepEqual(prev, next))
      return CHANGE_CLASSIFICATION.UNSTABLE_REFERENCE; // Object mới nhưng giá trị giống
    else return CHANGE_CLASSIFICATION.VALUE_CHANGE; // Object thực sự thay đổi
  }

  return CHANGE_CLASSIFICATION.PRIMITIVE_CHANGE;
}
