import { describe, it, expect } from "vitest";
import {
  windDefinitionToDocument,
  projectToWindDefinition,
} from "./converters";
import type { WindDefinition } from "./wind-schema";

const sampleWind: WindDefinition = {
  schemaVersion: "1.0",
  mandrelParameters: { diameter: 200, windLength: 600 },
  towParameters: { width: 10, thickness: 0.3 },
  defaultFeedRate: 500,
  layers: [
    { windType: "hoop", terminal: true },
    {
      windType: "helical",
      windAngle: 55,
      patternNumber: 4,
      skipIndex: 3,
      lockDegrees: 540,
      leadInMM: 25,
      leadOutDegrees: 60,
      skipInitialNearLock: false,
    },
    { windType: "skip", mandrelRotation: 120 },
  ],
};

describe("windDefinitionToDocument", () => {
  it("maps mandrel/tow/feed and converts layers (no transient fields)", () => {
    const doc = windDefinitionToDocument(sampleWind);
    expect(doc).toEqual({
      mandrel: { diameter: 200, wind_length: 600 },
      tow: { width: 10, thickness: 0.3 },
      defaultFeedRate: 500,
      layers: expect.any(Array),
    });
    expect(doc.layers).toHaveLength(3);
    expect(doc.layers[0]).toMatchObject({ type: "hoop", hoop: { terminal: true } });
    expect(doc.layers[1]).toMatchObject({
      type: "helical",
      helical: { wind_angle: 55, pattern_number: 4, skip_index: 3 },
    });
    expect(doc.layers[2]).toMatchObject({ type: "skip", skip: { mandrel_rotation: 120 } });
  });

  it("round-trips through projectToWindDefinition", () => {
    const doc = windDefinitionToDocument(sampleWind);
    const back = projectToWindDefinition(doc);
    expect(back.mandrelParameters).toEqual(sampleWind.mandrelParameters);
    expect(back.towParameters).toEqual(sampleWind.towParameters);
    expect(back.defaultFeedRate).toBe(sampleWind.defaultFeedRate);
    expect(back.layers).toEqual(sampleWind.layers);
  });
});
