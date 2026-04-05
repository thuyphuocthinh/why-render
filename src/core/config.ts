export interface WhyRenderConfig {
  enabled: boolean;
}

export const config: WhyRenderConfig = {
  // @ts-ignore
  enabled:
    typeof process !== "undefined" && process.env?.NODE_ENV === "production"
      ? false
      : true,
};

export function setEnabled(isEnabled: boolean) {
  config.enabled = isEnabled;
}

export function isEnabled(): boolean {
  return config.enabled;
}
