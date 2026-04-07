import { useState } from "react";
import { useProjectStore } from "../../stores/projectStore";
import { NUMERIC_RANGES, validateNumericRange } from "../../types/components";
import { parseNumericInput, setFieldError } from "../../lib/numericFields";

type TowField = "width" | "thickness";

export function TowForm() {
  const tow = useProjectStore((state) => state.project.tow);
  const updateTow = useProjectStore((state) => state.updateTow);

  const [errors, setErrors] = useState<Partial<Record<TowField, string>>>({});

  const handleNumericChange = (field: TowField, rawValue: string) => {
    updateTow({
      [field]: parseNumericInput(rawValue),
    });
  };

  const handleNumericBlur = (field: TowField, rawValue: string) => {
    const value = parseNumericInput(rawValue);
    const error =
      field === "width"
        ? validateNumericRange(value, NUMERIC_RANGES.TOW_WIDTH, "Width")
        : validateNumericRange(value, NUMERIC_RANGES.TOW_THICKNESS, "Thickness");

    setFieldError(setErrors, field, error);
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
            onChange={(e) => handleNumericChange("width", e.target.value)}
            onBlur={(e) => handleNumericBlur("width", e.target.value)}
            className={`param-form__input ${errors.width ? "param-form__input--error" : ""}`}
          />
          <span className="param-form__unit">mm</span>
        </div>
        {errors.width && <span className="param-form__error">{errors.width}</span>}
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
            onChange={(e) => handleNumericChange("thickness", e.target.value)}
            onBlur={(e) => handleNumericBlur("thickness", e.target.value)}
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
