import { useState } from "react";
import { useProjectStore } from "../../stores/projectStore";
import type { LayerEditorBaseProps } from "../../types/components";
import type { HelicalLayer } from "../../types/project";
import {
  validateHelicalField,
  type HelicalNumericField,
} from "../../lib/helicalValidation";
import { setFieldError } from "../../lib/numericFields";
import { LayerNumericField } from "./LayerNumericField";

interface HelicalLayerEditorProps extends LayerEditorBaseProps {
  // HelicalLayerEditor uses only the base props
}

interface HelicalFieldConfig {
  field: HelicalNumericField;
  label: string;
  tooltip: string;
  unit?: string;
  step?: string;
  integer?: boolean;
}

const HELICAL_FIELD_CONFIGS: HelicalFieldConfig[] = [
  {
    field: "wind_angle",
    label: "Wind Angle",
    tooltip:
      "Angle between fiber path and mandrel axis: 0 degrees is axial, 90 degrees is hoop. Helical layers must be > 0 and <= 90.",
    unit: "°",
    step: "0.1",
  },
  {
    field: "pattern_number",
    label: "Pattern Number",
    tooltip:
      "How many helical bands the layer is split into around the circumference. Must be a positive integer and must divide the computed circuit count.",
    integer: true,
    step: "1",
  },
  {
    field: "skip_index",
    label: "Skip Index",
    tooltip:
      "Stride used to move between helical bands each circuit. Must be a positive integer and coprime with pattern number to visit every band.",
    integer: true,
    step: "1",
  },
  {
    field: "lock_degrees",
    label: "Lock Degrees",
    tooltip:
      "Extra mandrel rotation at the lock point for stable termination/restart alignment between circuits.",
    unit: "°",
    step: "0.1",
  },
  {
    field: "lead_in_mm",
    label: "Lead-in",
    tooltip:
      "Linear approach distance before the main winding path starts; used to smooth fiber entry onto the part.",
    unit: "mm",
    step: "0.1",
  },
  {
    field: "lead_out_degrees",
    label: "Lead-out Degrees",
    tooltip:
      "Extra mandrel rotation after the main path ends; used to smooth exit and maintain placement continuity.",
    unit: "°",
    step: "0.1",
  },
];

const DEFAULT_HELICAL: HelicalLayer = {
  wind_angle: 45,
  pattern_number: 3,
  skip_index: 2,
  lock_degrees: 5,
  lead_in_mm: 10,
  lead_out_degrees: 5,
  skip_initial_near_lock: false,
};

export function HelicalLayerEditor({ layerId }: HelicalLayerEditorProps) {
  const layers = useProjectStore((state) => state.project.layers);
  const updateLayer = useProjectStore((state) => state.updateLayer);
  const [errors, setErrors] = useState<Partial<Record<HelicalNumericField, string>>>({});

  const layer = layers.find((item) => item.id === layerId);

  if (!layer || layer.type !== "helical" || !layer.helical) {
    return null;
  }
  const helical = layer.helical;

  const handleNumericChange = (field: HelicalNumericField, value: number) => {
    const currentHelical = helical || DEFAULT_HELICAL;

    updateLayer(layerId, {
      helical: {
        ...currentHelical,
        [field]: value,
      },
    });
  };

  const handleNumericBlur = (field: HelicalNumericField, value: number) => {
    const error = validateHelicalField(field, value, helical);
    setFieldError(setErrors, field, error);
  };

  const handleSkipNearLockChange = (checked: boolean) => {
    const currentHelical = helical || DEFAULT_HELICAL;

    updateLayer(layerId, {
      helical: {
        ...currentHelical,
        skip_initial_near_lock: checked,
      },
    });
  };

  return (
    <div className="layer-editor">
      <h3 className="layer-editor__title">Helical Layer Properties</h3>

      {HELICAL_FIELD_CONFIGS.map((config) => (
        <LayerNumericField
          key={config.field}
          id={`${config.field}-${layerId}`}
          label={config.label}
          tooltip={config.tooltip}
          value={helical[config.field]}
          step={config.step}
          unit={config.unit}
          integer={config.integer}
          error={errors[config.field]}
          onChange={(value) => handleNumericChange(config.field, value)}
          onBlur={(value) => handleNumericBlur(config.field, value)}
        />
      ))}

      <div className="layer-editor__group">
        <label className="layer-editor__checkbox-label">
          <input
            type="checkbox"
            checked={helical.skip_initial_near_lock}
            onChange={(e) => handleSkipNearLockChange(e.target.checked)}
            className="layer-editor__checkbox"
          />
          <span className="layer-editor__checkbox-text">
            Skip Initial Near Lock
          </span>
        </label>
        <p className="layer-editor__hint">
          Skip the first near-lock handling step. Enable only when you
          intentionally want custom lock behavior.
        </p>
      </div>
    </div>
  );
}
