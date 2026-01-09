/**
 * KeyboardShortcuts - Documentation for available keyboard shortcuts
 *
 * Shows a modal with all available keyboard shortcuts for the Stream Tab
 */

import { X, Keyboard } from "lucide-react";
import "./KeyboardShortcuts.css";

interface KeyboardShortcutsProps {
  onClose: () => void;
}

export function KeyboardShortcuts({ onClose }: KeyboardShortcutsProps) {
  return (
    <div className="keyboard-shortcuts-overlay" onClick={onClose}>
      <div
        className="keyboard-shortcuts-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="header-title">
            <Keyboard size={20} />
            <h2>Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="close-button" title="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          <section className="shortcut-section">
            <h3>Navigation</h3>
            <div className="shortcut-list">
              <div className="shortcut-item">
                <kbd>Alt</kbd> + <kbd>1</kbd>
                <span>Switch to Main tab</span>
              </div>
              <div className="shortcut-item">
                <kbd>Alt</kbd> + <kbd>2</kbd>
                <span>Switch to Stream tab</span>
              </div>
            </div>
          </section>

          <section className="shortcut-section">
            <h3>Manual Control</h3>
            <div className="shortcut-list">
              <div className="shortcut-item">
                <kbd>Enter</kbd>
                <span>Send manual G-code command</span>
              </div>
            </div>
          </section>

          <section className="shortcut-section">
            <h3>Log Controls</h3>
            <div className="shortcut-list">
              <div className="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>L</kbd>
                <span>Clear log (when log is focused)</span>
              </div>
            </div>
          </section>

          <section className="shortcut-section">
            <h3>Quick Commands</h3>
            <div className="command-list">
              <div className="command-item">
                <code>G28</code>
                <span>Home all axes</span>
              </div>
              <div className="command-item">
                <code>M114</code>
                <span>Get current position</span>
              </div>
              <div className="command-item">
                <code>M112</code>
                <span>Emergency stop</span>
              </div>
              <div className="command-item">
                <code>M18</code>
                <span>Disable stepper motors</span>
              </div>
              <div className="command-item">
                <code>M0</code>
                <span>Pause streaming</span>
              </div>
              <div className="command-item">
                <code>M108</code>
                <span>Resume streaming</span>
              </div>
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <p>
            Press <kbd>?</kbd> to show/hide this dialog
          </p>
        </div>
      </div>
    </div>
  );
}
