import { useState, FocusEvent } from "react";
import { useProjectStore } from "../../state/projectStore";
import type { LayerEditorBaseProps } from "../../types/components";

/**
 * Props for the SkipLayerEditor component.
 */
interface SkipLayerEditorProps extends LayerEditorBaseProps {
  // SkipLayerEditor uses only the base props
}

/**
 * Editor component for skip layer properties.
 *
 * Skip layers represent intentional gaps in the winding pattern,
 * allowing for rotation of the pattern without depositing material.
 * The rotation value determines the angular offset in degrees.
 *
 * @example
 * ```tsx
 * <SkipLayerEditor layerId="layer-456" />
 * ```
 *
 * @param props - Component props
 * @param props.layerId - The unique identifier of the skip layer to edit
 * @returns The skip layer editor UI, or null if the layer is not found or is not a skip layer
 */
export function SkipLayerEditor({ layerId }: SkipLayerEditorProps) {
  const layers = useProjectStore((state) => state.project.layers);
  const updateLayer = useProjectStore((state) => state.updateLayer);

  const layer = layers.find((l) => l.id === layerId);

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!layer || layer.type !== "skip" || !layer.skip) {
    return null;
  }

  const validateRotation = (value: number): string | undefined => {
    if (isNaN(value)) {
      return "Rotation must be a valid number";
    }
    return undefined;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    updateLayer(layerId, {
      skip: {
        mandrel_rotation: value,
      },
    });
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const error = validateRotation(value);
    setErrors({ mandrel_rotation: error || "" });
  };

  return (
    <div className="layer-editor">
      <h3 className="layer-editor__title">Skip Layer Properties</h3>

      <div className="layer-editor__group">
        <label htmlFor={`rotation-${layerId}`} className="layer-editor__label">
          Mandrel Rotation
          <span
            className="layer-editor__tooltip"
            title="Degrees to rotate mandrel without winding"
          >
            ⓘ
          </span>
        </label>
        <div className="layer-editor__input-wrapper">
          <input
            id={`rotation-${layerId}`}
            type="number"
            step="0.1"
            value={layer.skip.mandrel_rotation}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`layer-editor__input ${errors.mandrel_rotation ? "layer-editor__input--error" : ""}`}
          />
          <span className="layer-editor__unit">°</span>
        </div>
        {errors.mandrel_rotation && (
          <span className="layer-editor__error">{errors.mandrel_rotation}</span>
        )}
        <p className="layer-editor__hint">
          Rotate the mandrel by this amount without laying down material
        </p>
      </div>
    </div>
  );
}
