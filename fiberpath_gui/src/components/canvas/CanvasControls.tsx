interface CanvasControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onRefresh: () => void;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  isGenerating: boolean;
}

export function CanvasControls({ 
  onZoomIn, 
  onZoomOut, 
  onResetZoom, 
  onRefresh, 
  autoRefresh, 
  onToggleAutoRefresh,
  isGenerating 
}: CanvasControlsProps) {
  return (
    <div className="canvas-controls">
      <button
        className="canvas-controls__btn"
        onClick={onRefresh}
        disabled={isGenerating}
        title="Refresh preview (F5)"
      >
        ⟳
      </button>
      <label className="canvas-controls__toggle" title="Auto-refresh preview when parameters change">
        <input
          type="checkbox"
          checked={autoRefresh}
          onChange={onToggleAutoRefresh}
        />
        <span>Auto</span>
      </label>
      <div className="canvas-controls__divider" />
      <button
        className="canvas-controls__btn"
        onClick={onZoomIn}
        title="Zoom in (Ctrl++)"
      >
        +
      </button>
      <button
        className="canvas-controls__btn"
        onClick={onResetZoom}
        title="Reset zoom (Ctrl+0)"
      >
        ⟲
      </button>
      <button
        className="canvas-controls__btn"
        onClick={onZoomOut}
        title="Zoom out (Ctrl+-)"
      >
        −
      </button>
    </div>
  );
}
