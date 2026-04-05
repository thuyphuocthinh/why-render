import { isEnabled } from "./config";

/**
 * Logs standard rendering information to the console with styling.
 */
export function logRender(
  componentName: string,
  reason: string,
  timeMs: number,
) {
  if (!isEnabled()) return;

  console.groupCollapsed(
    `%c⚡ [Render] %c${componentName} %c(${timeMs.toFixed(2)}ms)`,
    "color: #0ea5e9; font-weight: bold;",
    "color: inherit; font-weight: bold;",
    "color: gray; font-weight: normal;",
  );
  console.log(
    `%cReason:\n%c${reason}`,
    "color: #9ca3af; font-weight: bold;",
    "color: inherit;",
  );
  console.groupEnd();
}

/**
 * Issues warnings for poor performance (slow renders or high frequency).
 */
export function logWarning(
  componentName: string,
  type: "slow" | "frequency",
  details: string,
) {
  if (!isEnabled()) return;

  const title =
    type === "slow" ? "⚠ Slow render detected" : "⚠ High render frequency";

  console.groupCollapsed(
    `%c${title} %cin ${componentName}`,
    "color: #f59e0b; font-weight: bold;",
    "color: inherit; font-weight: normal;",
  );
  console.warn(details);
  console.groupEnd();
}
