import { useEffect, useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useProjectStore } from "../../stores/projectStore";
import type { LayerEditorBaseProps } from "../../types/components";
import type { HelicalLayer } from "../../types/project";
import {
  validateHelicalField,
  getHelicalGeometryHint,
  type HelicalNumericField,
} from "../../lib/helicalValidation";
import { setFieldError } from "../../lib/numericFields";
import type { UiValidationField } from "../../lib/validationErrors";
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

const HELICAL_VALIDATION_FIELD_MAP: Record<HelicalNumericField, UiValidationField> = {
  wind_angle: "layers.helical.wind_angle",
  pattern_number: "layers.helical.pattern_number",
  skip_index: "layers.helical.skip_index",
  lock_degrees: "layers.helical.lock_degrees",
  lead_in_mm: "layers.helical.lead_in_mm",
  lead_out_degrees: "layers.helical.lead_out_degrees",
};

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
  const mandrelDiameter = useProjectStore((state) => state.project.mandrel.diameter);
  const towWidth = useProjectStore((state) => state.project.tow.width);
  const validationErrors = useProjectStore((state) => state.validationErrors);
  const updateLayer = useProjectStore((state) => state.updateLayer);
  const setValidationError = useProjectStore((state) => state.setValidationError);
  const [errors, setErrors] = useState<Partial<Record<HelicalNumericField, string>>>({});

  const layer = layers.find((item) => item.id === layerId);
  const helical =
    layer && layer.type === "helical" && layer.helical ? layer.helical : null;
  const debouncedHelical = useDebouncedValue(helical ?? DEFAULT_HELICAL, 300);

  useEffect(() => {
    if (!helical) {
      setErrors({});
      return;
    }

    const nextErrors: Partial<Record<HelicalNumericField, string>> = {};

    for (const config of HELICAL_FIELD_CONFIGS) {
      const error = validateHelicalField(
        config.field,
        debouncedHelical[config.field],
        debouncedHelical,
      );
      if (error) {
        nextErrors[config.field] = error;
      }
    }

    setErrors(nextErrors);
  }, [debouncedHelical, helical]);

  if (!layer || layer.type !== "helical" || !helical) {
    return null;
  }

  const handleNumericChange = (field: HelicalNumericField, value: number) => {
    const currentHelical = helical || DEFAULT_HELICAL;
    setValidationError(HELICAL_VALIDATION_FIELD_MAP[field], undefined);
    if (field === "pattern_number" || field === "skip_index") {
      setValidationError("layers.helical.pattern_number", undefined);
      setValidationError("layers.helical.skip_index", undefined);
    }

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

  const geometryHint = getHelicalGeometryHint(helical, mandrelDiameter, towWidth);

  return (
    <div className="layer-editor">
      <h3 className="layer-editor__title">Helical Layer Properties</h3>

      {HELICAL_FIELD_CONFIGS.map((config) => {
        const backendError =
          validationErrors[HELICAL_VALIDATION_FIELD_MAP[config.field]];
        return (
          <LayerNumericField
            key={config.field}
            id={`${config.field}-${layerId}`}
            label={config.label}
            tooltip={config.tooltip}
            value={helical[config.field]}
            step={config.step}
            unit={config.unit}
            integer={config.integer}
            error={errors[config.field] || backendError}
            onChange={(value) => handleNumericChange(config.field, value)}
            onBlur={(value) => handleNumericBlur(config.field, value)}
          />
        );
      })}

      {geometryHint && (
        <p className="layer-editor__hint layer-editor__hint--warning">
          {geometryHint}
        </p>
      )}

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
