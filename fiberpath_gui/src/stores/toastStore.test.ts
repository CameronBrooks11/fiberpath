import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useToastStore } from "./toastStore";

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useToastStore", () => {
  describe("addToast()", () => {
    it("adds a toast with a generated id", () => {
      const { addToast } = useToastStore.getState();
      addToast({ type: "info", message: "hello" });
      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe("hello");
      expect(toasts[0].type).toBe("info");
      expect(toasts[0].id).toMatch(/^toast-/);
    });

    it("assigns unique ids to each toast", () => {
      const { addToast } = useToastStore.getState();
      addToast({ type: "info", message: "first" });
      addToast({ type: "info", message: "second" });
      const { toasts } = useToastStore.getState();
      expect(toasts[0].id).not.toBe(toasts[1].id);
    });

    it("auto-removes toast after default duration", () => {
      const { addToast } = useToastStore.getState();
      addToast({ type: "success", message: "auto-remove" });
      expect(useToastStore.getState().toasts).toHaveLength(1);
      vi.runAllTimers();
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it("auto-removes toast after custom duration", () => {
      const { addToast } = useToastStore.getState();
      addToast({ type: "error", message: "custom-duration", duration: 5000 });
      vi.advanceTimersByTime(4999);
      expect(useToastStore.getState().toasts).toHaveLength(1);
      vi.advanceTimersByTime(1);
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it("accumulates multiple toasts", () => {
      const { addToast } = useToastStore.getState();
      addToast({ type: "info", message: "a" });
      addToast({ type: "warning", message: "b" });
      addToast({ type: "error", message: "c" });
      expect(useToastStore.getState().toasts).toHaveLength(3);
    });
  });

  describe("removeToast()", () => {
    it("removes the specified toast by id", () => {
      const { addToast } = useToastStore.getState();
      addToast({ type: "info", message: "first" });
      addToast({ type: "info", message: "second" });
      const { toasts, removeToast } = useToastStore.getState();
      const firstId = toasts[0].id;
      removeToast(firstId);
      const remaining = useToastStore.getState().toasts;
      expect(remaining).toHaveLength(1);
      expect(remaining[0].message).toBe("second");
    });

    it("does nothing when removing an unknown id", () => {
      const { addToast, removeToast } = useToastStore.getState();
      addToast({ type: "info", message: "keep me" });
      removeToast("non-existent-id");
      expect(useToastStore.getState().toasts).toHaveLength(1);
    });

    it("removes the only toast leaving an empty list", () => {
      const { addToast } = useToastStore.getState();
      addToast({ type: "success", message: "solo" });
      const { toasts, removeToast } = useToastStore.getState();
      removeToast(toasts[0].id);
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });
});
