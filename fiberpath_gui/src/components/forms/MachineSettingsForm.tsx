import { useState, FocusEvent } from "react";
import { useProjectStore } from "../../state/projectStore";

export function MachineSettingsForm() {
  const defaultFeedRate = useProjectStore(
    (state) => state.project.defaultFeedRate,
  );
  const axisFormat = useProjectStore((state) => state.project.axisFormat);
  const updateDefaultFeedRate = useProjectStore(
    (state) => state.updateDefaultFeedRate,
  );
  const setAxisFormat = useProjectStore((state) => state.setAxisFormat);

  const [errors, setErrors] = useState<{ defaultFeedRate?: string }>({});

  const validateFeedRate = (value: number): string | undefined => {
    if (isNaN(value) || value <= 0) {
      return "Feed rate must be greater than 0";
    }
    if (value > 10000) {
      return "Feed rate seems unreasonably high";
    }
    return undefined;
  };

  const handleFeedRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    updateDefaultFeedRate(value);
  };

  const handleFeedRateBlur = (e: FocusEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const error = validateFeedRate(value);
    setErrors((prev) => ({ ...prev, defaultFeedRate: error }));
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
            onChange={handleFeedRateChange}
            onBlur={handleFeedRateBlur}
            min="1"
            max="10000"
            step="100"
            className={`param-form__input ${errors.defaultFeedRate ? "param-form__input--error" : ""}`}
          />
          <span className="param-form__unit">mm/min</span>
        </div>
        {errors.defaultFeedRate && (
          <span className="param-form__error">{errors.defaultFeedRate}</span>
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
