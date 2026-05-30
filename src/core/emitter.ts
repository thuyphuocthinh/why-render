import { ComponentReport } from "./types";

type EventCallback = (data: any) => void;

class EventEmitter {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    if (!this.events.has(event)) return;
    this.events.set(
      event,
      this.events.get(event)!.filter((cb) => cb !== callback),
    );
  }

  emit(event: string, data: any) {
    if (!this.events.has(event)) return;
    this.events.get(event)!.forEach((callback) => callback(data));
  }
}

export const coreEmitter = new EventEmitter();

// Event payload types
export interface RenderEventPayload {
  report: ComponentReport;
}

export interface ThresholdWarningPayload {
  componentName: string;
  timeMs: number;
  thresholdMs: number;
}

export interface BurstWarningPayload {
  componentName: string;
  rendersCount: number;
  timeWindowMs: number;
}
