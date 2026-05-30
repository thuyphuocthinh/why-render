import { coreEmitter, RenderEventPayload, ThresholdWarningPayload, BurstWarningPayload } from "../emitter";
import { isEnabled } from "../config";

/**
 * ConsoleReporter subscribes to core events and outputs styled logs to the console.
 */
class ConsoleReporter {
  constructor() {
    this.subscribe();
  }

  private subscribe() {
    coreEmitter.on("render", this.onRender);
    coreEmitter.on("threshold_warning", this.onThresholdWarning);
    coreEmitter.on("burst_warning", this.onBurstWarning);
  }

  private onRender = (payload: RenderEventPayload) => {
    if (!isEnabled()) return;
    const { report } = payload;
    
    // Convert RenderReason back to readable string for now
    let reasonText = "Unknown reason";
    if (report.reason.type === "props" && report.reason.changes) {
       reasonText = report.reason.changes
        .map((c) => `  - ${c.key} changed (${this.formatValue(c.prev)} -> ${this.formatValue(c.next)})`)
        .join("\n");
    } else if (report.reason.type === "unknown") {
       reasonText = "  - First Render (Mount) or Unknown";
    }

    const titleColor = report.isWasted ? "#f43f5e" : "#0ea5e9";
    const wastedLabel = report.isWasted ? "[Wasted] " : "";

    console.groupCollapsed(
      `%c⚡ ${wastedLabel}[Render] %c${report.componentName} %c(${report.renderTimeMs.toFixed(2)}ms)`,
      `color: ${titleColor}; font-weight: bold;`,
      "color: inherit; font-weight: bold;",
      "color: gray; font-weight: normal;",
    );
    console.log(
      `%cReason:\n%c${reasonText}`,
      "color: #9ca3af; font-weight: bold;",
      "color: inherit;",
    );
    console.groupEnd();
  };

  private onThresholdWarning = (payload: ThresholdWarningPayload) => {
    if (!isEnabled()) return;
    console.groupCollapsed(
      `%c⚠ Slow render detected %cin ${payload.componentName}`,
      "color: #f59e0b; font-weight: bold;",
      "color: inherit; font-weight: normal;",
    );
    console.warn(`render time: ${payload.timeMs.toFixed(2)}ms (Threshold: ${payload.thresholdMs}ms)`);
    console.groupEnd();
  };

  private onBurstWarning = (payload: BurstWarningPayload) => {
    if (!isEnabled()) return;
    console.groupCollapsed(
      `%c⚠ High render frequency %cin ${payload.componentName}`,
      "color: #f59e0b; font-weight: bold;",
      "color: inherit; font-weight: normal;",
    );
    console.warn(`renders: ${payload.rendersCount}\nduration: ${(payload.timeWindowMs / 1000).toFixed(1)} seconds`);
    console.groupEnd();
  };

  private formatValue(val: any): string {
    if (typeof val === "function") return "Function";
    if (typeof val === "object" && val !== null) return "Object/Array";
    return String(val);
  }
}

// Automatically initialize the default reporter
export const defaultConsoleReporter = new ConsoleReporter();
