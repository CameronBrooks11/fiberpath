import { useState } from "react";
import { useProjectStore } from "../../stores/projectStore";
import { setFieldError } from "../../lib/numericFields";
import { LayerNumericField } from "./LayerNumericField";
import type { LayerEditorBaseProps } from "../../types/components";

interface SkipLayerEditorProps extends LayerEditorBaseProps {
  // SkipLayerEditor uses only the base props
}

export function SkipLayerEditor({ layerId }: SkipLayerEditorProps) {
  const layers = useProjectStore((state) => state.project.layers);
  const updateLayer = useProjectStore((state) => state.updateLayer);

  const [errors, setErrors] = useState<
    Partial<Record<"mandrel_rotation", string>>
  >({});

  const layer = layers.find((item) => item.id === layerId);

  if (!layer || layer.type !== "skip" || !layer.skip) {
    return null;
  }

  const validateRotation = (value: number): string | undefined => {
    if (Number.isNaN(value)) {
      return "Rotation must be a valid number";
    }
    return undefined;
  };

  const handleRotationChange = (value: number) => {
    updateLayer(layerId, {
      skip: {
        mandrel_rotation: value,
      },
    });
  };

  const handleRotationBlur = (value: number) => {
    setFieldError(setErrors, "mandrel_rotation", validateRotation(value));
  };

  return (
    <div className="layer-editor">
      <h3 className="layer-editor__title">Skip Layer Properties</h3>

      <LayerNumericField
        id={`rotation-${layerId}`}
        label="Mandrel Rotation"
        tooltip="Mandrel-only rotation performed with no fiber deposition. Use this to reposition the start phase between winding layers."
        value={layer.skip.mandrel_rotation}
        step="0.1"
        unit="°"
        error={errors.mandrel_rotation}
        onChange={handleRotationChange}
        onBlur={handleRotationBlur}
      />

      <p className="layer-editor__hint">
        Applies a dry rotation step between layers to shift where the next
        winding path starts.
      </p>
    </div>
  );
}
