import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import {
  useKeyboardShortcuts,
  getShortcutDisplay,
  type KeyboardShortcutHandlers,
} from './useKeyboardShortcuts';

// Helpers
function makeHandlers(): Required<KeyboardShortcutHandlers> {
  return {
    onNew: vi.fn(),
    onOpen: vi.fn(),
    onSave: vi.fn(),
    onSaveAs: vi.fn(),
    onExport: vi.fn(),
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
  };
}

function ctrl(key: string, extra: Partial<KeyboardEventInit> = {}) {
  fireEvent.keyDown(document, { key, ctrlKey: true, ...extra });
}

beforeEach(() => {
  vi.clearAllMocks();
  // Ensure navigator.platform is non-Mac in all tests
  Object.defineProperty(navigator, 'platform', {
    value: 'Win32',
    configurable: true,
  });
});

describe('useKeyboardShortcuts', () => {
  it('Ctrl+N calls onNew', () => {
    const h = makeHandlers();
    renderHook(() => useKeyboardShortcuts(h));
    ctrl('n');
    expect(h.onNew).toHaveBeenCalledTimes(1);
  });

  it('Ctrl+O calls onOpen', () => {
    const h = makeHandlers();
    renderHook(() => useKeyboardShortcuts(h));
    ctrl('o');
    expect(h.onOpen).toHaveBeenCalledTimes(1);
  });

  it('Ctrl+S calls onSave', () => {
    const h = makeHandlers();
    renderHook(() => useKeyboardShortcuts(h));
    ctrl('s');
    expect(h.onSave).toHaveBeenCalledTimes(1);
  });

  it('Ctrl+Shift+S calls onSaveAs, not onSave', () => {
    const h = makeHandlers();
    renderHook(() => useKeyboardShortcuts(h));
    ctrl('s', { shiftKey: true });
    expect(h.onSaveAs).toHaveBeenCalledTimes(1);
    expect(h.onSave).not.toHaveBeenCalled();
  });

  it('Ctrl+E calls onExport', () => {
    const h = makeHandlers();
    renderHook(() => useKeyboardShortcuts(h));
    ctrl('e');
    expect(h.onExport).toHaveBeenCalledTimes(1);
  });

  it('Ctrl+D calls onDuplicate', () => {
    const h = makeHandlers();
    renderHook(() => useKeyboardShortcuts(h));
    ctrl('d');
    expect(h.onDuplicate).toHaveBeenCalledTimes(1);
  });

  it('Delete key calls onDelete', () => {
    const h = makeHandlers();
    renderHook(() => useKeyboardShortcuts(h));
    fireEvent.keyDown(document, { key: 'Delete' });
    expect(h.onDelete).toHaveBeenCalledTimes(1);
  });

  it('does not fire when Ctrl+Alt combo is used', () => {
    const h = makeHandlers();
    renderHook(() => useKeyboardShortcuts(h));
    fireEvent.keyDown(document, { key: 's', ctrlKey: true, altKey: true });
    expect(h.onSave).not.toHaveBeenCalled();
  });

  it('does not fire Ctrl shortcut when no modifier', () => {
    const h = makeHandlers();
    renderHook(() => useKeyboardShortcuts(h));
    fireEvent.keyDown(document, { key: 's' });
    expect(h.onSave).not.toHaveBeenCalled();
  });

  it('does not fire when target is an INPUT element', () => {
    const h = makeHandlers();
    renderHook(() => useKeyboardShortcuts(h));
    const input = document.createElement('input');
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: 's', ctrlKey: true, bubbles: true });
    expect(h.onSave).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('does not fire when target is a TEXTAREA element', () => {
    const h = makeHandlers();
    renderHook(() => useKeyboardShortcuts(h));
    const ta = document.createElement('textarea');
    document.body.appendChild(ta);
    fireEvent.keyDown(ta, { key: 's', ctrlKey: true, bubbles: true });
    expect(h.onSave).not.toHaveBeenCalled();
    document.body.removeChild(ta);
  });

  it('does not fire when target is a SELECT element', () => {
    const h = makeHandlers();
    renderHook(() => useKeyboardShortcuts(h));
    const sel = document.createElement('select');
    document.body.appendChild(sel);
    fireEvent.keyDown(sel, { key: 's', ctrlKey: true, bubbles: true });
    expect(h.onSave).not.toHaveBeenCalled();
    document.body.removeChild(sel);
  });

  it('does not call handler when no handler registered for key', () => {
    renderHook(() => useKeyboardShortcuts({}));
    // should not throw
    expect(() => ctrl('s')).not.toThrow();
    expect(() => ctrl('n')).not.toThrow();
  });

  it('removes event listener on unmount', () => {
    const h = makeHandlers();
    const { unmount } = renderHook(() => useKeyboardShortcuts(h));
    unmount();
    ctrl('s');
    expect(h.onSave).not.toHaveBeenCalled();
  });
});

describe('getShortcutDisplay', () => {
  it('returns Ctrl on non-Mac', () => {
    expect(getShortcutDisplay('Ctrl+S')).toBe('Ctrl+S');
  });

  it('replaces Shift on non-Mac', () => {
    expect(getShortcutDisplay('Ctrl+Shift+S')).toBe('Ctrl+Shift+S');
  });

  it('replaces Alt on non-Mac', () => {
    expect(getShortcutDisplay('Ctrl+Alt+S')).toBe('Ctrl+Alt+S');
  });

  it('returns Del on non-Mac', () => {
    expect(getShortcutDisplay('Del')).toBe('Del');
  });
});
