/**
 * StreamTab - Main container for Marlin streaming interface
 *
 * Layout: Two horizontal panels
 * - Left: Control sections (Connection, Manual Control, File Streaming)
 * - Right: Output log
 */

import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import { StreamControls } from "./StreamControls";
import { StreamLog } from "./StreamLog";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { useStreamEvents } from "../../hooks/useStreamEvents";
import "./StreamTab.css";

export function StreamTab() {
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Set up streaming event listeners
  useStreamEvents();

  // Keyboard shortcut to show/hide help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Only trigger if not in an input field
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          setShowShortcuts((prev) => !prev);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="main-layout__workspace">
      <div className="stream-tab">
        <div className="stream-tab__header panel-header">
          <h2 className="panel-title stream-tab__title">Marlin Streaming Control</h2>
          <button
            onClick={() => setShowShortcuts(true)}
            className="btn btn--ghost btn--icon-only"
            title="Keyboard shortcuts (?)"
            aria-label="Open keyboard shortcuts"
          >
            <HelpCircle size={20} />
          </button>
        </div>

        <div className="stream-tab__content">
          <div className="stream-tab__controls">
            <StreamControls />
          </div>
          <div className="stream-tab__log">
            <StreamLog />
          </div>
        </div>
      </div>

      {showShortcuts && (
        <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />
      )}
    </div>
  );
}
