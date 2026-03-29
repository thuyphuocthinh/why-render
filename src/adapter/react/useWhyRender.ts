import { useEffect, useRef } from 'react';
import {
  shallowDiff,
  getRenderReason,
  logRender,
  checkRenderThresholds,
  trackRenderFrequency,
} from '@/core';

/**
 * Custom hook to track render information inside a Function Component directly.
 * Since we can't wrap <Profiler> inside a hook, it measures time via performance.now().
 */
export function useWhyRender(
  componentName: string,
  propsToTrack: Record<string, any> = {}
) {
  const prevProps = useRef<Record<string, any>>(null);
  const renderStartTime = useRef(performance.now());

  // Triggers right at the start of the render phase
  renderStartTime.current = performance.now();

  useEffect(() => {
    // We are now in the commit phase
    const renderDuration = performance.now() - renderStartTime.current;

    const changes = shallowDiff(prevProps.current || {}, propsToTrack);
    let reason = '  - First Render (Mount)';

    if (prevProps.current) {
      reason = getRenderReason(changes);
    }

    logRender(componentName, reason, renderDuration);
    checkRenderThresholds(componentName, renderDuration);
    trackRenderFrequency(componentName);

    // Save previous props for the next render
    prevProps.current = propsToTrack;
  });
}
