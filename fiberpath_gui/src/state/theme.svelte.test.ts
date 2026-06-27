import { describe, it, expect, beforeEach } from "vitest";
import { ThemeStore } from "./theme.svelte";

beforeEach(() => localStorage.clear());

describe("ThemeStore", () => {
  it("follows the system by default", () => {
    const t = new ThemeStore();
    expect(t.isSystem).toBe(true);
    expect(["dark", "light"]).toContain(t.theme);
  });

  it("cycles dark -> light -> system and persists the choice", () => {
    const t = new ThemeStore();

    t.setPreference("dark");
    expect(t.theme).toBe("dark");
    expect(localStorage.getItem("fiberpath-theme")).toBe("dark");

    t.cycle(); // -> light
    expect(t.preference).toBe("light");
    expect(localStorage.getItem("fiberpath-theme")).toBe("light");

    t.cycle(); // -> system (null)
    expect(t.preference).toBeNull();
    expect(t.isSystem).toBe(true);
    expect(localStorage.getItem("fiberpath-theme")).toBeNull();

    t.cycle(); // -> dark
    expect(t.preference).toBe("dark");
  });

  it("restores a stored preference on construction", () => {
    localStorage.setItem("fiberpath-theme", "light");
    const t = new ThemeStore();
    expect(t.preference).toBe("light");
    expect(t.isSystem).toBe(false);
  });
});
