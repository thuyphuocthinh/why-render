import { onBeforeUpdate, onUpdated, onMounted } from "vue";
import {
  shallowDiff,
  getRenderReason,
  logRender,
  checkRenderThresholds,
  recordRender,
  deepEqual,
} from "@/core";

/**
 * Custom composable to track render information inside a Vue Component.
 * Since setup() is only called once in Vue, propsToTrack should be a reactive object
 * (like the `props` object itself) or a getter function returning an object.
 */
export function useWhyRender(
  componentName: string,
  propsToTrack: Record<string, any> | (() => Record<string, any>) = {},
) {
  let prevProps: Record<string, any> | null = null;
  let renderStartTime = performance.now();

  const getProps = () => {
    return typeof propsToTrack === "function"
      ? propsToTrack()
      : { ...propsToTrack };
  };

  onMounted(() => {
    const currentProps = getProps();
    const renderDuration = performance.now() - renderStartTime;

    const changes = shallowDiff({}, currentProps);
    const reason = "  - First Render (Mount)";

    logRender(componentName, reason, renderDuration);
    checkRenderThresholds(componentName, renderDuration);
    recordRender(componentName, renderDuration, false);

    prevProps = currentProps;
  });

  onBeforeUpdate(() => {
    renderStartTime = performance.now();
  });

  onUpdated(() => {
    const currentProps = getProps();
    const renderDuration = performance.now() - renderStartTime;

    const changes = shallowDiff(prevProps || {}, currentProps);
    let reason = "  - Component Updated";
    let isWasted = false;

    if (prevProps) {
      reason = getRenderReason(changes);

      // Determine if render is wasted based on props equality
      if (changes.length === 0) {
        isWasted = true;
      } else {
        isWasted = changes.every((c) => deepEqual(c.prev, c.next));
      }
    }

    logRender(componentName, reason, renderDuration);
    checkRenderThresholds(componentName, renderDuration);
    recordRender(componentName, renderDuration, isWasted);

    prevProps = currentProps;
  });
}
