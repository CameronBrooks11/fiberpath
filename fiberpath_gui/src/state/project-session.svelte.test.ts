import { describe, it, expect, beforeEach } from "vitest";
import { ProjectSession, createEmptyDocument } from "./project-session.svelte";

describe("ProjectSession", () => {
  let session: ProjectSession;

  beforeEach(() => {
    session = new ProjectSession();
  });

  it("starts from the canonical empty document", () => {
    expect(session.document).toEqual(createEmptyDocument());
    expect(session.document.mandrel.diameter).toBe(150);
    expect(session.document.defaultFeedRate).toBe(400);
  });

  it("keeps transient state out of the persisted document", () => {
    // The document is exactly the .wind payload — no filePath/isDirty/selection.
    expect(Object.keys(session.document).sort()).toEqual([
      "defaultFeedRate",
      "layers",
      "mandrel",
      "tow",
    ]);
  });

  it("is not dirty until a mutation, then dirty until saved", () => {
    expect(session.isDirty).toBe(false);
    session.updateMandrel({ diameter: 200 });
    expect(session.document.mandrel.diameter).toBe(200);
    expect(session.isDirty).toBe(true);
    session.markSaved();
    expect(session.isDirty).toBe(false);
  });

  it("bumps the revision on every document mutation", () => {
    expect(session.revision).toBe(0);
    session.updateTow({ width: 10 });
    session.updateDefaultFeedRate(500);
    expect(session.revision).toBe(2);
    expect(session.document.tow.width).toBe(10);
    expect(session.document.defaultFeedRate).toBe(500);
  });

  it("does not mark dirty for validation-only changes", () => {
    session.setValidationError("mandrel.diameter", "Too small");
    expect(session.validationErrors["mandrel.diameter"]).toBe("Too small");
    expect(session.isDirty).toBe(false);
    session.setValidationError("mandrel.diameter", undefined);
    expect(session.validationErrors["mandrel.diameter"]).toBeUndefined();
  });

  it("adds, selects, updates, duplicates, reorders and removes layers", () => {
    const hoopId = session.addLayer("hoop");
    expect(session.document.layers).toHaveLength(1);
    expect(session.selectedLayerId).toBe(hoopId);
    expect(session.selectedLayer?.id).toBe(hoopId);
    expect(session.isDirty).toBe(true);

    const helicalId = session.addLayer("helical");
    expect(session.document.layers).toHaveLength(2);

    session.updateLayer(hoopId, { hoop: { terminal: true } });
    expect(session.document.layers[0].hoop?.terminal).toBe(true);

    // duplicate inserts the copy right after the source and selects it
    const copyId = session.duplicateLayer(hoopId);
    expect(copyId).not.toBeNull();
    expect(session.document.layers.map((l) => l.id)).toEqual([hoopId, copyId, helicalId]);
    const copyIdStr = copyId as string;
    expect(session.selectedLayerId).toBe(copyId);

    // reorder: move the helical (index 2) to the front
    session.reorderLayers(2, 0);
    expect(session.document.layers[0].id).toBe(helicalId);

    // selection follows removal of the selected layer
    session.selectLayer(copyIdStr);
    session.removeLayer(copyIdStr);
    expect(session.document.layers.map((l) => l.id)).toEqual([helicalId, hoopId]);
    expect(session.selectedLayerId).toBe(helicalId);
  });

  it("a duplicated layer does not alias the original's sub-object", () => {
    const id = session.addLayer("helical");
    session.updateLayer(id, {
      helical: { ...session.document.layers[0].helical!, wind_angle: 30 },
    });
    const copyId = session.duplicateLayer(id)!;
    // Editors always replace the sub-object wholesale — do the same on the copy.
    const copy = session.document.layers.find((l) => l.id === copyId)!;
    session.updateLayer(copyId, { helical: { ...copy.helical!, wind_angle: 80 } });

    const original = session.document.layers.find((l) => l.id === id)!;
    expect(original.helical!.wind_angle).toBe(30);
    expect(
      session.document.layers.find((l) => l.id === copyId)!.helical!.wind_angle,
    ).toBe(80);
  });

  it("selecting a layer does not dirty the document", () => {
    const id = session.addLayer("skip");
    session.markSaved();
    expect(session.isDirty).toBe(false);
    session.selectLayer(id);
    session.selectLayer(null);
    expect(session.isDirty).toBe(false);
    expect(session.selectedLayer).toBeNull();
  });

  it("ignores no-op and out-of-range mutations", () => {
    session.addLayer("hoop");
    const rev = session.revision;
    session.updateLayer("nope", { hoop: { terminal: true } });
    session.removeLayer("nope");
    session.reorderLayers(0, 0);
    session.reorderLayers(0, 5);
    expect(session.duplicateLayer("nope")).toBeNull();
    expect(session.revision).toBe(rev);
  });

  it("resets transient and dirty state on loadDocument", () => {
    session.updateMandrel({ diameter: 999 });
    session.setValidationError("tow.width", "bad");
    session.selectedLayerId = "abc";
    session.filePath = "/old.wind";

    session.loadDocument(
      { ...createEmptyDocument(), mandrel: { diameter: 80, wind_length: 400 } },
      "/new.wind",
    );

    expect(session.document.mandrel.diameter).toBe(80);
    expect(session.filePath).toBe("/new.wind");
    expect(session.selectedLayerId).toBeNull();
    expect(session.validationErrors).toEqual({});
    expect(session.isDirty).toBe(false);
  });
});
