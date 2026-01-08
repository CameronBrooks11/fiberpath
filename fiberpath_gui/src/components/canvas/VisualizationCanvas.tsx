import { useState, useEffect, useRef } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useProjectStore } from "../../state/projectStore";
import { LayerScrubber } from "./LayerScrubber";
import { CanvasControls } from "./CanvasControls";import { plotDefinition } from '../../lib/commands';
import type { FiberPathProject } from '../../types/project';
export function VisualizationCanvas() {
  const project = useProjectStore((state) => state.project);
  const autoRefreshPreview = useProjectStore((state) => state.autoRefreshPreview);
  const toggleAutoRefreshPreview = useProjectStore((state) => state.toggleAutoRefreshPreview);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleLayerCount, setVisibleLayerCount] = useState(project.layers.length);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  const hasLayers = project.layers.length > 0;
  
  // Update visible layer count when total layers change
  useEffect(() => {
    setVisibleLayerCount(project.layers.length);
  }, [project.layers.length]);
  
  // Debounced preview generation (only if auto-refresh enabled)
  useEffect(() => {
    if (!hasLayers) {
      setPreviewImage(null);
      setError(null);
      return;
    }
    
    // Only auto-generate if toggle is enabled
    if (!autoRefreshPreview) {
      return;
    }
    
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Set new timer
    debounceTimer.current = setTimeout(() => {
      generatePreview();
    }, 500);
    
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [project.mandrel, project.tow, project.layers, visibleLayerCount, autoRefreshPreview]);
  
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
    
    try {
      // Convert layer to .wind schema format
      const convertLayer = (layer: Layer): any => {
        const { id, type, ...rest } = layer;
        
        if (type === 'hoop') {
          const hoopData = (layer as any).hoop || {};
          return {
            windType: 'hoop',
            terminal: hoopData.terminal || false,
          };
        } else if (type === 'helical') {
          const helicalData = (layer as any).helical || {};
          return {
            windType: 'helical',
            windAngle: helicalData.wind_angle || 45,
            patternNumber: helicalData.pattern_number || 3,
            skipIndex: helicalData.skip_index || 2,
            lockDegrees: helicalData.lock_degrees || 5,
            leadInMM: helicalData.lead_in_mm || 10,
            leadOutDegrees: helicalData.lead_out_degrees || 5,
            skipInitialNearLock: helicalData.skip_initial_near_lock || false,
          };
        } else if (type === 'skip') {
          const skipData = (layer as any).skip || {};
          return {
            windType: 'skip',
            mandrelRotation: skipData.mandrel_rotation || 90,
          };
        }
        return {};
      };
      
      // Serialize project to .wind schema format
      const definitionJson = JSON.stringify({
        mandrelParameters: {
          diameter: project.mandrel.diameter,
          windLength: project.mandrel.wind_length,
        },
        towParameters: {
          width: project.tow.width,
          thickness: project.tow.thickness,
        },
        defaultFeedRate: 2000, // Default feed rate
        layers: project.layers.slice(0, visibleLayerCount).map(convertLayer),
      });

      // Call Tauri command
      console.log('Calling plotDefinition with', visibleLayerCount, 'layers');
      const result = await plotDefinition(definitionJson, visibleLayerCount);
      console.log('Plot result:', { pathLength: result.path?.length, base64Length: result.imageBase64?.length });
      
      if (!result.imageBase64 || result.imageBase64.length === 0) {
        throw new Error('Empty image data returned from plot command');
      }
      
      const dataUri = `data:image/png;base64,${result.imageBase64}`;
      console.log('Setting preview image, data URI length:', dataUri.length);
      setPreviewImage(dataUri);
    } catch (err) {
      console.error('Failed to generate preview:', err);
      setError(err instanceof Error ? err.message : String(err));
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
                className="canvas-controls__btn"
                onClick={generatePreview}
                disabled={isGenerating}
                title="Refresh preview (F5)"
              >
                ⟳
              </button>
              <label className="canvas-controls__toggle" title="Auto-refresh preview when parameters change">
                <input
                  type="checkbox"
                  checked={autoRefreshPreview}
                  onChange={toggleAutoRefreshPreview}
                />
                <span>Auto</span>
              </label>
            </div>
            <div className="visualization-canvas__placeholder">
              <div className="visualization-canvas__placeholder-icon">🔄</div>
              <div className="visualization-canvas__placeholder-text">
                Click the refresh button to generate preview
              </div>
              <div className="visualization-canvas__placeholder-hint">
                Or enable Auto to refresh automatically
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
                  autoRefresh={autoRefreshPreview}
                  onToggleAutoRefresh={toggleAutoRefreshPreview}
                  isGenerating={isGenerating}
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
      </div>
    </div>
  );
}
