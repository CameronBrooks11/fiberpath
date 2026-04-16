import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFileOperations } from './useFileOperations';
import { resetStores } from '../tests/storeUtils';
import { ErrorNotificationProvider } from '../contexts/ErrorNotificationContext';
import type { ReactNode } from 'react';

// vi.hoisted ensures these exist when the vi.mock factory is evaluated
const { mockFileOpsResult, mockCreate } = vi.hoisted(() => {
  const result = {
    newFile: vi.fn(),
    openFile: vi.fn(),
    saveFile: vi.fn(),
    saveFileAs: vi.fn(),
    exportGcode: vi.fn(),
    duplicateActiveLayer: vi.fn(),
    deleteActiveLayer: vi.fn(),
  };
  return { mockFileOpsResult: result, mockCreate: vi.fn().mockReturnValue(result) };
});

vi.mock('../lib/fileOperations', () => ({
  createFileOperations: mockCreate,
}));

function wrapper({ children }: { children: ReactNode }) {
  return <ErrorNotificationProvider>{children}</ErrorNotificationProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreate.mockReturnValue(mockFileOpsResult);
  resetStores();
});

describe('useFileOperations', () => {
  it('calls createFileOperations on mount and returns the result', () => {
    const { result } = renderHook(() => useFileOperations(), { wrapper });
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(mockFileOpsResult);
  });

  it('passes getProject accessor that reads current store state', () => {
    renderHook(() => useFileOperations(), { wrapper });
    const call = mockCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(typeof call.getProject).toBe('function');
  });

  it('passes getActiveLayerId accessor', () => {
    renderHook(() => useFileOperations(), { wrapper });
    const call = mockCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(typeof call.getActiveLayerId).toBe('function');
  });

  it('forwards onRecentFilesChanged as updateRecentFiles', () => {
    const onChanged = vi.fn();
    renderHook(() => useFileOperations({ onRecentFilesChanged: onChanged }), { wrapper });
    const call = mockCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(call.updateRecentFiles).toBe(onChanged);
  });

  it('passes showError and showInfo callbacks', () => {
    renderHook(() => useFileOperations(), { wrapper });
    const call = mockCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(typeof call.showError).toBe('function');
    expect(typeof call.showInfo).toBe('function');
  });

  it('returns a stable reference when deps do not change (memoized)', () => {
    const { result, rerender } = renderHook(() => useFileOperations(), { wrapper });
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
    // createFileOperations called only once (memo did not re-run)
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});
