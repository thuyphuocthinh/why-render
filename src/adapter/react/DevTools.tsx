import React, { useEffect, useState, useRef } from "react";
import { coreEmitter, RenderEventPayload, ComponentReport, totalWastedTime, wastedRatio } from "@/core";
import { injectStyles } from "../../ui/styles";
import { classify } from "@/core/diff";

export function WhyRenderDevTools() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 20,
    initY: 20,
  });

  const [reports, setReports] = useState<ComponentReport[]>([]);
  const [totalWasted, setTotalWasted] = useState(0);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    injectStyles();

    const onRender = (payload: RenderEventPayload) => {
      const { report } = payload;
      setReports((prev) => {
        const newReports = [report, ...prev].slice(0, 50); // Keep last 50
        return newReports;
      });
      setTotalWasted(totalWastedTime());
    };

    coreEmitter.on("render", onRender);
    return () => {
      coreEmitter.off("render", onRender);
    };
  }, []);

  if (process.env.NODE_ENV === "production") return null;

  // Dragging logic
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(".why-render-close") || (e.target as HTMLElement).closest(".why-render-content")) return;
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: position.x,
      initY: position.y,
    };
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({
      x: dragRef.current.initX - dx, // Subtracted because we use bottom/right
      y: dragRef.current.initY - dy,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    }
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging]);

  const toggleMinimize = () => setIsMinimized(!isMinimized);

  if (isMinimized) {
    return (
      <div 
        className="why-render-devtools-root minimized"
        style={{ right: position.x, bottom: position.y }}
        onClick={toggleMinimize}
      >
        <div className="why-render-title">
          <span className="why-render-title-icon">⚡</span>
          <span>Why-Render</span>
          <span className="why-render-badge wasted">{totalWasted.toFixed(0)}ms wasted</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="why-render-devtools-root" 
      style={{ right: position.x, bottom: position.y }}
    >
      <div 
        className="why-render-header" 
        onPointerDown={handlePointerDown}
      >
        <div className="why-render-title">
          <span className="why-render-title-icon">⚡</span> Why-Render DevTools
        </div>
        <button className="why-render-close" onClick={toggleMinimize} title="Minimize">
          ↓
        </button>
      </div>

      <div className="why-render-dashboard">
        <div className="why-render-stat">
          <span className="why-render-stat-label">Total Wasted Time</span>
          <span className={`why-render-stat-value ${totalWasted > 50 ? 'critical' : 'wasted'}`}>
            {totalWasted.toFixed(1)}ms
          </span>
        </div>
        <div className="why-render-stat">
          <span className="why-render-stat-label">Events Traced</span>
          <span className="why-render-stat-value">{reports.length}</span>
        </div>
      </div>

      <div className="why-render-content">
        <div className="why-render-feed">
          {reports.map((r, idx) => (
            <ReportItem key={idx} report={r} />
          ))}
          {reports.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              Waiting for component renders...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportItem({ report }: { report: ComponentReport }) {
  const [expanded, setExpanded] = useState(false);

  let reasonText = "First render or unknown";
  if (report.reason.type === "props" && report.reason.changes) {
     reasonText = report.reason.changes
      .map((c) => {
         const changeType = classify(c);
         return `• ${c.key} [${changeType}]`;
      })
      .join("\\n");
  } else if (report.reason.type === "state" && report.reason.changedKey) {
     reasonText = `• State ${report.reason.changedKey} changed`;
  }

  return (
    <div className="why-render-feed-item" onClick={() => setExpanded(!expanded)}>
      <div className="why-render-feed-header">
        <div className="why-render-feed-name">
          {report.componentName}
          <span className={`why-render-badge ${report.isWasted ? 'wasted' : 'good'}`}>
            {report.isWasted ? 'Wasted' : 'Good'}
          </span>
        </div>
        <div className="why-render-feed-time">
          {report.renderTimeMs.toFixed(1)}ms
        </div>
      </div>
      
      {expanded && (
        <div className="why-render-feed-details">
          {reasonText}
        </div>
      )}
    </div>
  );
}
