import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useProjectStore } from "../../stores/projectStore";
import { useErrorNotification } from "../../contexts/ErrorNotificationContext";
import { usePreviewGeneration } from "../../hooks/canvas/usePreviewGeneration";
import { LayerScrubber } from "./LayerScrubber";
import { CanvasControls } from "./CanvasControls";

interface VisualizationCanvasProps {
  onExport?: () => void;
}

interface EmptyStateProps {
  hasLayers: boolean;
}

function VisualizationEmptyState({ hasLayers }: EmptyStateProps) {
  if (hasLayers) {
    return null;
  }

  return (
    <div className="visualization-canvas__empty">
      <div className="visualization-canvas__empty-icon">⬢</div>
      <div className="visualization-canvas__empty-text">No layers to visualize</div>
      <div className="visualization-canvas__empty-hint">
        Add layers to see the toolpath preview
      </div>
    </div>
  );
}

function VisualizationLoadingState() {
  return (
    <div className="visualization-canvas__loading">
      <div className="visualization-canvas__spinner"></div>
      <div className="visualization-canvas__loading-text">Generating preview...</div>
    </div>
  );
}

interface VisualizationErrorStateProps {
  error: string;
  onRetry: () => void;
}

function VisualizationErrorState({
  error,
  onRetry,
}: VisualizationErrorStateProps) {
  return (
    <div className="visualization-canvas__error">
      <div className="visualization-canvas__error-icon">⚠</div>
      <div className="visualization-canvas__error-text">{error}</div>
      <button className="visualization-canvas__error-retry" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

interface VisualizationPlaceholderStateProps {
  isGenerating: boolean;
  onGenerate: () => void;
}

function VisualizationPlaceholderState({
  isGenerating,
  onGenerate,
}: VisualizationPlaceholderStateProps) {
  return (
    <>
      <div className="visualization-canvas__controls-standalone">
        <button
          className="canvas-controls__btn canvas-controls__btn--preview"
          onClick={onGenerate}
          disabled={isGenerating}
          title="Generate preview"
        >
          <Eye size={20} />
        </button>
      </div>
      <div className="visualization-canvas__placeholder">
        <div className="visualization-canvas__placeholder-icon">🔄</div>
        <div className="visualization-canvas__placeholder-text">
          Click the preview button to generate visualization
        </div>
      </div>
    </>
  );
}

interface VisualizationWarningsProps {
  warnings: string[];
  isGenerating: boolean;
}

function VisualizationWarnings({
  warnings,
  isGenerating,
}: VisualizationWarningsProps) {
  if (warnings.length === 0 || isGenerating) {
    return null;
  }

  return (
    <div className="visualization-canvas__warnings">
      <div className="visualization-canvas__warnings-header">
        <span className="visualization-canvas__warnings-icon">⚠</span>
        <span className="visualization-canvas__warnings-title">Planner Warnings</span>
      </div>
      <div className="visualization-canvas__warnings-list">
        {warnings.map((warning, index) => (
          <div key={`${warning}-${index}`} className="visualization-canvas__warning-item">
            {warning}
          </div>
        ))}
      </div>
    </div>
  );
}

export function VisualizationCanvas({
  onExport,
}: VisualizationCanvasProps = {}) {
  const project = useProjectStore((state) => state.project);
  const { showError } = useErrorNotification();
  const [visibleLayerCount, setVisibleLayerCount] = useState(project.layers.length);

  const { previewImage, isGenerating, error, warnings, generatePreview } =
    usePreviewGeneration({
      project,
      visibleLayerCount,
      onError: showError,
    });

  const hasLayers = project.layers.length > 0;

  useEffect(() => {
    setVisibleLayerCount(project.layers.length);
  }, [project.layers.length]);

  return (
    <div className="visualization-canvas">
      <VisualizationEmptyState hasLayers={hasLayers} />

      {hasLayers && (
        <>
          <div className="visualization-canvas__header">
            <LayerScrubber
              totalLayers={project.layers.length}
              currentLayer={visibleLayerCount}
              onLayerChange={setVisibleLayerCount}
            />
          </div>

          <div className="visualization-canvas__content">
            {isGenerating && <VisualizationLoadingState />}

            {error && !isGenerating && (
              <VisualizationErrorState error={error} onRetry={generatePreview} />
            )}

            {!isGenerating && !error && !previewImage && (
              <VisualizationPlaceholderState
                isGenerating={isGenerating}
                onGenerate={generatePreview}
              />
            )}

            {previewImage && !isGenerating && !error && (
              <TransformWrapper
                initialScale={1}
                minScale={0.1}
                maxScale={8}
                centerOnInit
                limitToBounds={false}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <CanvasControls
                      onZoomIn={() => zoomIn()}
                      onZoomOut={() => zoomOut()}
                      onResetZoom={() => resetTransform()}
                      onRefresh={generatePreview}
                      isGenerating={isGenerating}
                      onExport={onExport}
                    />
                    <TransformComponent
                      wrapperClass="visualization-canvas__transform-wrapper"
                      contentClass="visualization-canvas__transform-content"
                    >
                      <img
                        src={previewImage}
                        alt="Toolpath preview"
                        className="visualization-canvas__image"
                      />
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            )}

            <VisualizationWarnings warnings={warnings} isGenerating={isGenerating} />
          </div>
        </>
      )}
    </div>
  );
}
