import { useState, FocusEvent } from "react";
import { useProjectStore } from "../../state/projectStore";
import type { HelicalLayer } from "../../types/project";
import type {
  LayerEditorBaseProps,
  NumericRange,
} from "../../types/components";
import { NUMERIC_RANGES, validateNumericRange } from "../../types/components";

/**
 * Props for the HelicalLayerEditor component.
 */
interface HelicalLayerEditorProps extends LayerEditorBaseProps {
  // HelicalLayerEditor uses only the base props
}

/**
 * Editor component for helical layer properties.
 *
 * Helical layers wind at an angle to the mandrel axis, creating
 * structural reinforcement. Parameters include:
 * - **Wind angle**: Angle relative to the mandrel axis (0° to 90°, exclusive)
 * - **Pattern number**: Number of circuits in the pattern (must be coprime with skip_index)
 * - **Skip index**: Number of circuits to skip (must be coprime with pattern_number)
 * - **Terminal**: Whether this is the first/last layer
 * - **Turn offsets**: Start/end turning points for the wind
 * - **Circuit offsets**: Offset circuits at start/end
 *
 * The pattern_number and skip_index must be coprime (GCD = 1) to ensure
 * proper coverage of the mandrel surface.
 *
 * @example
 * ```tsx
 * <HelicalLayerEditor layerId="layer-789" />
 * ```
 *
 * @param props - Component props
 * @param props.layerId - The unique identifier of the helical layer to edit
 * @returns The helical layer editor UI, or null if the layer is not found or is not a helical layer
 */
