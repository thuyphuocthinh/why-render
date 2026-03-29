/**
 * Logs standard rendering information to the console with styling.
 */
export function logRender(componentName: string, reason: string, timeMs: number) {
  console.log(
    `%c⚡ [Render] %c${componentName}`,
    'color: #0ea5e9; font-weight: bold;',
    'color: inherit; font-weight: bold;',
    `\nReason:\n${reason}\nTime: ${timeMs.toFixed(2)}ms`
  );
}

/**
 * Issues warnings for poor performance (slow renders or high frequency).
 */
export function logWarning(
  componentName: string,
  type: 'slow' | 'frequency',
  details: string
) {
  const title =
    type === 'slow' ? '⚠ Slow render detected' : '⚠ High render frequency';
  console.warn(
    `%c${title}\n%cComponent: ${componentName}\n${details}`,
    'color: #f59e0b; font-weight: bold;',
    'color: inherit;'
  );
}
