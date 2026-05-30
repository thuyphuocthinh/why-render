import { onBeforeUpdate, onUpdated, onMounted, onRenderTriggered, getCurrentInstance } from "vue";
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
  componentName?: string,
  propsToTrack: Record<string, any> | (() => Record<string, any>) = {},
) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const instance = getCurrentInstance();
  const name = componentName ?? instance?.type?.name ?? instance?.type?.__name ?? "UnknownVueComponent";

  let prevProps: Record<string, any> | null = null;
  let renderStartTime = performance.now();
  let triggerReason: RenderReason = { type: "unknown" };

  const getProps = () => {
    return typeof propsToTrack === "function"
      ? propsToTrack()
      : { ...propsToTrack };
  };

  onRenderTriggered((e) => {
    triggerReason = {
      type: "state",
      changedKey: String(e.key),
      oldValue: e.oldValue,
      newValue: e.newValue,
    };
  });

  onMounted(() => {
    const currentProps = getProps();
    const renderDuration = performance.now() - renderStartTime;

    const report: ComponentReport = {
      componentName: name,
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
    let reason: RenderReason = triggerReason;
    let isWasted = false;

    // If triggerReason is unknown (maybe a forced update or pure prop change not caught by reactivity tracker)
    if (reason.type === "unknown" && prevProps && changes.length > 0) {
      reason = { type: "props", changes };
      if (changes.every((c) => deepEqual(c.prev, c.next))) {
         isWasted = true;
      }
    } else if (reason.type === "state" && deepEqual(reason.oldValue, reason.newValue)) {
      isWasted = true;
    }

    const report: ComponentReport = {
      componentName: name,
      framework: "vue",
      renderTimeMs: renderDuration,
      reason,
      timestamp: performance.now(),
      isWasted
    };

    reportRender(report);
    
    // Flash Heatmap
    if (instance && instance.vnode.el && instance.vnode.el instanceof Element) {
      import('@/ui/heatmap').then(({ flashElement }) => {
        flashElement(instance.vnode.el as Element, isWasted);
      });
    }
    
    // Reset trigger reason
    triggerReason = { type: "unknown" };
    prevProps = currentProps;
  });
}