export function HelicalLayerEditor({ layerId }: HelicalLayerEditorProps) {
  const layers = useProjectStore((state) => state.project.layers);
  const updateLayer = useProjectStore((state) => state.updateLayer);

  const layer = layers.find((l) => l.id === layerId);

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!layer || layer.type !== "helical" || !layer.helical) {
    return null;
  }

  /**
   * Calculate the greatest common divisor of two numbers.
   * Used to validate that pattern_number and skip_index are coprime.
   */
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  /**
   * Validates that pattern_number and skip_index are coprime (GCD = 1).
   * This ensures proper coverage of the mandrel surface.
   */
  const validateCoprime = (
    pattern: number,
    skip: number,
  ): string | undefined => {
    if (gcd(pattern, skip) !== 1) {
      return "Pattern and skip must be coprime (GCD = 1)";
    }
    return undefined;
  };

  const handleChange = (field: keyof HelicalLayer, value: number | boolean) => {
    const currentHelical = layer.helical || {
      wind_angle: 45,
      pattern_number: 3,
      skip_index: 2,
      lock_degrees: 5,
      lead_in_mm: 10,
      lead_out_degrees: 5,
      skip_initial_near_lock: false,
    };

    updateLayer(layerId, {
      helical: {
        ...currentHelical,
        [field]: value,
      },
    });
  };

  const handleBlur = (field: string, value: number) => {
    let error: string | undefined;

    switch (field) {
      case "wind_angle":
        error = validateNumericRange(
          value,
          NUMERIC_RANGES.WIND_ANGLE,
          "Wind angle",
        );
        break;
      case "pattern_number":
        error = validateNumericRange(
          value,
          NUMERIC_RANGES.PATTERN_SKIP,
          "Pattern number",
        );
        if (!error && layer.helical) {
          error = validateCoprime(value, layer.helical.skip_index);
        }
        break;
      case "skip_index":
        error = validateNumericRange(
          value,
          NUMERIC_RANGES.PATTERN_SKIP,
          "Skip index",
        );
        if (!error && layer.helical) {
          error = validateCoprime(layer.helical.pattern_number, value);
        }
        break;
      case "lock_degrees":
      case "lead_out_degrees":
        // Non-negative validation for degree values
        error =
          value < 0
            ? `${field.replace("_", " ")} must be non-negative`
            : undefined;
        break;
      case "lead_in_mm":
        // Non-negative validation for lead-in
        error = value < 0 ? "Lead-in must be non-negative" : undefined;
        break;
    }

    setErrors((prev) => ({
      ...prev,
      [field]: error || "",
    }));
  };

  return (
    <div className="layer-editor">
      <h3 className="layer-editor__title">Helical Layer Properties</h3>

      <div className="layer-editor__group">
        <label
          htmlFor={`wind-angle-${layerId}`}
          className="layer-editor__label"
        >
          Wind Angle
          <span
            className="layer-editor__tooltip"
            title="The angle of the helical wind path (0° to 90°)"
          >
            ⓘ
          </span>
        </label>
        <div className="layer-editor__input-wrapper">
          <input
            id={`wind-angle-${layerId}`}
            type="number"
            step="0.1"
            value={layer.helical.wind_angle}
            onChange={(e) =>
              handleChange("wind_angle", parseFloat(e.target.value))
            }
            onBlur={(e) => handleBlur("wind_angle", parseFloat(e.target.value))}
            className={`layer-editor__input ${errors.wind_angle ? "layer-editor__input--error" : ""}`}
          />
          <span className="layer-editor__unit">°</span>
        </div>
        {errors.wind_angle && (
          <span className="layer-editor__error">{errors.wind_angle}</span>
        )}
      </div>

      <div className="layer-editor__group">
        <label htmlFor={`pattern-${layerId}`} className="layer-editor__label">
          Pattern Number
          <span
            className="layer-editor__tooltip"
            title="Number of circuits in the winding pattern"
          >
            ⓘ
          </span>
        </label>
        <input
          id={`pattern-${layerId}`}
          type="number"
          step="1"
          value={layer.helical.pattern_number}
          onChange={(e) =>
            handleChange("pattern_number", parseInt(e.target.value))
          }
          onBlur={(e) => handleBlur("pattern_number", parseInt(e.target.value))}
          className={`layer-editor__input ${errors.pattern_number ? "layer-editor__input--error" : ""}`}
        />
        {errors.pattern_number && (
          <span className="layer-editor__error">{errors.pattern_number}</span>
        )}
      </div>

      <div className="layer-editor__group">
        <label htmlFor={`skip-${layerId}`} className="layer-editor__label">
          Skip Index
          <span
            className="layer-editor__tooltip"
            title="Number of patterns to skip (must be coprime with pattern number)"
          >
            ⓘ
          </span>
        </label>
        <input
          id={`skip-${layerId}`}
          type="number"
          step="1"
          value={layer.helical.skip_index}
          onChange={(e) => handleChange("skip_index", parseInt(e.target.value))}
          onBlur={(e) => handleBlur("skip_index", parseInt(e.target.value))}
          className={`layer-editor__input ${errors.skip_index ? "layer-editor__input--error" : ""}`}
        />
        {errors.skip_index && (
          <span className="layer-editor__error">{errors.skip_index}</span>
        )}
      </div>

      <div className="layer-editor__group">
        <label htmlFor={`lock-${layerId}`} className="layer-editor__label">
          Lock Degrees
          <span
            className="layer-editor__tooltip"
            title="Degrees of mandrel rotation for locking position"
          >
            ⓘ
          </span>
        </label>
        <div className="layer-editor__input-wrapper">
          <input
            id={`lock-${layerId}`}
            type="number"
            step="0.1"
            value={layer.helical.lock_degrees}
            onChange={(e) =>
              handleChange("lock_degrees", parseFloat(e.target.value))
            }
            onBlur={(e) =>
              handleBlur("lock_degrees", parseFloat(e.target.value))
            }
            className={`layer-editor__input ${errors.lock_degrees ? "layer-editor__input--error" : ""}`}
          />
          <span className="layer-editor__unit">°</span>
        </div>
        {errors.lock_degrees && (
          <span className="layer-editor__error">{errors.lock_degrees}</span>
        )}
      </div>

      <div className="layer-editor__group">
        <label htmlFor={`lead-in-${layerId}`} className="layer-editor__label">
          Lead-in
          <span
            className="layer-editor__tooltip"
            title="Linear distance for lead-in movement"
          >
            ⓘ
          </span>
        </label>
        <div className="layer-editor__input-wrapper">
          <input
            id={`lead-in-${layerId}`}
            type="number"
            step="0.1"
            value={layer.helical.lead_in_mm}
            onChange={(e) =>
              handleChange("lead_in_mm", parseFloat(e.target.value))
            }
            onBlur={(e) => handleBlur("lead_in_mm", parseFloat(e.target.value))}
            className={`layer-editor__input ${errors.lead_in_mm ? "layer-editor__input--error" : ""}`}
          />
          <span className="layer-editor__unit">mm</span>
        </div>
        {errors.lead_in_mm && (
          <span className="layer-editor__error">{errors.lead_in_mm}</span>
        )}
      </div>

      <div className="layer-editor__group">
        <label htmlFor={`lead-out-${layerId}`} className="layer-editor__label">
          Lead-out Degrees
          <span
            className="layer-editor__tooltip"
            title="Degrees of rotation for lead-out movement"
          >
            ⓘ
          </span>
        </label>
        <div className="layer-editor__input-wrapper">
          <input
            id={`lead-out-${layerId}`}
            type="number"
            step="0.1"
            value={layer.helical.lead_out_degrees}
            onChange={(e) =>
              handleChange("lead_out_degrees", parseFloat(e.target.value))
            }
            onBlur={(e) =>
              handleBlur("lead_out_degrees", parseFloat(e.target.value))
            }
            className={`layer-editor__input ${errors.lead_out_degrees ? "layer-editor__input--error" : ""}`}
          />
          <span className="layer-editor__unit">°</span>
        </div>
        {errors.lead_out_degrees && (
          <span className="layer-editor__error">{errors.lead_out_degrees}</span>
        )}
      </div>

      <div className="layer-editor__group">
        <label className="layer-editor__checkbox-label">
          <input
            type="checkbox"
            checked={layer.helical.skip_initial_near_lock}
            onChange={(e) =>
              handleChange("skip_initial_near_lock", e.target.checked)
            }
            className="layer-editor__checkbox"
          />
          <span className="layer-editor__checkbox-text">
            Skip Initial Near Lock
          </span>
        </label>
        <p className="layer-editor__hint">
          Skip the initial near-lock position check
        </p>
      </div>
    </div>
  );
}
