import { onBeforeUpdate, onUpdated, onMounted } from "vue";
import {
  shallowDiff,
  reportRender,
  deepEqual,
  ComponentReport,
  RenderReason
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
  if (process.env.NODE_ENV === "production") {
    return;
  }

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

    const report: ComponentReport = {
      componentName,
      framework: "vue",
      renderTimeMs: renderDuration,
      reason: { type: "unknown" },
      timestamp: performance.now(),
      isWasted: false
    };

    reportRender(report);
    prevProps = currentProps;
  });

  onBeforeUpdate(() => {
    renderStartTime = performance.now();
  });

  onUpdated(() => {
    const currentProps = getProps();
    const renderDuration = performance.now() - renderStartTime;

    const changes = shallowDiff(prevProps || {}, currentProps);
    let reason: RenderReason = { type: "unknown" };
    let isWasted = false;

    if (prevProps) {
      reason = { type: "props", changes };

      // Determine if render is wasted based on props equality
      if (changes.length === 0) {
        isWasted = true;
      } else {
        isWasted = changes.every((c) => deepEqual(c.prev, c.next));
      }
    }

    const report: ComponentReport = {
      componentName,
      framework: "vue",
      renderTimeMs: renderDuration,
      reason,
      timestamp: performance.now(),
      isWasted
    };

    reportRender(report);
    prevProps = currentProps;
  });
}
