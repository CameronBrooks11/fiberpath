import { useState } from "react";
import { useProjectStore } from "../../stores/projectStore";
import { NUMERIC_RANGES, validateNumericRange } from "../../types/components";
import { parseNumericInput, setFieldError } from "../../lib/numericFields";

type MandrelField = "diameter" | "wind_length";

export function MandrelForm() {
  const mandrel = useProjectStore((state) => state.project.mandrel);
  const updateMandrel = useProjectStore((state) => state.updateMandrel);

  const [errors, setErrors] = useState<Partial<Record<MandrelField, string>>>({});

  const handleNumericChange = (field: MandrelField, rawValue: string) => {
    updateMandrel({
      [field]: parseNumericInput(rawValue),
    });
  };

  const handleNumericBlur = (field: MandrelField, rawValue: string) => {
    const value = parseNumericInput(rawValue);
    const error =
      field === "diameter"
        ? validateNumericRange(value, NUMERIC_RANGES.MANDREL_DIAMETER, "Diameter")
        : validateNumericRange(value, NUMERIC_RANGES.WIND_LENGTH, "Wind length");

    setFieldError(setErrors, field, error);
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
            onChange={(e) => handleNumericChange("diameter", e.target.value)}
            onBlur={(e) => handleNumericBlur("diameter", e.target.value)}
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
            onChange={(e) => handleNumericChange("wind_length", e.target.value)}
            onBlur={(e) => handleNumericBlur("wind_length", e.target.value)}
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
