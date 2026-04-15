import { describe, expect, it, vi } from "vitest";
import { parseNumericInput, setFieldError } from "./numericFields";

describe("parseNumericInput()", () => {
  it("parses float strings by default", () => {
    expect(parseNumericInput("3.14")).toBeCloseTo(3.14);
  });

  it("parses integer strings when integer flag is true", () => {
    expect(parseNumericInput("42", true)).toBe(42);
  });

  it("truncates decimals in integer mode", () => {
    expect(parseNumericInput("3.99", true)).toBe(3);
  });

  it("returns NaN for non-numeric input", () => {
    expect(parseNumericInput("abc")).toBeNaN();
  });

  it("handles empty string", () => {
    expect(parseNumericInput("")).toBeNaN();
  });

  it("handles negative numbers", () => {
    expect(parseNumericInput("-5.5")).toBeCloseTo(-5.5);
  });
});

describe("setFieldError()", () => {
  it("calls setErrors setter with the new field error merged in", () => {
    const setErrors = vi.fn();
    setFieldError(setErrors, "name", "Required");
    expect(setErrors).toHaveBeenCalledTimes(1);

    // The setter receives an updater function — call it with existing state
    const updater = setErrors.mock.calls[0][0];
    const prev = { other: "existing" };
    const next = updater(prev);
    expect(next).toEqual({ other: "existing", name: "Required" });
  });

  it("clears a field error when passing undefined", () => {
    const setErrors = vi.fn();
    setFieldError(setErrors, "name", undefined);
    const updater = setErrors.mock.calls[0][0];
    const result = updater({ name: "old error", other: "keep" });
    expect(result.name).toBeUndefined();
    expect(result.other).toBe("keep");
  });

  it("overwrites an existing error for the same field", () => {
    const setErrors = vi.fn();
    setFieldError(setErrors, "age", "New error");
    const updater = setErrors.mock.calls[0][0];
    const result = updater({ age: "Old error" });
    expect(result.age).toBe("New error");
  });
});
