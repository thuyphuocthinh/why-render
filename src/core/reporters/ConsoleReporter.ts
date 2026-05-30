import { coreEmitter, RenderEventPayload, ThresholdWarningPayload, BurstWarningPayload } from "../emitter";
import { isEnabled } from "../config";
import { classify } from "../diff";
import { memoizationEfficiency } from "../profiler";
import { wastedRatio } from "../waste";

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
        .map((c) => {
           const changeType = classify(c);
           return `  - ${c.key} changed [${changeType}] (${this.formatValue(c.prev)} -> ${this.formatValue(c.next)})`;
        })
        .join("\n");
    } else if (report.reason.type === "state" && report.reason.changedKey) {
       reasonText = `  - State ${report.reason.changedKey} changed (${this.formatValue(report.reason.oldValue)} -> ${this.formatValue(report.reason.newValue)})`;
    } else if (report.reason.type === "unknown") {
       reasonText = "  - First Render (Mount) or Unknown";
    }

    const titleColor = report.isWasted ? "#f43f5e" : "#0ea5e9";
    const wastedLabel = report.isWasted ? "[Wasted] " : "";
    const efficiency = memoizationEfficiency(report.componentName, 5000);
    const etaText = efficiency > 0 ? ` η=${(efficiency * 100).toFixed(0)}%` : "";
    
    // Calculate waste ratio
    const ratio = wastedRatio(report.componentName, 5000);
    const ratioText = ratio > 0 ? ` ρ=${(ratio * 100).toFixed(0)}%` : "";

    console.groupCollapsed(
      `%c⚡ ${wastedLabel}[Render] %c${report.componentName} %c(${report.renderTimeMs.toFixed(2)}ms${etaText}${ratioText})`,
      `color: ${titleColor}; font-weight: bold;`,
      "color: inherit; font-weight: bold;",
      "color: gray; font-weight: normal;",
    );
    console.log(
      `%cReason:\n%c${reasonText}`,
      "color: #9ca3af; font-weight: bold;",
      "color: inherit;",
    );
    if (report.isWasted) {
       console.log(`%c💡 Hint: Check [${report.componentName}] inputs to avoid Wasted Render.`, "color: #f59e0b;");
    }
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
