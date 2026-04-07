import { NUMERIC_RANGES, validateNumericRange } from "../types/components";
import type { HelicalLayer } from "../types/project";

export type HelicalNumericField =
  | "wind_angle"
  | "pattern_number"
  | "skip_index"
  | "lock_degrees"
  | "lead_in_mm"
  | "lead_out_degrees";

const gcd = (a: number, b: number): number => {
  const normalizedA = Math.abs(a);
  const normalizedB = Math.abs(b);
  return normalizedB === 0 ? normalizedA : gcd(normalizedB, normalizedA % normalizedB);
};

const validateCoprime = (pattern: number, skip: number): string | undefined => {
  if (gcd(pattern, skip) !== 1) {
    return "Pattern and skip must be coprime (GCD = 1)";
  }
  return undefined;
};

export function validateHelicalField(
  field: HelicalNumericField,
  value: number,
  helical: HelicalLayer,
): string | undefined {
  switch (field) {
    case "wind_angle":
      return validateNumericRange(value, NUMERIC_RANGES.WIND_ANGLE, "Wind angle");

    case "pattern_number": {
      const baseError = validateNumericRange(
        value,
        NUMERIC_RANGES.PATTERN_SKIP,
        "Pattern number",
      );
      return baseError || validateCoprime(value, helical.skip_index);
    }

    case "skip_index": {
      const baseError = validateNumericRange(
        value,
        NUMERIC_RANGES.PATTERN_SKIP,
        "Skip index",
      );
      return baseError || validateCoprime(helical.pattern_number, value);
    }

    case "lock_degrees":
    case "lead_out_degrees":
      return value < 0
        ? `${field.replace("_", " ")} must be non-negative`
        : undefined;

    case "lead_in_mm":
      return value < 0 ? "Lead-in must be non-negative" : undefined;
  }
}
