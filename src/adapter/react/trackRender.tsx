import React, {
  Profiler,
  ProfilerOnRenderCallback,
  useEffect,
  useRef,
} from "react";
import {
  shallowDiff,
  reportRender,
  deepEqual,
  ComponentReport,
  RenderReason
} from "@/core";

/**
 * Higher-Order Component (HOC) to track render duration and reason
 * using React's native <Profiler> API for maximum accuracy.
 */
export function withWhyRender<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string,
) {
  if (process.env.NODE_ENV === "production") {
    return WrappedComponent;
  }

  const name =
    componentName ||
    WrappedComponent.displayName ||
    WrappedComponent.name ||
    "UnknownComponent";

  const WithWhyRender = (props: P) => {
    const prevProps = useRef<P>(null);

    // Update the ref after commit phase ends so we have it for the next render
    useEffect(() => {
      prevProps.current = props;
    });

    const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration, baseDuration) => {
      const changes = shallowDiff(prevProps.current || {}, props);
      let reason: RenderReason = { type: "unknown" };
      let isWasted = false;

      if (phase === "update") {
        reason = { type: "props", changes };
        isWasted = changes.every((c) => deepEqual(c.prev, c.next));
      }

      const report: ComponentReport = {
        componentName: name,
        framework: "react",
        renderTimeMs: actualDuration,
        baseDurationMs: baseDuration,
        reason,
        timestamp: performance.now(),
        isWasted
      };

      reportRender(report);
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
