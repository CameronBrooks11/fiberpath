import { useEffect, useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useProjectStore } from "../../stores/projectStore";
import { parseNumericInput, setFieldError } from "../../lib/numericFields";

type MachineSettingsField = "defaultFeedRate";

const validateFeedRate = (value: number): string | undefined => {
  if (Number.isNaN(value) || value <= 0) {
    return "Feed rate must be greater than 0";
  }
  if (value > 10000) {
    return "Feed rate seems unreasonably high";
  }
  return undefined;
};

export function MachineSettingsForm() {
  const defaultFeedRate = useProjectStore(
    (state) => state.project.defaultFeedRate,
  );
  const axisFormat = useProjectStore((state) => state.project.axisFormat);
  const updateDefaultFeedRate = useProjectStore(
    (state) => state.updateDefaultFeedRate,
  );
  const setAxisFormat = useProjectStore((state) => state.setAxisFormat);
  const setValidationError = useProjectStore((state) => state.setValidationError);
  const backendFeedRateError = useProjectStore(
    (state) => state.validationErrors["machine.defaultFeedRate"],
  );

  const [errors, setErrors] = useState<
    Partial<Record<MachineSettingsField, string>>
  >({});
  const debouncedFeedRate = useDebouncedValue(defaultFeedRate, 300);

  useEffect(() => {
    setFieldError(
      setErrors,
      "defaultFeedRate",
      validateFeedRate(debouncedFeedRate),
    );
  }, [debouncedFeedRate]);

  const handleFeedRateChange = (rawValue: string) => {
    setValidationError("machine.defaultFeedRate", undefined);
    updateDefaultFeedRate(parseNumericInput(rawValue));
  };

  const handleFeedRateBlur = (rawValue: string) => {
    const value = parseNumericInput(rawValue);
    setFieldError(setErrors, "defaultFeedRate", validateFeedRate(value));
  };

  const handleAxisFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const format = e.target.value as "xab" | "xyz";
    setAxisFormat(format);
  };

  return (
    <div className="param-form">
      <h3 className="param-form__title">Machine Settings</h3>

      <div className="param-form__group">
        <label htmlFor="defaultFeedRate" className="param-form__label">
          Default Feed Rate
        </label>
        <div className="param-form__input-wrapper">
          <input
            id="defaultFeedRate"
            type="number"
            value={defaultFeedRate}
            onChange={(e) => handleFeedRateChange(e.target.value)}
            onBlur={(e) => handleFeedRateBlur(e.target.value)}
            min="1"
            max="10000"
            step="100"
            className={`param-form__input ${errors.defaultFeedRate || backendFeedRateError ? "param-form__input--error" : ""}`}
          />
          <span className="param-form__unit">mm/min</span>
        </div>
        {(errors.defaultFeedRate || backendFeedRateError) && (
          <span className="param-form__error">
            {errors.defaultFeedRate || backendFeedRateError}
          </span>
        )}
      </div>

      <div className="param-form__group">
        <label htmlFor="axisFormat" className="param-form__label">
          Axis Format
          <span className="param-form__hint">G-code output format</span>
        </label>
        <select
          id="axisFormat"
          value={axisFormat}
          onChange={handleAxisFormatChange}
          className="param-form__select"
        >
          <option value="xab">XAB (Rotational A+B axes)</option>
          <option value="xyz">XYZ (Legacy Cartesian)</option>
        </select>
        <div className="param-form__description">
          {axisFormat === "xab" ? (
            <span>Uses rotational axes for winding machine control</span>
          ) : (
            <span>Legacy format with Cartesian coordinates</span>
          )}
        </div>
      </div>
    </div>
  );
}
