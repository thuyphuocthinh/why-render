const CSS_CONTENT = `
.why-render-devtools-root {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 380px;
  max-height: 500px;
  background-color: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(14, 165, 233, 0.2);
  color: #f8fafc;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  z-index: 999999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.why-render-devtools-root.minimized {
  width: auto;
  height: auto;
  border-radius: 9999px;
  cursor: pointer;
  padding: 8px 16px;
}

.why-render-devtools-root.minimized:hover {
  background-color: rgba(15, 23, 42, 0.95);
  transform: scale(1.05);
}

.why-render-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: linear-gradient(to right, rgba(14, 165, 233, 0.1), transparent);
  cursor: grab;
}

.why-render-header:active {
  cursor: grabbing;
}

.why-render-title {
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.why-render-title-icon {
  color: #0ea5e9;
}

.why-render-close {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.why-render-close:hover {
  color: #f8fafc;
  background-color: rgba(255, 255, 255, 0.1);
}

.why-render-content {
  padding: 0;
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
}

.why-render-content::-webkit-scrollbar {
  width: 6px;
}
.why-render-content::-webkit-scrollbar-track {
  background: transparent;
}
.why-render-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}
.why-render-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.why-render-dashboard {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background-color: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.why-render-stat {
  background-color: rgba(15, 23, 42, 0.85);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
}

.why-render-stat-label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.why-render-stat-value {
  font-size: 20px;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.why-render-stat-value.wasted {
  color: #f59e0b;
}

.why-render-stat-value.critical {
  color: #f43f5e;
}

.why-render-feed {
  display: flex;
  flex-direction: column;
}

.why-render-feed-item {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  transition: background-color 0.2s;
  cursor: pointer;
}

.why-render-feed-item:hover {
  background-color: rgba(255, 255, 255, 0.02);
}

.why-render-feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.why-render-feed-name {
  font-weight: 600;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.why-render-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  border: 1px solid transparent;
}

.why-render-badge.wasted {
  background-color: rgba(245, 158, 11, 0.1);
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.3);
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.1);
}

.why-render-badge.good {
  background-color: rgba(16, 185, 129, 0.1);
  color: #34d399;
  border-color: rgba(16, 185, 129, 0.3);
}

.why-render-feed-time {
  font-size: 12px;
  color: #94a3b8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.why-render-feed-details {
  font-size: 12px;
  color: #cbd5e1;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 8px;
  border-radius: 6px;
  margin-top: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

/* Heatmap Overlay Styles */
.why-render-heatmap-flash {
  position: absolute;
  pointer-events: none;
  z-index: 999998;
  border: 2px solid;
  border-radius: 4px;
  animation: why-render-flash-out 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes why-render-flash-out {
  0% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 15px currentColor;
  }
  100% {
    opacity: 0;
    transform: scale(1.02);
    box-shadow: 0 0 0 currentColor;
  }
}
`;

export function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("why-render-styles")) return;

  const style = document.createElement("style");
  style.id = "why-render-styles";
  style.innerHTML = CSS_CONTENT;
  document.head.appendChild(style);
}
