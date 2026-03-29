import { onBeforeUpdate, onUpdated, onMounted } from "vue";
import {
  shallowDiff,
  getRenderReason,
  logRender,
  checkRenderThresholds,
  trackRenderFrequency,
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
    trackRenderFrequency(componentName);

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

    if (prevProps) {
      reason = getRenderReason(changes);
    }

    logRender(componentName, reason, renderDuration);
    checkRenderThresholds(componentName, renderDuration);
    trackRenderFrequency(componentName);

    prevProps = currentProps;
  });
}
