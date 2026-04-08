import { useEffect, useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useProjectStore } from "../../stores/projectStore";
import { NUMERIC_RANGES, validateNumericRange } from "../../types/components";
import { parseNumericInput, setFieldError } from "../../lib/numericFields";

type MandrelField = "diameter" | "wind_length";

const validateMandrelField = (
  field: MandrelField,
  value: number,
): string | undefined =>
  field === "diameter"
    ? validateNumericRange(value, NUMERIC_RANGES.MANDREL_DIAMETER, "Diameter")
    : validateNumericRange(value, NUMERIC_RANGES.WIND_LENGTH, "Wind length");

export function MandrelForm() {
  const mandrel = useProjectStore((state) => state.project.mandrel);
  const updateMandrel = useProjectStore((state) => state.updateMandrel);
  const setValidationError = useProjectStore((state) => state.setValidationError);
  const backendDiameterError = useProjectStore(
    (state) => state.validationErrors["mandrel.diameter"],
  );
  const backendWindLengthError = useProjectStore(
    (state) => state.validationErrors["mandrel.wind_length"],
  );

  const [errors, setErrors] = useState<Partial<Record<MandrelField, string>>>({});
  const debouncedDiameter = useDebouncedValue(mandrel.diameter, 300);
  const debouncedWindLength = useDebouncedValue(mandrel.wind_length, 300);

  useEffect(() => {
    setFieldError(
      setErrors,
      "diameter",
      validateMandrelField("diameter", debouncedDiameter),
    );
  }, [debouncedDiameter]);

  useEffect(() => {
    setFieldError(
      setErrors,
      "wind_length",
      validateMandrelField("wind_length", debouncedWindLength),
    );
  }, [debouncedWindLength]);

  const handleNumericChange = (field: MandrelField, rawValue: string) => {
    setValidationError(
      field === "diameter" ? "mandrel.diameter" : "mandrel.wind_length",
      undefined,
    );
    updateMandrel({
      [field]: parseNumericInput(rawValue),
    });
  };

  const handleNumericBlur = (field: MandrelField, rawValue: string) => {
    const value = parseNumericInput(rawValue);
    setFieldError(setErrors, field, validateMandrelField(field, value));
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
            className={`param-form__input ${errors.diameter || backendDiameterError ? "param-form__input--error" : ""}`}
          />
          <span className="param-form__unit">mm</span>
        </div>
        {(errors.diameter || backendDiameterError) && (
          <span className="param-form__error">
            {errors.diameter || backendDiameterError}
          </span>
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
            className={`param-form__input ${errors.wind_length || backendWindLengthError ? "param-form__input--error" : ""}`}
          />
          <span className="param-form__unit">mm</span>
        </div>
        {(errors.wind_length || backendWindLengthError) && (
          <span className="param-form__error">
            {errors.wind_length || backendWindLengthError}
          </span>
        )}
      </div>
    </div>
  );
}
