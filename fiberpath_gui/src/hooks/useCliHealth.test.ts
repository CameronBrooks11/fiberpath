import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCliHealth } from './useCliHealth';

// Must use vi.hoisted so the mock fn is available when vi.mock factory runs
const { mockInvokeFn } = vi.hoisted(() => ({ mockInvokeFn: vi.fn() }));

vi.mock('@tauri-apps/api/core', () => ({ invoke: mockInvokeFn }));

const healthyResponse = { healthy: true, version: '1.2.3', errorMessage: null };
const unhealthyResponse = { healthy: false, version: null, errorMessage: 'CLI not found' };

function setInvokeResponse(value: unknown) {
  mockInvokeFn.mockResolvedValue(value);
}

function setInvokeError(message: string) {
  mockInvokeFn.mockRejectedValue(new Error(message));
}

beforeEach(() => {
  mockInvokeFn.mockReset();
});

describe('useCliHealth', () => {
  describe('initial state', () => {
    it('starts with status "unknown" before any check', () => {
      // Suppress the mount check by disabling checkOnMount
      const { result } = renderHook(() =>
        useCliHealth({ checkOnMount: false }),
      );
      expect(result.current.status).toBe('unknown');
      expect(result.current.version).toBeNull();
      expect(result.current.errorMessage).toBeNull();
      expect(result.current.lastChecked).toBeNull();
    });
  });

  describe('checkOnMount', () => {
    it('calls invoke on mount when checkOnMount = true', async () => {
      setInvokeResponse(healthyResponse);
      renderHook(() => useCliHealth({ checkOnMount: true }));
      await waitFor(() => expect(mockInvokeFn).toHaveBeenCalledTimes(1));
      expect(mockInvokeFn).toHaveBeenCalledWith('check_cli_health');
    });

    it('does NOT call invoke when checkOnMount = false', async () => {
      const { result } = renderHook(() =>
        useCliHealth({ checkOnMount: false }),
      );
      // Flush microtasks — no call should happen
      await act(async () => {});
      expect(mockInvokeFn).not.toHaveBeenCalled();
      expect(result.current.status).toBe('unknown');
    });
  });

  describe('healthy response', () => {
    it('sets status to "ready" and stores version', async () => {
      setInvokeResponse(healthyResponse);
      const { result } = renderHook(() =>
        useCliHealth({ checkOnMount: true }),
      );
      await waitFor(() => expect(result.current.status).toBe('ready'));
      expect(result.current.version).toBe('1.2.3');
      expect(result.current.isHealthy).toBe(true);
      expect(result.current.isUnavailable).toBe(false);
      expect(result.current.lastChecked).toBeInstanceOf(Date);
    });
  });

  describe('unhealthy response', () => {
    it('sets status to "unavailable" when healthy=false', async () => {
      setInvokeResponse(unhealthyResponse);
      const { result } = renderHook(() =>
        useCliHealth({ checkOnMount: true }),
      );
      await waitFor(() => expect(result.current.status).toBe('unavailable'));
      expect(result.current.errorMessage).toBe('CLI not found');
      expect(result.current.isUnavailable).toBe(true);
      expect(result.current.isHealthy).toBe(false);
    });
  });

  describe('error handling', () => {
    it('sets status "unavailable" when invoke throws an Error', async () => {
      setInvokeError('Connection refused');
      const { result } = renderHook(() =>
        useCliHealth({ checkOnMount: true }),
      );
      await waitFor(() => expect(result.current.status).toBe('unavailable'));
      expect(result.current.errorMessage).toBe('Connection refused');
    });

    it('sets status "unavailable" when invoke throws a string', async () => {
      mockInvokeFn.mockRejectedValue('raw string error');
      const { result } = renderHook(() =>
        useCliHealth({ checkOnMount: true }),
      );
      await waitFor(() => expect(result.current.status).toBe('unavailable'));
      expect(result.current.errorMessage).toBe('raw string error');
    });

    it('sets "Unknown error occurred" for non-string/Error throws', async () => {
      mockInvokeFn.mockRejectedValue(42);
      const { result } = renderHook(() =>
        useCliHealth({ checkOnMount: true }),
      );
      await waitFor(() => expect(result.current.status).toBe('unavailable'));
      expect(result.current.errorMessage).toBe('Unknown error occurred');
    });

    it('sets "unavailable" when response schema is invalid', async () => {
      setInvokeResponse({ unexpected: 'shape' });
      const { result } = renderHook(() =>
        useCliHealth({ checkOnMount: true }),
      );
      await waitFor(() => expect(result.current.status).toBe('unavailable'));
      expect(result.current.errorMessage).toContain('Invalid response schema');
    });
  });

  describe('derived booleans', () => {
    it('isChecking is true transiently during the check', async () => {
      // Delay the response so we can observe "checking"
      let resolve!: (v: unknown) => void;
      mockInvokeFn.mockReturnValue(new Promise((r) => { resolve = r; }));

      const { result } = renderHook(() =>
        useCliHealth({ checkOnMount: true }),
      );
      await waitFor(() => expect(result.current.isChecking).toBe(true));
      resolve(healthyResponse);
      await waitFor(() => expect(result.current.isChecking).toBe(false));
    });
  });

  describe('polling', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it('polls at the given interval when enablePolling=true', async () => {
      setInvokeResponse(healthyResponse);
      renderHook(() =>
        useCliHealth({ checkOnMount: true, enablePolling: true, pollingInterval: 5000 }),
      );

      // Flush the initial mount effect and its promise
      await act(async () => { await Promise.resolve(); });
      expect(mockInvokeFn).toHaveBeenCalledTimes(1);

      // Advance timer to trigger one polling interval
      mockInvokeFn.mockClear();
      await act(async () => {
        vi.advanceTimersByTime(5000);
        await Promise.resolve();
      });
      expect(mockInvokeFn).toHaveBeenCalledTimes(1);
    });

    it('does not poll when enablePolling=false', async () => {
      setInvokeResponse(healthyResponse);
      renderHook(() =>
        useCliHealth({ checkOnMount: true, enablePolling: false, pollingInterval: 5000 }),
      );
      await act(async () => { await Promise.resolve(); });
      expect(mockInvokeFn).toHaveBeenCalledTimes(1);

      mockInvokeFn.mockClear();
      await act(async () => {
        vi.advanceTimersByTime(10000);
        await Promise.resolve();
      });
      expect(mockInvokeFn).not.toHaveBeenCalled();
    });

    it('stops polling on unmount', async () => {
      setInvokeResponse(healthyResponse);
      const { unmount } = renderHook(() =>
        useCliHealth({ checkOnMount: true, enablePolling: true, pollingInterval: 5000 }),
      );
      await act(async () => { await Promise.resolve(); });
      unmount();

      mockInvokeFn.mockClear();
      await act(async () => {
        vi.advanceTimersByTime(10000);
        await Promise.resolve();
      });
      expect(mockInvokeFn).not.toHaveBeenCalled();
    });
  });

  describe('manual refresh', () => {
    it('calling refresh triggers a new health check', async () => {
      setInvokeResponse(healthyResponse);
      const { result } = renderHook(() =>
        useCliHealth({ checkOnMount: false }),
      );
      await act(async () => {
        await result.current.refresh();
      });
      expect(mockInvokeFn).toHaveBeenCalledTimes(1);
      expect(result.current.status).toBe('ready');
    });
  });
});
