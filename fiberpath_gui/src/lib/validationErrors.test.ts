import { describe, expect, it } from "vitest";
import { mapBackendValidationErrors } from "./validationErrors";

describe("mapBackendValidationErrors", () => {
  it("maps known mandrel and tow fields to UI validation keys", () => {
    const mapped = mapBackendValidationErrors([
      { field: "/mandrelParameters/diameter", message: "must be > 0" },
      { field: "/towParameters/thickness", message: "must be > 0" },
    ]);

    expect(mapped.fieldErrors["mandrel.diameter"]).toBe("must be > 0");
    expect(mapped.fieldErrors["tow.thickness"]).toBe("must be > 0");
    expect(mapped.unmappedErrors).toHaveLength(0);
  });

  it("uses message content when field path is generic", () => {
    const mapped = mapBackendValidationErrors([
      {
        field: "layers[0]",
        message: "skipIndex and patternNumber must be coprime for full coverage",
      },
    ]);

    const mappedMessage =
      mapped.fieldErrors["layers.helical.skip_index"] ??
      mapped.fieldErrors["layers.helical.pattern_number"];
    expect(mappedMessage).toContain("coprime");
  });

  it("returns unmapped errors when no field heuristic matches", () => {
    const mapped = mapBackendValidationErrors([
      {
        field: "unknown",
        message: "something unexpected happened",
      },
    ]);

    expect(mapped.fieldErrors).toEqual({});
    expect(mapped.unmappedErrors).toHaveLength(1);
  });
});
