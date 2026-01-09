import { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useShallow } from "zustand/react/shallow";
import { useProjectStore } from "../../state/projectStore";
import { LayerType } from "../../types/project";
import { LayerRow } from "./LayerRow";

/**
 * The LayerStack component displays and manages the list of winding layers.
 *
 * Features:
 * - Displays all layers in order with drag-and-drop reordering
 * - Shows layer type, index, and summary information
 * - Highlights the currently selected/active layer
 * - Provides "Add Layer" button with type picker (hoop, helical, skip)
 * - Individual layer actions (select, remove, duplicate)
 * - Drag handles for visual reordering feedback
 *
 * Uses @hello-pangea/dnd for drag-and-drop functionality.
 * Optimized with shallow comparison to prevent unnecessary re-renders
 * when only specific store properties change.
 *
 * @example
 * ```tsx
 * <LayerStack />
 * ```
 *
 * @returns The layer stack UI with all layers and controls
 */
export function LayerStack() {
  // Use shallow comparison for multiple selectors to prevent unnecessary re-renders
  const {
    layers,
    activeLayerId,
    addLayer,
    removeLayer,
    duplicateLayer,
    reorderLayers,
    setActiveLayerId,
  } = useProjectStore(
    useShallow((state) => ({
      layers: state.project.layers,
      activeLayerId: state.project.activeLayerId,
      addLayer: state.addLayer,
      removeLayer: state.removeLayer,
      duplicateLayer: state.duplicateLayer,
      reorderLayers: state.reorderLayers,
      setActiveLayerId: state.setActiveLayerId,
    })),
  );

  const [showTypePicker, setShowTypePicker] = useState(false);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const startIndex = result.source.index;
    const endIndex = result.destination.index;

    if (startIndex !== endIndex) {
      reorderLayers(startIndex, endIndex);
    }
  };

  const handleAddLayer = (type: LayerType) => {
    addLayer(type);
    setShowTypePicker(false);
  };

  return (
    <div className="layer-stack">
      <div className="layer-stack__header">
        <h3 className="layer-stack__title">Layer Stack</h3>
        <div className="layer-stack__actions">
          <button
            className="layer-stack__add-btn"
            onClick={() => setShowTypePicker(!showTypePicker)}
          >
            + Add Layer
          </button>
        </div>
      </div>

      {showTypePicker && (
        <div className="layer-type-picker">
          <button
            className="layer-type-picker__option"
            onClick={() => handleAddLayer("hoop")}
          >
            <span className="layer-type-picker__icon">○</span>
            <span className="layer-type-picker__label">Hoop Layer</span>
          </button>
          <button
            className="layer-type-picker__option"
            onClick={() => handleAddLayer("helical")}
          >
            <span className="layer-type-picker__icon">⟋</span>
            <span className="layer-type-picker__label">Helical Layer</span>
          </button>
          <button
            className="layer-type-picker__option"
            onClick={() => handleAddLayer("skip")}
          >
            <span className="layer-type-picker__icon">↻</span>
            <span className="layer-type-picker__label">Skip Layer</span>
          </button>
        </div>
      )}

      {layers.length === 0 ? (
        <div className="layer-stack__empty">
          <div className="layer-stack__empty-icon">⬢</div>
          <p className="layer-stack__empty-text">No layers yet</p>
          <p className="layer-stack__empty-hint">
            Click "Add Layer" to get started
          </p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="layer-stack">
            {(provided, snapshot) => (
              <div
                className={`layer-stack__list ${snapshot.isDraggingOver ? "layer-stack__list--dragging" : ""}`}
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {layers.map((layer, index) => (
                  <Draggable
                    key={layer.id}
                    draggableId={layer.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                          opacity: snapshot.isDragging ? 0.8 : 1,
                        }}
                      >
                        <LayerRow
                          layer={layer}
                          index={index}
                          isActive={layer.id === activeLayerId}
                          onSelect={() => setActiveLayerId(layer.id)}
                          onRemove={() => removeLayer(layer.id)}
                          onDuplicate={() => duplicateLayer(layer.id)}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
