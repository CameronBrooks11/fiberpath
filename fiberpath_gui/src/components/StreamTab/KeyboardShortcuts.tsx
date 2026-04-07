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
    <div className="keyboard-shortcuts-overlay dialog-overlay" onClick={onClose}>
      <div
        className="keyboard-shortcuts-modal dialog-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="keyboard-shortcuts-header dialog-header">
          <div className="keyboard-shortcuts-title">
            <Keyboard size={20} />
            <h2>Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="dialog-close"
            title="Close"
            aria-label="Close keyboard shortcuts"
          >
            <X size={20} />
          </button>
        </div>

        <div className="keyboard-shortcuts-body dialog-body">
          <section className="shortcut-section">
            <h3 className="panel-title keyboard-shortcuts-section-title">Navigation</h3>
            <div className="shortcut-list">
              <div className="shortcut-item">
                <kbd>Alt</kbd> + <kbd>1</kbd>
                <span className="shortcut-description">Switch to Main tab</span>
              </div>
              <div className="shortcut-item">
                <kbd>Alt</kbd> + <kbd>2</kbd>
                <span className="shortcut-description">Switch to Stream tab</span>
              </div>
            </div>
          </section>

          <section className="shortcut-section">
            <h3 className="panel-title keyboard-shortcuts-section-title">Manual Control</h3>
            <div className="shortcut-list">
              <div className="shortcut-item">
                <kbd>Enter</kbd>
                <span className="shortcut-description">Send manual G-code command</span>
              </div>
            </div>
          </section>

          <section className="shortcut-section">
            <h3 className="panel-title keyboard-shortcuts-section-title">Log Controls</h3>
            <div className="shortcut-list">
              <div className="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>L</kbd>
                <span className="shortcut-description">
                  Clear log (when log is focused)
                </span>
              </div>
            </div>
          </section>

          <section className="shortcut-section">
            <h3 className="panel-title keyboard-shortcuts-section-title">Quick Commands</h3>
            <div className="command-list">
              <div className="command-item">
                <code>G28</code>
                <span className="shortcut-description">Home all axes</span>
              </div>
              <div className="command-item">
                <code>M114</code>
                <span className="shortcut-description">Get current position</span>
              </div>
              <div className="command-item">
                <code>M112</code>
                <span className="shortcut-description">Emergency stop</span>
              </div>
              <div className="command-item">
                <code>M18</code>
                <span className="shortcut-description">Disable stepper motors</span>
              </div>
              <div className="command-item">
                <code>M0</code>
                <span className="shortcut-description">Pause streaming</span>
              </div>
              <div className="command-item">
                <code>M108</code>
                <span className="shortcut-description">Resume streaming</span>
              </div>
            </div>
          </section>
        </div>

        <div className="keyboard-shortcuts-footer dialog-footer">
          <p>
            Press <kbd>?</kbd> to show/hide this dialog
          </p>
        </div>
      </div>
    </div>
  );
}
