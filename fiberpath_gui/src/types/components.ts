/**
 * Shared type definitions for component props across the application.
 * These types ensure consistency in callback signatures and common patterns.
 */

/**
 * Standard callback for close/cancel actions in dialogs and modals.
 * @example
 * ```tsx
 * function MyDialog({ onClose }: { onClose: OnCloseCallback }) {
 *   return <button onClick={onClose}>Close</button>
 * }
 * ```
 */
export type OnCloseCallback = () => void;

/**
 * Standard callback for generic change events.
 * @template T - The type of value being changed
 * @example
 * ```tsx
 * function NumberInput({ value, onChange }: { value: number; onChange: OnChangeCallback<number> }) {
 *   return <input type="number" value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
 * }
 * ```
 */
export type OnChangeCallback<T> = (value: T) => void;

/**
 * Props for components that edit a specific layer by ID.
 * All layer editor components should extend this interface.
 * @example
 * ```tsx
 * interface HoopLayerEditorProps extends LayerEditorBaseProps {
 *   // Additional hoop-specific props
 * }
 * ```
 */
export interface LayerEditorBaseProps {
  /** The unique identifier of the layer being edited */
  layerId: string;
}

/**
 * Props for dialog components that require a close callback.
 * All dialog components should extend this interface.
 * @example
 * ```tsx
 * interface AboutDialogProps extends DialogBaseProps {
 *   version: string;
 * }
 * ```
 */
export interface DialogBaseProps {
  /** Callback invoked when the dialog should be closed */
  onClose: OnCloseCallback;
}

/**
 * Numeric range constraint for input validation.
 * Use this to document and enforce valid ranges for numeric inputs.
 * @example
 * ```tsx
 * const WIND_ANGLE_RANGE: NumericRange = { min: 0, max: 90, inclusive: { min: false, max: false } };
 * ```
 */
export interface NumericRange {
  /** Minimum allowed value */
  min: number;
  /** Maximum allowed value */
  max: number;
  /** Whether min/max values are inclusive (default: both true) */
  inclusive?: {
    min?: boolean;
    max?: boolean;
  };
}

/**
 * Common numeric ranges used throughout the application.
 * These constants ensure consistency in validation across components.
 */
export const NUMERIC_RANGES = {
  /** Wind angle: 0° to 90° (exclusive) */
  WIND_ANGLE: { min: 0, max: 90, inclusive: { min: false, max: false } } as NumericRange,
  
  /** Feed rate: 1 to 10000 mm/min */
  FEED_RATE: { min: 1, max: 10000, inclusive: { min: true, max: true } } as NumericRange,
  
  /** Mandrel diameter: > 0 mm */
  MANDREL_DIAMETER: { min: 0, max: Infinity, inclusive: { min: false, max: false } } as NumericRange,
  
  /** Wind length: > 0 mm */
  WIND_LENGTH: { min: 0, max: Infinity, inclusive: { min: false, max: false } } as NumericRange,
  
  /** Tow width: > 0 mm */
  TOW_WIDTH: { min: 0, max: Infinity, inclusive: { min: false, max: false } } as NumericRange,
  
  /** Tow thickness: > 0 mm */
  TOW_THICKNESS: { min: 0, max: Infinity, inclusive: { min: false, max: false } } as NumericRange,
  
  /** Pattern/Skip: positive integers */
  PATTERN_SKIP: { min: 1, max: Infinity, inclusive: { min: true, max: false } } as NumericRange,
} as const;

/**
 * Validates a number against a range constraint.
 * @param value - The value to validate
 * @param range - The range constraint
 * @param fieldName - Human-readable field name for error messages
 * @returns Error message if invalid, undefined if valid
 * @example
 * ```tsx
 * const error = validateNumericRange(45, NUMERIC_RANGES.WIND_ANGLE, "Wind Angle");
 * if (error) {
 *   console.error(error); // "Wind Angle must be between 0 and 90 (exclusive)"
 * }
 * ```
 */
export function validateNumericRange(
  value: number,
  range: NumericRange,
  fieldName: string
): string | undefined {
  if (isNaN(value)) {
    return `${fieldName} must be a valid number`;
  }
  
  const { min, max, inclusive = { min: true, max: true } } = range;
  const minInclusive = inclusive.min ?? true;
  const maxInclusive = inclusive.max ?? true;
  
  if (minInclusive ? value < min : value <= min) {
    return `${fieldName} must be ${minInclusive ? 'at least' : 'greater than'} ${min}`;
  }
  
  if (maxInclusive ? value > max : value >= max) {
    return `${fieldName} must be ${maxInclusive ? 'at most' : 'less than'} ${max}`;
  }
  
  return undefined;
}
