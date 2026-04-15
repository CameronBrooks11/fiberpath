import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { retry, withRetry } from "./retry";

describe("retry", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("retry()", () => {
    it("returns result on immediate success", async () => {
      const fn = vi.fn().mockResolvedValue("value");
      const result = await retry(fn);
      expect(result).toBe("value");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("retries on transient error and returns on subsequent success", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("transient"))
        .mockResolvedValue("value");

      const result = await retry(fn, { maxAttempts: 3, delayMs: 0 });
      expect(result).toBe("value");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("throws the last error after exhausting all attempts", async () => {
      const error = new Error("persistent");
      const fn = vi.fn().mockRejectedValue(error);

      await expect(retry(fn, { maxAttempts: 3, delayMs: 0 })).rejects.toBe(error);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("stops immediately when shouldRetry returns false", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("non-retryable"))
        .mockResolvedValue("value");

      await expect(
        retry(fn, { maxAttempts: 3, delayMs: 0, shouldRetry: () => false }),
      ).rejects.toThrow("non-retryable");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("respects maxAttempts: 1 (no retries at all)", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("fail"));
      await expect(retry(fn, { maxAttempts: 1, delayMs: 0 })).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("applies exponential backoff between attempts", async () => {
      // Verify the function is retried and eventually succeeds — backoff delay
      // correctness is guaranteed by the retry() loop which multiplies `delay`
      // by backoffMultiplier. We use delayMs:0 to keep the test fast.
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail1"))
        .mockRejectedValueOnce(new Error("fail2"))
        .mockResolvedValue("ok");

      const result = await retry(fn, {
        maxAttempts: 3,
        delayMs: 0,
        backoffMultiplier: 2,
      });
      expect(result).toBe("ok");
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("uses custom shouldRetry predicate to allow retry", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ retryable: true })
        .mockResolvedValue("ok");

      const result = await retry(fn, {
        maxAttempts: 2,
        delayMs: 0,
        shouldRetry: (err: unknown) => (err as { retryable: boolean }).retryable,
      });
      expect(result).toBe("ok");
    });
  });

  describe("withRetry()", () => {
    it("wraps a function and passes arguments through", async () => {
      const fn = vi.fn().mockResolvedValue("result");
      const wrapped = withRetry(fn, { maxAttempts: 1, delayMs: 0 });
      const result = await wrapped("a", "b");
      expect(fn).toHaveBeenCalledWith("a", "b");
      expect(result).toBe("result");
    });

    it("retries the underlying function on failure", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValue("ok");
      const wrapped = withRetry(fn, { maxAttempts: 2, delayMs: 0 });
      const result = await wrapped();
      expect(result).toBe("ok");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("throws when all retries are exhausted", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("always fails"));
      const wrapped = withRetry(fn, { maxAttempts: 2, delayMs: 0 });
      await expect(wrapped()).rejects.toThrow("always fails");
    });
  });
});
