import { useState, useEffect, useRef } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Eye } from 'lucide-react';
import { useProjectStore } from "../../state/projectStore";
import { useErrorNotification } from "../../contexts/ErrorNotificationContext";
import { LayerScrubber } from "./LayerScrubber";
import { CanvasControls } from "./CanvasControls";
import { plotDefinition } from '../../lib/commands';
import { projectToWindDefinition } from '../../types/converters';
import { validateWindDefinition } from '../../lib/validation';
import type { FiberPathProject } from '../../types/project';

interface VisualizationCanvasProps {
  onExport?: () => void;
}

export function VisualizationCanvas({ onExport }: VisualizationCanvasProps = {}) {
  const project = useProjectStore((state) => state.project);
  const { showError } = useErrorNotification();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [visibleLayerCount, setVisibleLayerCount] = useState(project.layers.length);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  const hasLayers = project.layers.length > 0;
  
  // Update visible layer count when total layers change
  useEffect(() => {
    setVisibleLayerCount(project.layers.length);
  }, [project.layers.length]);
  
  const generatePreview = async () => {
    // Validate before attempting to plot
    if (project.layers.length === 0) {
      return;
    }
    
    // Check for valid mandrel and tow parameters
    if (!project.mandrel.diameter || project.mandrel.diameter <= 0 ||
        !project.mandrel.wind_length || project.mandrel.wind_length <= 0) {
      setError("Invalid mandrel parameters");
      return;
    }
    
    if (!project.tow.width || project.tow.width <= 0 ||
        !project.tow.thickness || project.tow.thickness <= 0) {
      setError("Invalid tow parameters");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setWarnings([]);
    
    try {
      // Convert project to .wind schema format
      const windDefinition = projectToWindDefinition(project, visibleLayerCount);
      
      // Validate against schema
      const validation = validateWindDefinition(windDefinition);
      if (!validation.valid) {
        const errorMessages = validation.errors.map(e => `${e.field}: ${e.message}`).join(', ');
        throw new Error(`Schema validation failed: ${errorMessages}`);
      }
      
      // Serialize to JSON
      const definitionJson = JSON.stringify(windDefinition);

      // Call Tauri command
      const result = await plotDefinition(definitionJson, visibleLayerCount);
      
      // Store warnings if any
      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings);
      }
      
      if (!result.imageBase64 || result.imageBase64.length === 0) {
        throw new Error('Empty image data returned from plot command');
      }
      
      const dataUri = `data:image/png;base64,${result.imageBase64}`;
      setPreviewImage(dataUri);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      showError(`Failed to generate preview: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  if (!hasLayers) {
    return (
      <div className="visualization-canvas">
        <div className="visualization-canvas__empty">
          <div className="visualization-canvas__empty-icon">⬢</div>
          <div className="visualization-canvas__empty-text">No layers to visualize</div>
          <div className="visualization-canvas__empty-hint">Add layers to see the toolpath preview</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="visualization-canvas">
      <div className="visualization-canvas__header">
        <LayerScrubber
          totalLayers={project.layers.length}
          currentLayer={visibleLayerCount}
          onLayerChange={setVisibleLayerCount}
        />
      </div>
      
      <div className="visualization-canvas__content">
        {isGenerating && (
          <div className="visualization-canvas__loading">
            <div className="visualization-canvas__spinner"></div>
            <div className="visualization-canvas__loading-text">Generating preview...</div>
          </div>
        )}
        
        {error && !isGenerating && (
          <div className="visualization-canvas__error">
            <div className="visualization-canvas__error-icon">⚠</div>
            <div className="visualization-canvas__error-text">{error}</div>
            <button 
              className="visualization-canvas__error-retry"
              onClick={generatePreview}
            >
              Retry
            </button>
          </div>
        )}
        
        {!isGenerating && !error && !previewImage && (
          <>
            <div className="visualization-canvas__controls-standalone">
              <button
                className="canvas-controls__btn canvas-controls__btn--preview"
                onClick={generatePreview}
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
        
        {warnings.length > 0 && !isGenerating && (
          <div className="visualization-canvas__warnings">
            <div className="visualization-canvas__warnings-header">
              <span className="visualization-canvas__warnings-icon">⚠</span>
              <span className="visualization-canvas__warnings-title">Planner Warnings</span>
            </div>
            <div className="visualization-canvas__warnings-list">
              {warnings.map((warning, idx) => (
                <div key={idx} className="visualization-canvas__warning-item">
                  {warning}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
