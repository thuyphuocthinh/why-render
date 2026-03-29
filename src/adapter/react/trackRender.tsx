import React, { Profiler, ProfilerOnRenderCallback, useEffect, useRef } from 'react';
import {
  shallowDiff,
  getRenderReason,
  logRender,
  checkRenderThresholds,
  trackRenderFrequency,
} from '@/core';

/**
 * Higher-Order Component (HOC) to track render duration and reason
 * using React's native <Profiler> API for maximum accuracy.
 */
export function withWhyRender<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const name =
    componentName ||
    WrappedComponent.displayName ||
    WrappedComponent.name ||
    'UnknownComponent';

  const WithWhyRender = (props: P) => {
    const prevProps = useRef<P>(null);

    // Update the ref after commit phase ends so we have it for the next render
    useEffect(() => {
      prevProps.current = props;
    });

    const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration) => {
      const changes = shallowDiff(prevProps.current || {}, props);
      let reason = '  - First Render (Mount)';

      if (phase === 'update') {
        reason = getRenderReason(changes);
      }

      logRender(name, reason, actualDuration);
      checkRenderThresholds(name, actualDuration);
      trackRenderFrequency(name);
    };

    return (
      <Profiler id={name} onRender={onRender}>
        <WrappedComponent {...props} />
      </Profiler>
    );
  };

  WithWhyRender.displayName = `withWhyRender(${name})`;
  return WithWhyRender;
}
