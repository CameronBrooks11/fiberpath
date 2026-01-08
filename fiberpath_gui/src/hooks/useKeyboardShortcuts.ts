import { useEffect } from "react";

export interface KeyboardShortcutHandlers {
  onNew?: () => void | Promise<void> | boolean | Promise<boolean>;
  onOpen?: () => void | Promise<void> | boolean | Promise<boolean>;
  onSave?: () => void | Promise<void> | boolean | Promise<boolean>;
  onSaveAs?: () => void | Promise<void> | boolean | Promise<boolean>;
  onExport?: () => void | Promise<void> | boolean | Promise<boolean>;
  onDuplicate?: () => void | Promise<void> | boolean | Promise<boolean>;
  onDelete?: () => void | Promise<void> | boolean | Promise<boolean>;
}

/**
 * Detects if the user is on macOS
 */
const isMac = () => {
  return typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
};

/**
 * Checks if the target element is an input field where keyboard shortcuts should be disabled
 */
const isInputElement = (target: EventTarget | null): boolean => {
  if (!target || !(target instanceof HTMLElement)) return false;
  
  const tagName = target.tagName.toUpperCase();
  const isEditable = target.isContentEditable;
  
  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    isEditable
  );
};

/**
 * Custom hook for handling keyboard shortcuts
 * Supports both Ctrl (Windows/Linux) and Cmd (macOS)
 */
export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input field
      if (isInputElement(event.target)) {
        return;
      }

      // Determine which modifier key to check (Ctrl for Windows/Linux, Meta/Cmd for Mac)
      const modifierKey = isMac() ? event.metaKey : event.ctrlKey;
      
      // Check for modifier + key combinations
      if (modifierKey && !event.altKey) {
        switch (event.key.toLowerCase()) {
          case 'n':
            // Ctrl/Cmd + N - New Project
            if (!event.shiftKey && handlers.onNew) {
              event.preventDefault();
              void handlers.onNew();
            }
            break;
            
          case 'o':
            // Ctrl/Cmd + O - Open
            if (!event.shiftKey && handlers.onOpen) {
              event.preventDefault();
              void handlers.onOpen();
            }
            break;
            
          case 's':
            if (event.shiftKey && handlers.onSaveAs) {
              // Ctrl/Cmd + Shift + S - Save As
              event.preventDefault();
              void handlers.onSaveAs();
            } else if (!event.shiftKey && handlers.onSave) {
              // Ctrl/Cmd + S - Save
              event.preventDefault();
              void handlers.onSave();
            }
            break;
            
          case 'e':
            // Ctrl/Cmd + E - Export G-code
            if (!event.shiftKey && handlers.onExport) {
              event.preventDefault();
              void handlers.onExport();
            }
            break;
            
          case 'd':
            // Ctrl/Cmd + D - Duplicate Layer
            if (!event.shiftKey && handlers.onDuplicate) {
              event.preventDefault();
              void handlers.onDuplicate();
            }
            break;
        }
      }
      
      // Check for non-modifier keys
      if (!modifierKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
        switch (event.key) {
          case 'Delete':
            // Delete key - Delete Layer
            if (handlers.onDelete) {
              event.preventDefault();
              void handlers.onDelete();
            }
            break;
        }
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers]);
}

/**
 * Get the display text for a keyboard shortcut based on platform
 */
export function getShortcutDisplay(shortcut: string): string {
  const mac = isMac();
  
  // Replace modifier keys with platform-specific versions
  return shortcut
    .replace(/Ctrl/g, mac ? '⌘' : 'Ctrl')
    .replace(/Shift/g, mac ? '⇧' : 'Shift')
    .replace(/Alt/g, mac ? '⌥' : 'Alt')
    .replace(/Del/g, mac ? '⌫' : 'Del');
}
