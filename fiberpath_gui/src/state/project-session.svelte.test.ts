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
