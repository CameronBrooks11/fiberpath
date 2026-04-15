import { describe, expect, it } from "vitest";
import {
  MENU_DEFINITIONS,
  type MenuId,
  type MenuActionId,
} from "./menuConfig";

describe("MENU_DEFINITIONS", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(MENU_DEFINITIONS)).toBe(true);
    expect(MENU_DEFINITIONS.length).toBeGreaterThan(0);
  });

  it("includes all expected top-level menus", () => {
    const ids = MENU_DEFINITIONS.map((m) => m.id) as MenuId[];
    expect(ids).toContain("file");
    expect(ids).toContain("edit");
    expect(ids).toContain("view");
    expect(ids).toContain("help");
  });

  it("each menu definition has a label and entries array", () => {
    for (const menu of MENU_DEFINITIONS) {
      expect(typeof menu.label).toBe("string");
      expect(menu.label.length).toBeGreaterThan(0);
      expect(Array.isArray(menu.entries)).toBe(true);
    }
  });

  it("action entries have actionId and label", () => {
    for (const menu of MENU_DEFINITIONS) {
      for (const entry of menu.entries) {
        if (entry.type === "action") {
          expect(typeof entry.actionId).toBe("string");
          expect(typeof entry.label).toBe("string");
        }
      }
    }
  });

  it("file menu contains save and open actions", () => {
    const fileMenu = MENU_DEFINITIONS.find((m) => m.id === "file")!;
    const actionIds = fileMenu.entries
      .filter((e) => e.type === "action")
      .map((e) => (e as { actionId: MenuActionId }).actionId);
    expect(actionIds).toContain("file.open");
    expect(actionIds).toContain("file.save");
  });
});
