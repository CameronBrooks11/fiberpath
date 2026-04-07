import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTheme } from "./useTheme";

interface MatchMediaController {
  setMatches: (matches: boolean) => void;
}

function installMatchMedia(initialMatches: boolean): MatchMediaController {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: (listener: (event: MediaQueryListEvent) => void) =>
        listeners.add(listener),
      removeListener: (listener: (event: MediaQueryListEvent) => void) =>
        listeners.delete(listener),
      addEventListener: (
        event: string,
        listener: (event: MediaQueryListEvent) => void,
      ) => {
        if (event === "change") {
          listeners.add(listener);
        }
      },
      removeEventListener: (
        event: string,
        listener: (event: MediaQueryListEvent) => void,
      ) => {
        if (event === "change") {
          listeners.delete(listener);
        }
      },
      dispatchEvent: () => true,
    })),
  });

  return {
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      const event = { matches: nextMatches } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}

describe("useTheme", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("uses system theme when no stored preference exists", () => {
    installMatchMedia(false); // prefers light
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("light");
    expect(result.current.isSystemTheme).toBe(true);
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("uses persisted preference and sets data-theme attribute", () => {
    window.localStorage.setItem("fiberpath-theme", "dark");
    installMatchMedia(false);
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("dark");
    expect(result.current.isSystemTheme).toBe(false);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("persists manual selection and clears it when set back to system", () => {
    installMatchMedia(true); // prefers dark
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme("light");
    });

    expect(result.current.theme).toBe("light");
    expect(result.current.isSystemTheme).toBe(false);
    expect(window.localStorage.getItem("fiberpath-theme")).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    act(() => {
      result.current.setTheme(null);
    });

    expect(result.current.theme).toBe("dark");
    expect(result.current.isSystemTheme).toBe(true);
    expect(window.localStorage.getItem("fiberpath-theme")).toBeNull();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("tracks system preference changes while using system theme", () => {
    const media = installMatchMedia(true); // starts dark
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("dark");
    expect(result.current.isSystemTheme).toBe(true);

    act(() => {
      media.setMatches(false); // switches to light
    });

    expect(result.current.theme).toBe("light");
    expect(result.current.isSystemTheme).toBe(true);
  });
});
