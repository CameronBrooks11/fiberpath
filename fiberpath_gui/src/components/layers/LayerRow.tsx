import { useProjectStore } from "../../state/projectStore";
import { Layer, LayerType } from "../../types/project";

interface LayerRowProps {
  layer: Layer;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

export function LayerRow({ layer, index, isActive, onSelect, onRemove, onDuplicate }: LayerRowProps) {
  const getLayerSummary = (layer: Layer): string => {
    switch (layer.type) {
      case 'hoop':
        return layer.hoop?.terminal ? 'Hoop (Terminal)' : 'Hoop';
      case 'helical':
        return `Helical ${layer.helical?.wind_angle ?? 45}°`;
      case 'skip':
        return `Skip ${layer.skip?.mandrel_rotation ?? 90}°`;
      default:
        return 'Unknown';
    }
  };

  const getLayerIcon = (type: LayerType): string => {
    switch (type) {
      case 'hoop':
        return '○';
      case 'helical':
        return '⟋';
      case 'skip':
        return '↻';
    }
  };

  return (
    <div 
      className={`layer-row ${isActive ? 'layer-row--active' : ''}`}
      onClick={onSelect}
    >
      <div className="layer-row__drag-handle">
        <span className="layer-row__drag-icon">⋮⋮</span>
      </div>
      <div className="layer-row__index">{index + 1}</div>
      <div className="layer-row__icon">{getLayerIcon(layer.type)}</div>
      <div className="layer-row__content">
        <div className="layer-row__type">{layer.type}</div>
        <div className="layer-row__summary">{getLayerSummary(layer)}</div>
      </div>
      <div className="layer-row__actions">
        <button
          className="layer-row__action-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          title="Duplicate layer"
        >
          ⧉
        </button>
        <button
          className="layer-row__action-btn layer-row__action-btn--danger"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title="Remove layer"
        >
          ×
        </button>
      </div>
    </div>
  );
}
