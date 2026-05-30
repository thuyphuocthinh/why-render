import { useEffect, useRef } from "react";
import {
  shallowDiff,
  reportRender,
  deepEqual,
  ComponentReport,
  RenderReason
} from "@/core";

/**
 * Custom hook to track render information inside a Function Component directly.
 * Since we can't wrap <Profiler> inside a hook, it measures time via performance.now().
 */
export function useWhyRender(
  componentName: string,
  propsToTrack: Record<string, any> = {},
) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const prevProps = useRef<Record<string, any>>(null);
  const renderStartTime = useRef(performance.now());

  // Triggers right at the start of the render phase
  renderStartTime.current = performance.now();

  useEffect(() => {
    // We are now in the commit phase
    const renderDuration = performance.now() - renderStartTime.current;

    const changes = shallowDiff(prevProps.current || {}, propsToTrack);
    let reason: RenderReason = { type: "unknown" };
    let isWasted = false;

    if (prevProps.current) {
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
      framework: "react",
      renderTimeMs: renderDuration,
      reason,
      timestamp: performance.now(),
      isWasted
    };

    reportRender(report);

    // Save previous props for the next render
    prevProps.current = propsToTrack;
  });
}
