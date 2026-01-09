import { Eye, ZoomIn, ZoomOut, RotateCcw, FileDown } from "lucide-react";

interface CanvasControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onRefresh: () => void;
  isGenerating: boolean;
  onExport?: () => void;
}

export function CanvasControls({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onRefresh,
  isGenerating,
  onExport,
}: CanvasControlsProps) {
  return (
    <div className="canvas-controls">
      <button
        className="canvas-controls__btn canvas-controls__btn--preview"
        onClick={onRefresh}
        disabled={isGenerating}
        title="Generate preview"
      >
        <Eye size={20} />
      </button>
      <div className="canvas-controls__divider" />
      <button
        className="canvas-controls__btn"
        onClick={onZoomIn}
        title="Zoom in (Ctrl++)"
      >
        <ZoomIn size={20} />
      </button>
      <button
        className="canvas-controls__btn"
        onClick={onResetZoom}
        title="Reset zoom (Ctrl+0)"
      >
        <RotateCcw size={20} />
      </button>
      <button
        className="canvas-controls__btn"
        onClick={onZoomOut}
        title="Zoom out (Ctrl+-)"
      >
        <ZoomOut size={20} />
      </button>
      {onExport && (
        <>
          <div className="canvas-controls__divider" />
          <button
            className="canvas-controls__btn canvas-controls__btn--export"
            onClick={onExport}
            title="Export G-code (Ctrl+E)"
          >
            <FileDown size={20} />
          </button>
        </>
      )}
    </div>
  );
}
