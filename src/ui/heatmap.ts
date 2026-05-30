export function flashElement(element: Element | null, isWasted: boolean) {
  if (!element || typeof document === "undefined") return;

  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const overlay = document.createElement("div");
  overlay.className = "why-render-heatmap-flash";

  // Set position and size to match the element exactly, accounting for scroll
  overlay.style.top = `${rect.top + window.scrollY}px`;
  overlay.style.left = `${rect.left + window.scrollX}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;

  // Color logic
  if (isWasted) {
    overlay.style.borderColor = "#f59e0b"; // Amber
    overlay.style.color = "#f59e0b";
  } else {
    overlay.style.borderColor = "#0ea5e9"; // Sky
    overlay.style.color = "#0ea5e9";
  }

  document.body.appendChild(overlay);

  // Clean up after animation
  setTimeout(() => {
    if (document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
  }, 600);
}
