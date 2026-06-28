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
  // Coprimality is only defined for two positive integers. While a sibling
  // field is mid-edit it can be NaN (an emptied input) or a non-integer; in
  // that case skip the cross-field check — the offending field reports its own
  // range error. This guard also prevents gcd() from infinite-recursing on
  // NaN (Math.abs(NaN) is NaN, NaN === 0 is false, and NaN % NaN is NaN, so it
  // never terminates), which previously crashed the app with a stack overflow.
  if (!Number.isInteger(pattern) || !Number.isInteger(skip)) {
    return undefined;
  }
  if (gcd(pattern, skip) !== 1) {
    return "Pattern and skip must be coprime (GCD = 1)";
  }
  return undefined;
};

function computeCircuitCount(
  helical: HelicalLayer,
  mandrelDiameter: number,
  towWidth: number,
): number | null {
  if (
    !Number.isFinite(mandrelDiameter) ||
    !Number.isFinite(towWidth) ||
    mandrelDiameter <= 0 ||
    towWidth <= 0
  ) {
    return null;
  }

  const angleRadians = (helical.wind_angle * Math.PI) / 180;
  const cosine = Math.cos(angleRadians);
  if (cosine <= 0) {
    return null;
  }

  const towArcLength = towWidth / cosine;
  if (towArcLength <= 0) {
    return null;
  }

  return Math.ceil((Math.PI * mandrelDiameter) / towArcLength);
}

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
      // The planner requires these to be strictly positive (PositiveFloat);
      // accepting 0 here only defers a 422 from the backend.
      return value <= 0
        ? `${field.replace("_", " ")} must be positive`
        : undefined;

    case "lead_in_mm":
      return value <= 0 ? "Lead-in must be positive" : undefined;
  }
}

/**
 * Derived helical geometry used to make the pattern relationship visible in the
 * editor: how many circuits the layer's wind angle + mandrel + tow produce, and
 * whether the pattern number divides them evenly (the rule the planner enforces).
 * Mirrors `compute_helical_kinematics` in the Python planner.
 *
 * Returns `null` while inputs are mid-edit or geometrically undefined (so the
 * caller shows nothing rather than a `NaN` readout).
 */
export interface HelicalGeometry {
  circuitCount: number;
  patternNumber: number;
  divisible: boolean;
}

export function getHelicalGeometry(
  helical: HelicalLayer,
  mandrelDiameter: number,
  towWidth: number,
): HelicalGeometry | null {
  if (!Number.isInteger(helical.pattern_number) || helical.pattern_number <= 0) {
    return null;
  }
  const circuitCount = computeCircuitCount(helical, mandrelDiameter, towWidth);
  if (!circuitCount) {
    return null;
  }
  return {
    circuitCount,
    patternNumber: helical.pattern_number,
    divisible: circuitCount % helical.pattern_number === 0,
  };
}

export function getHelicalGeometryHint(helical: HelicalLayer): string | undefined {
  // Routing warning only; the circuit-count / divisibility relationship is now
  // surfaced as an always-visible readout via getHelicalGeometry().
  if (helical.skip_index >= helical.pattern_number) {
    return "Skip index should be less than pattern number to avoid invalid routing.";
  }
  return undefined;
}
