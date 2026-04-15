import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "./useDebouncedValue";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebouncedValue", () => {
  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("hello", 300));
    expect(result.current).toBe("hello");
  });

  it("holds the stale value before the debounce delay elapses", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 300),
      { initialProps: { value: "initial" } },
    );

    rerender({ value: "updated" });

    // Timer hasn't fired yet
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe("initial");
  });

  it("updates to the new value after the debounce delay", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 300),
      { initialProps: { value: "initial" } },
    );

    rerender({ value: "updated" });

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe("updated");
  });

  it("only settles on the last value when updated rapidly", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 300),
      { initialProps: { value: "initial" } },
    );

    rerender({ value: "first" });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: "second" });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Still stale — second timer hasn't fired yet
    expect(result.current).toBe("initial");

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe("second");
  });

  it("uses 300ms as the default delay", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: number }) => useDebouncedValue(value),
      { initialProps: { value: 1 } },
    );

    rerender({ value: 2 });

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(2);
  });

  it("works with object values", () => {
    const obj1 = { x: 1 };
    const obj2 = { x: 2 };
    const { result, rerender } = renderHook(
      ({ value }: { value: object }) => useDebouncedValue(value, 200),
      { initialProps: { value: obj1 } },
    );

    rerender({ value: obj2 });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe(obj2);
  });
});
