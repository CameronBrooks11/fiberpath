import { describe, expect, it } from "vitest";
import {
  validateHelicalField,
  getHelicalGeometryHint,
  getHelicalGeometry,
} from "./helicalValidation";
import type { HelicalLayer } from "../types/project";

const defaultHelical: HelicalLayer = {
  wind_angle: 45,
  pattern_number: 3,
  skip_index: 2,
  lock_degrees: 540,
  lead_in_mm: 25,
  lead_out_degrees: 60,
  skip_initial_near_lock: false,
};

describe("helicalValidation", () => {
  describe("validateHelicalField()", () => {
    describe("wind_angle", () => {
      it("accepts a valid angle", () => {
        expect(
          validateHelicalField("wind_angle", 45, defaultHelical),
        ).toBeUndefined();
      });

      it("rejects an out-of-range angle", () => {
        expect(
          validateHelicalField("wind_angle", 91, defaultHelical),
        ).toBeDefined();
      });

      it("rejects 90 and sub-1 angles, accepts the [1, 89] bounds", () => {
        // The planner enforces [1, 89] (90° -> cos = 0). The editor must match.
        expect(validateHelicalField("wind_angle", 90, defaultHelical)).toBeDefined();
        expect(validateHelicalField("wind_angle", 0.5, defaultHelical)).toBeDefined();
        expect(validateHelicalField("wind_angle", 1, defaultHelical)).toBeUndefined();
        expect(validateHelicalField("wind_angle", 89, defaultHelical)).toBeUndefined();
      });
    });

    describe("pattern_number", () => {
      it("accepts coprime pattern/skip values", () => {
        // pattern=3, skip=2 → gcd(3,2)=1 → valid
        expect(
          validateHelicalField("pattern_number", 3, defaultHelical),
        ).toBeUndefined();
      });

      it("rejects non-coprime pattern/skip values", () => {
        // pattern=4, skip=2 → gcd(4,2)=2 → invalid
        const layer: HelicalLayer = { ...defaultHelical, skip_index: 2 };
        expect(validateHelicalField("pattern_number", 4, layer)).toMatch(
          /coprime/i,
        );
      });

      it("rejects out-of-range pattern number", () => {
        expect(
          validateHelicalField("pattern_number", 0, defaultHelical),
        ).toBeDefined();
      });
    });

    describe("skip_index", () => {
      it("accepts coprime skip/pattern values", () => {
        // skip=2, pattern=3 → gcd(3,2)=1 → valid
        expect(
          validateHelicalField("skip_index", 2, defaultHelical),
        ).toBeUndefined();
      });

      it("rejects non-coprime skip/pattern values", () => {
        // skip=2, pattern=4 → gcd(4,2)=2 → invalid
        const layer: HelicalLayer = { ...defaultHelical, pattern_number: 4 };
        expect(validateHelicalField("skip_index", 2, layer)).toMatch(/coprime/i);
      });

      it("rejects out-of-range skip index", () => {
        expect(
          validateHelicalField("skip_index", 0, defaultHelical),
        ).toBeDefined();
      });
    });

    // Regression: emptying a numeric input yields NaN. Re-validating the
    // sibling field then ran the coprime check (gcd) against the NaN value,
    // which recursed forever and crashed the app with
    // "RangeError: Maximum call stack size exceeded".
    describe("does not crash when a pattern/skip field is mid-edit", () => {
      it("returns a range error (not a stack overflow) for a NaN skip index", () => {
        expect(() =>
          validateHelicalField("skip_index", NaN, defaultHelical),
        ).not.toThrow();
        expect(validateHelicalField("skip_index", NaN, defaultHelical)).toBeDefined();
      });

      it("does not crash validating pattern_number when skip_index is NaN", () => {
        const layer: HelicalLayer = { ...defaultHelical, skip_index: NaN };
        expect(() =>
          validateHelicalField("pattern_number", 3, layer),
        ).not.toThrow();
        // pattern itself is valid; the coprime check is skipped while the
        // sibling is invalid, so no spurious error is reported here.
        expect(validateHelicalField("pattern_number", 3, layer)).toBeUndefined();
      });

      it("does not crash validating skip_index when pattern_number is NaN", () => {
        const layer: HelicalLayer = { ...defaultHelical, pattern_number: NaN };
        expect(() =>
          validateHelicalField("skip_index", 2, layer),
        ).not.toThrow();
        expect(validateHelicalField("skip_index", 2, layer)).toBeUndefined();
      });

      it("does not crash on non-integer pattern/skip values", () => {
        const layer: HelicalLayer = { ...defaultHelical, skip_index: 2.5 };
        expect(() =>
          validateHelicalField("pattern_number", 3, layer),
        ).not.toThrow();
      });
    });

    describe("lock_degrees", () => {
      it("rejects zero (planner requires a positive value)", () => {
        expect(
          validateHelicalField("lock_degrees", 0, defaultHelical),
        ).toBeDefined();
      });

      it("accepts positive value", () => {
        expect(
          validateHelicalField("lock_degrees", 360, defaultHelical),
        ).toBeUndefined();
      });

      it("rejects negative value", () => {
        expect(
          validateHelicalField("lock_degrees", -1, defaultHelical),
        ).toBeDefined();
      });
    });

    describe("lead_out_degrees", () => {
      it("rejects zero (planner requires a positive value)", () => {
        expect(
          validateHelicalField("lead_out_degrees", 0, defaultHelical),
        ).toBeDefined();
      });

      it("accepts positive value", () => {
        expect(
          validateHelicalField("lead_out_degrees", 30, defaultHelical),
        ).toBeUndefined();
      });

      it("rejects negative value", () => {
        expect(
          validateHelicalField("lead_out_degrees", -10, defaultHelical),
        ).toBeDefined();
      });
    });

    describe("lead_in_mm", () => {
      it("rejects zero (planner requires a positive value)", () => {
        expect(
          validateHelicalField("lead_in_mm", 0, defaultHelical),
        ).toBeDefined();
      });

      it("accepts positive value", () => {
        expect(
          validateHelicalField("lead_in_mm", 10, defaultHelical),
        ).toBeUndefined();
      });

      it("rejects negative value", () => {
        expect(
          validateHelicalField("lead_in_mm", -5, defaultHelical),
        ).toBeDefined();
      });
    });
  });

  describe("getHelicalGeometryHint()", () => {
    it("returns a hint when skip_index >= pattern_number", () => {
      const layer: HelicalLayer = {
        ...defaultHelical,
        skip_index: 3,
        pattern_number: 3,
      };
      expect(getHelicalGeometryHint(layer)).toMatch(/skip index/i);
    });

    it("returns undefined for a valid skip/pattern pairing", () => {
      expect(getHelicalGeometryHint(defaultHelical)).toBeUndefined();
    });
  });

  describe("getHelicalGeometry()", () => {
    it("reports the circuit count and a non-divisible pattern", () => {
      // At 45°, towWidth=50mm, diameter=150mm: tow arc = 50/cos(45°) ≈ 70.7mm
      // circuits = ceil(π×150 / 70.7) ≈ ceil(6.67) = 7, pattern=3 → 7%3≠0
      const layer: HelicalLayer = {
        ...defaultHelical,
        wind_angle: 45,
        pattern_number: 3,
        skip_index: 2,
      };
      const geometry = getHelicalGeometry(layer, 150, 50);
      expect(geometry).toEqual({
        circuitCount: 7,
        patternNumber: 3,
        divisible: false,
      });
    });

    it("flags a divisible pattern", () => {
      // Near-0° → cos≈1, tow arc ≈ towWidth. circuits = ceil(π*100/10.4) = 31.
      // Use pattern 31 so it divides exactly.
      const layer: HelicalLayer = {
        ...defaultHelical,
        wind_angle: 1,
        pattern_number: 31,
        skip_index: 2,
      };
      const geometry = getHelicalGeometry(layer, 100, 10.4);
      expect(geometry?.divisible).toBe(true);
      expect(geometry?.circuitCount).toBe(31);
    });

    it("returns null while pattern_number is mid-edit (NaN)", () => {
      const layer: HelicalLayer = { ...defaultHelical, pattern_number: NaN };
      expect(getHelicalGeometry(layer, 150, 50)).toBeNull();
    });

    it("returns null when mandrel diameter or tow width is non-positive", () => {
      expect(getHelicalGeometry(defaultHelical, 0, 12.7)).toBeNull();
      expect(getHelicalGeometry(defaultHelical, 150, 0)).toBeNull();
    });
  });
});
