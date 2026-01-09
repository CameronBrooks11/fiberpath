import { useState, FocusEvent } from "react";
import { useProjectStore } from "../../state/projectStore";
import { NUMERIC_RANGES, validateNumericRange } from "../../types/components";

/**
 * Form component for editing mandrel parameters.
 *
 * The mandrel is the cylindrical form around which the fiber is wound.
 * This form allows editing of:
 * - **Diameter**: The outer diameter of the mandrel (mm, must be > 0)
 * - **Wind Length**: The axial length available for winding (mm, must be > 0)
 *
 * Both fields are validated on blur to ensure positive values.
 * Invalid values are highlighted with error messages.
 *
 * @example
 * ```tsx
 * <MandrelForm />
 * ```
 *
 * @returns The mandrel parameter form UI
 */
export function MandrelForm() {
  const mandrel = useProjectStore((state) => state.project.mandrel);
  const updateMandrel = useProjectStore((state) => state.updateMandrel);

  const [errors, setErrors] = useState<{
    diameter?: string;
    wind_length?: string;
  }>({});

  const handleDiameterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    updateMandrel({ diameter: value });
  };

  const handleDiameterBlur = (e: FocusEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const error = validateNumericRange(
      value,
      NUMERIC_RANGES.MANDREL_DIAMETER,
      "Diameter",
    );
    setErrors((prev) => ({ ...prev, diameter: error }));
  };

  const handleWindLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    updateMandrel({ wind_length: value });
  };

  const handleWindLengthBlur = (e: FocusEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const error = validateNumericRange(
      value,
      NUMERIC_RANGES.WIND_LENGTH,
      "Wind length",
    );
    setErrors((prev) => ({ ...prev, wind_length: error }));
  };

  return (
    <div className="param-form">
      <h3 className="param-form__title">Mandrel Parameters</h3>

      <div className="param-form__group">
        <label htmlFor="mandrel-diameter" className="param-form__label">
          Diameter
        </label>
        <div className="param-form__input-wrapper">
          <input
            id="mandrel-diameter"
            type="number"
            step="0.1"
            min="0"
            value={mandrel.diameter}
            onChange={handleDiameterChange}
            onBlur={handleDiameterBlur}
            className={`param-form__input ${errors.diameter ? "param-form__input--error" : ""}`}
          />
          <span className="param-form__unit">mm</span>
        </div>
        {errors.diameter && (
          <span className="param-form__error">{errors.diameter}</span>
        )}
      </div>

      <div className="param-form__group">
        <label htmlFor="mandrel-wind-length" className="param-form__label">
          Wind Length
        </label>
        <div className="param-form__input-wrapper">
          <input
            id="mandrel-wind-length"
            type="number"
            step="0.1"
            min="0"
            value={mandrel.wind_length}
            onChange={handleWindLengthChange}
            onBlur={handleWindLengthBlur}
            className={`param-form__input ${errors.wind_length ? "param-form__input--error" : ""}`}
          />
          <span className="param-form__unit">mm</span>
        </div>
        {errors.wind_length && (
          <span className="param-form__error">{errors.wind_length}</span>
        )}
      </div>
    </div>
  );
}
