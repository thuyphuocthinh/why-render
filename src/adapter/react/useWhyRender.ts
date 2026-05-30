import { useEffect, useRef } from "react";
import {
  shallowDiff,
  getRenderReason,
  logRender,
  checkRenderThresholds,
  recordRender,
  deepEqual,
  logWasted,
} from "@/core";
import { totalWastedTime, wastedRatio } from "~/src/core/waste";

/**
 * Custom hook to track render information inside a Function Component directly.
 * Since we can't wrap <Profiler> inside a hook, it measures time via performance.now().
 */
export function useWhyRender(
  componentName: string,
  propsToTrack: Record<string, any> = {},
) {
  const prevProps = useRef<Record<string, any>>(null);
  const renderStartTime = useRef(performance.now());

  // Triggers right at the start of the render phase
  renderStartTime.current = performance.now();

  useEffect(() => {
    // We are now in the commit phase
    const renderDuration = performance.now() - renderStartTime.current;

    const changes = shallowDiff(prevProps.current || {}, propsToTrack);
    let reason = "  - First Render (Mount)";
    let isWasted = false;

    // let isWasted = wasteDetection({
    //   propsDiff: changes,
    //   stateDiff: [],
    //   contextDiff: [],
    // });

    if (prevProps.current) {
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
    logWasted(componentName, "ratio", reason, wastedRatio(componentName, 5000));
    logWasted(componentName, "total", reason, totalWastedTime());

    // Save previous props for the next render
    prevProps.current = propsToTrack;
  });
}
