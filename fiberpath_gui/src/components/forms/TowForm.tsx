import { useState, FocusEvent } from "react";
import { useProjectStore } from "../../state/projectStore";
import { NUMERIC_RANGES, validateNumericRange } from "../../types/components";

/**
 * Form component for editing tow (fiber) parameters.
 *
 * The tow represents the fiber material being wound onto the mandrel.
 * This form allows editing of:
 * - **Width**: The width of the tow strip (mm, must be > 0)
 * - **Thickness**: The thickness of the tow strip (mm, must be > 0)
 *
 * Both fields are validated on blur to ensure positive values.
 * Invalid values are highlighted with error messages.
 *
 * @example
 * ```tsx
 * <TowForm />
 * ```
 *
 * @returns The tow parameter form UI
 */
export function TowForm() {
  const tow = useProjectStore((state) => state.project.tow);
  const updateTow = useProjectStore((state) => state.updateTow);

  const [errors, setErrors] = useState<{ width?: string; thickness?: string }>(
    {},
  );

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    updateTow({ width: value });
  };

  const handleWidthBlur = (e: FocusEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const error = validateNumericRange(
      value,
      NUMERIC_RANGES.TOW_WIDTH,
      "Width",
    );
    setErrors((prev) => ({ ...prev, width: error }));
  };

  const handleThicknessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    updateTow({ thickness: value });
  };

  const handleThicknessBlur = (e: FocusEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const error = validateNumericRange(
      value,
      NUMERIC_RANGES.TOW_THICKNESS,
      "Thickness",
    );
    setErrors((prev) => ({ ...prev, thickness: error }));
  };

  return (
    <div className="param-form">
      <h3 className="param-form__title">Tow Parameters</h3>

      <div className="param-form__group">
        <label htmlFor="tow-width" className="param-form__label">
          Width
        </label>
        <div className="param-form__input-wrapper">
          <input
            id="tow-width"
            type="number"
            step="0.1"
            min="0"
            value={tow.width}
            onChange={handleWidthChange}
            onBlur={handleWidthBlur}
            className={`param-form__input ${errors.width ? "param-form__input--error" : ""}`}
          />
          <span className="param-form__unit">mm</span>
        </div>
        {errors.width && (
          <span className="param-form__error">{errors.width}</span>
        )}
      </div>

      <div className="param-form__group">
        <label htmlFor="tow-thickness" className="param-form__label">
          Thickness
        </label>
        <div className="param-form__input-wrapper">
          <input
            id="tow-thickness"
            type="number"
            step="0.01"
            min="0"
            value={tow.thickness}
            onChange={handleThicknessChange}
            onBlur={handleThicknessBlur}
            className={`param-form__input ${errors.thickness ? "param-form__input--error" : ""}`}
          />
          <span className="param-form__unit">mm</span>
        </div>
        {errors.thickness && (
          <span className="param-form__error">{errors.thickness}</span>
        )}
      </div>
    </div>
  );
}
