import { parseNumericInput } from "../../lib/numericFields";

interface LayerNumericFieldProps {
  id: string;
  label: string;
  tooltip?: string;
  value: number;
  step?: string;
  unit?: string;
  integer?: boolean;
  error?: string;
  onChange: (value: number) => void;
  onBlur: (value: number) => void;
}

export function LayerNumericField({
  id,
  label,
  tooltip,
  value,
  step = "0.1",
  unit,
  integer = false,
  error,
  onChange,
  onBlur,
}: LayerNumericFieldProps) {
  const handleChange = (rawValue: string) => {
    onChange(parseNumericInput(rawValue, integer));
  };

  const handleBlur = (rawValue: string) => {
    onBlur(parseNumericInput(rawValue, integer));
  };

  return (
    <div className="layer-editor__group">
      <label htmlFor={id} className="layer-editor__label">
        {label}
        {tooltip && (
          <span className="layer-editor__tooltip" title={tooltip}>
            ⓘ
          </span>
        )}
      </label>
      <div className="layer-editor__input-wrapper">
        <input
          id={id}
          type="number"
          step={step}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={(e) => handleBlur(e.target.value)}
          className={`layer-editor__input ${error ? "layer-editor__input--error" : ""}`}
        />
        {unit && <span className="layer-editor__unit">{unit}</span>}
      </div>
      {error && <span className="layer-editor__error">{error}</span>}
    </div>
  );
}
