import { useProjectStore } from "../../state/projectStore";
import { Layer, LayerType } from "../../types/project";
import type { OnCloseCallback } from "../../types/components";

/**
 * Props for the LayerRow component.
 */
interface LayerRowProps {
  /** The layer data to display */
  layer: Layer;

  /** Zero-based index of the layer in the stack (displayed as index + 1) */
  index: number;

  /** Whether this layer is currently selected/active */
  isActive: boolean;

  /** Callback invoked when the layer is clicked to select it */
  onSelect: OnCloseCallback;

  /** Callback invoked when the remove button is clicked */
  onRemove: OnCloseCallback;

  /** Callback invoked when the duplicate button is clicked */
  onDuplicate: OnCloseCallback;
}

/**
 * A single row in the layer stack, displaying layer information and actions.
 *
 * Shows:
 * - Layer index (1-based display)
 * - Layer type icon (○ for hoop, ⟋ for helical, ↻ for skip)
 * - Layer type name
 * - Layer summary (e.g., "Helical 45°", "Hoop (Terminal)")
 * - Action buttons (remove, duplicate)
 * - Drag handle for reordering
 *
 * The row is highlighted when active. Clicking the row selects it.
 *
 * @example
 * ```tsx
 * <LayerRow
 *   layer={layer}
 *   index={0}
 *   isActive={activeLayerId === layer.id}
 *   onSelect={() => setActiveLayerId(layer.id)}
 *   onRemove={() => removeLayer(layer.id)}
 *   onDuplicate={() => duplicateLayer(layer.id)}
 * />
 * ```
 *
 * @param props - Component props
 * @returns The layer row UI
 */
export function LayerRow({
  layer,
  index,
  isActive,
  onSelect,
  onRemove,
  onDuplicate,
}: LayerRowProps) {
  const getLayerSummary = (layer: Layer): string => {
    switch (layer.type) {
      case "hoop":
        return layer.hoop?.terminal ? "Hoop (Terminal)" : "Hoop";
      case "helical":
        return `Helical ${layer.helical?.wind_angle ?? 45}°`;
      case "skip":
        return `Skip ${layer.skip?.mandrel_rotation ?? 90}°`;
      default:
        return "Unknown";
    }
  };

  const getLayerIcon = (type: LayerType): string => {
    switch (type) {
      case "hoop":
        return "○";
      case "helical":
        return "⟋";
      case "skip":
        return "↻";
    }
  };

  return (
    <div
      className={`layer-row ${isActive ? "layer-row--active" : ""}`}
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
