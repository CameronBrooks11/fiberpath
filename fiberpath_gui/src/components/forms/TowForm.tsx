import { useEffect, useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useProjectStore } from "../../stores/projectStore";
import { NUMERIC_RANGES, validateNumericRange } from "../../types/components";
import { parseNumericInput, setFieldError } from "../../lib/numericFields";

type TowField = "width" | "thickness";

const validateTowField = (field: TowField, value: number): string | undefined =>
  field === "width"
    ? validateNumericRange(value, NUMERIC_RANGES.TOW_WIDTH, "Width")
    : validateNumericRange(value, NUMERIC_RANGES.TOW_THICKNESS, "Thickness");

export function TowForm() {
  const tow = useProjectStore((state) => state.project.tow);
  const updateTow = useProjectStore((state) => state.updateTow);
  const setValidationError = useProjectStore((state) => state.setValidationError);
  const backendWidthError = useProjectStore(
    (state) => state.validationErrors["tow.width"],
  );
  const backendThicknessError = useProjectStore(
    (state) => state.validationErrors["tow.thickness"],
  );

  const [errors, setErrors] = useState<Partial<Record<TowField, string>>>({});
  const debouncedWidth = useDebouncedValue(tow.width, 300);
  const debouncedThickness = useDebouncedValue(tow.thickness, 300);

  useEffect(() => {
    setFieldError(setErrors, "width", validateTowField("width", debouncedWidth));
  }, [debouncedWidth]);

  useEffect(() => {
    setFieldError(
      setErrors,
      "thickness",
      validateTowField("thickness", debouncedThickness),
    );
  }, [debouncedThickness]);

  const handleNumericChange = (field: TowField, rawValue: string) => {
    setValidationError(
      field === "width" ? "tow.width" : "tow.thickness",
      undefined,
    );
    updateTow({
      [field]: parseNumericInput(rawValue),
    });
  };

  const handleNumericBlur = (field: TowField, rawValue: string) => {
    const value = parseNumericInput(rawValue);
    setFieldError(setErrors, field, validateTowField(field, value));
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
            className={`param-form__input ${errors.width || backendWidthError ? "param-form__input--error" : ""}`}
          />
          <span className="param-form__unit">mm</span>
        </div>
        {(errors.width || backendWidthError) && (
          <span className="param-form__error">
            {errors.width || backendWidthError}
          </span>
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
            onChange={(e) => handleNumericChange("thickness", e.target.value)}
            onBlur={(e) => handleNumericBlur("thickness", e.target.value)}
            className={`param-form__input ${errors.thickness || backendThicknessError ? "param-form__input--error" : ""}`}
          />
          <span className="param-form__unit">mm</span>
        </div>
        {(errors.thickness || backendThicknessError) && (
          <span className="param-form__error">
            {errors.thickness || backendThicknessError}
          </span>
        )}
      </div>
    </div>
  );
}
