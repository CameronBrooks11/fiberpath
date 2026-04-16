/**
 * Tauri mock factories for use in RTL tests.
 *
 * Usage:
 *   import { mockInvoke, mockDialogs, resetTauriMocks } from './tauriMocks';
 *
 *   vi.mock('@tauri-apps/api/core', () => mockInvoke());
 *   vi.mock('@tauri-apps/plugin-dialog', () => mockDialogs());
 *
 *   beforeEach(() => resetTauriMocks());
 */
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Invoke
// ---------------------------------------------------------------------------
export const mockInvokeFn = vi.fn();

export function mockInvoke() {
  return { invoke: mockInvokeFn };
}

/** Configure a single invoke command to resolve with a given value. */
export function setInvokeResponse(value: unknown) {
  mockInvokeFn.mockResolvedValue(value);
}

/** Configure invoke to reject with an error message. */
export function setInvokeError(message: string) {
  mockInvokeFn.mockRejectedValue(new Error(message));
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
export const mockListenFn = vi.fn();

export function mockEvents() {
  return { listen: mockListenFn };
}

/**
 * Make `listen` immediately invoke the callback with a payload, then
 * return an unlisten function. Useful for testing event handler paths.
 */
export function setListenCallback(payload: unknown) {
  mockListenFn.mockImplementation(
    (_event: string, callback: (e: { payload: unknown }) => void) => {
      callback({ payload });
      return Promise.resolve(vi.fn()); // unlisten
    },
  );
}

// ---------------------------------------------------------------------------
// Dialogs  (@tauri-apps/plugin-dialog)
// ---------------------------------------------------------------------------
export const mockOpenFn = vi.fn();
export const mockSaveFn = vi.fn();
export const mockAskFn = vi.fn();

export function mockDialogs() {
  return {
    open: mockOpenFn,
    save: mockSaveFn,
    ask: mockAskFn,
  };
}

// ---------------------------------------------------------------------------
// Shell  (@tauri-apps/plugin-shell)
// ---------------------------------------------------------------------------
export const mockOpenExternalFn = vi.fn();

export function mockShell() {
  return { open: mockOpenExternalFn };
}

// ---------------------------------------------------------------------------
// App  (@tauri-apps/api/app)
// ---------------------------------------------------------------------------
export const mockGetVersionFn = vi.fn<() => Promise<string>>().mockResolvedValue('0.7.0');

export function mockApp() {
  return { getVersion: mockGetVersionFn };
}

// ---------------------------------------------------------------------------
// Reset everything in beforeEach
// ---------------------------------------------------------------------------
export function resetTauriMocks() {
  mockInvokeFn.mockReset();
  mockListenFn.mockReset();
  mockOpenFn.mockReset();
  mockSaveFn.mockReset();
  mockAskFn.mockReset();
  mockOpenExternalFn.mockReset();
  mockGetVersionFn.mockReset().mockResolvedValue('0.7.0');
}
