import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Notifications } from "./notifications.svelte";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("Notifications", () => {
  it("pushes a typed toast and auto-dismisses after the duration", () => {
    const n = new Notifications();
    n.error("boom");
    expect(n.toasts).toHaveLength(1);
    expect(n.toasts[0]).toMatchObject({ type: "error", message: "boom" });

    vi.advanceTimersByTime(60_000);
    expect(n.toasts).toHaveLength(0);
  });

  it("dismisses by id and clears all", () => {
    const n = new Notifications();
    const a = n.info("a");
    n.success("b");
    expect(n.toasts).toHaveLength(2);

    n.dismiss(a);
    expect(n.toasts.map((t) => t.message)).toEqual(["b"]);

    n.clear();
    expect(n.toasts).toHaveLength(0);
  });
});
