import { describe, expect, it } from "vitest";
import {
  isHoopLayer,
  isHelicalLayer,
  isSkipLayer,
  getLayerData,
  createLayer,
  createEmptyProject,
} from "./project";
import type { Layer } from "./project";

const hoopLayer: Layer = {
  id: "h1",
  type: "hoop",
  hoop: { terminal: false },
};

const helicalLayer: Layer = {
  id: "he1",
  type: "helical",
  helical: {
    wind_angle: 45,
    pattern_number: 3,
    skip_index: 2,
    lock_degrees: 540,
    lead_in_mm: 25,
    lead_out_degrees: 60,
    skip_initial_near_lock: false,
  },
};

const skipLayer: Layer = {
  id: "s1",
  type: "skip",
  skip: { mandrel_rotation: 90 },
};

describe("project type guards", () => {
  describe("isHoopLayer()", () => {
    it("returns true for a hoop layer", () => {
      expect(isHoopLayer(hoopLayer)).toBe(true);
    });

    it("returns false for a helical layer", () => {
      expect(isHoopLayer(helicalLayer)).toBe(false);
    });

    it("returns false for a skip layer", () => {
      expect(isHoopLayer(skipLayer)).toBe(false);
    });

    it("returns false when type is hoop but hoop data is missing", () => {
      const broken: Layer = { id: "x", type: "hoop" };
      expect(isHoopLayer(broken)).toBe(false);
    });
  });

  describe("isHelicalLayer()", () => {
    it("returns true for a helical layer", () => {
      expect(isHelicalLayer(helicalLayer)).toBe(true);
    });

    it("returns false for a hoop layer", () => {
      expect(isHelicalLayer(hoopLayer)).toBe(false);
    });

    it("returns false for a skip layer", () => {
      expect(isHelicalLayer(skipLayer)).toBe(false);
    });

    it("returns false when type is helical but helical data is missing", () => {
      const broken: Layer = { id: "x", type: "helical" };
      expect(isHelicalLayer(broken)).toBe(false);
    });
  });

  describe("isSkipLayer()", () => {
    it("returns true for a skip layer", () => {
      expect(isSkipLayer(skipLayer)).toBe(true);
    });

    it("returns false for a hoop layer", () => {
      expect(isSkipLayer(hoopLayer)).toBe(false);
    });

    it("returns false for a helical layer", () => {
      expect(isSkipLayer(helicalLayer)).toBe(false);
    });

    it("returns false when type is skip but skip data is missing", () => {
      const broken: Layer = { id: "x", type: "skip" };
      expect(isSkipLayer(broken)).toBe(false);
    });
  });
});

describe("getLayerData()", () => {
  it("returns hoop data for a hoop layer", () => {
    const data = getLayerData(hoopLayer);
    expect(data).toEqual({ terminal: false });
  });

  it("returns helical data for a helical layer", () => {
    const data = getLayerData(helicalLayer);
    expect(data).toMatchObject({ wind_angle: 45, pattern_number: 3 });
  });

  it("returns skip data for a skip layer", () => {
    const data = getLayerData(skipLayer);
    expect(data).toEqual({ mandrel_rotation: 90 });
  });

  it("throws for a layer with no matching data", () => {
    const broken: Layer = { id: "x", type: "hoop" };
    expect(() => getLayerData(broken)).toThrow();
  });
});

describe("createLayer()", () => {
  it("creates a hoop layer with expected defaults", () => {
    const layer = createLayer("hoop");
    expect(layer.type).toBe("hoop");
    expect(layer.hoop).toBeDefined();
    expect(layer.hoop?.terminal).toBe(false);
  });

  it("creates a helical layer with expected defaults", () => {
    const layer = createLayer("helical");
    expect(layer.type).toBe("helical");
    expect(layer.helical).toBeDefined();
    expect(layer.helical?.wind_angle).toBe(45);
    expect(layer.helical?.pattern_number).toBe(3);
  });

  it("creates a skip layer with expected defaults", () => {
    const layer = createLayer("skip");
    expect(layer.type).toBe("skip");
    expect(layer.skip).toBeDefined();
    expect(layer.skip?.mandrel_rotation).toBe(90);
  });

  it("assigns a unique id to each created layer", () => {
    const a = createLayer("hoop");
    const b = createLayer("hoop");
    expect(a.id).toBeTruthy();
    expect(a.id).not.toBe(b.id);
  });
});

describe("createEmptyProject()", () => {
  it("returns a project with sane defaults", () => {
    const project = createEmptyProject();
    expect(project.filePath).toBeNull();
    expect(project.isDirty).toBe(false);
    expect(project.layers).toHaveLength(0);
    expect(project.mandrel.diameter).toBeGreaterThan(0);
    expect(project.tow.width).toBeGreaterThan(0);
  });
});
