/**
 * StreamLog - Scrollable output log with syntax highlighting
 *
 * Features:
 * - Display log entries with type-based styling
 * - Auto-scroll to bottom
 * - Clear log button
 * - Virtualized rendering for performance (future enhancement)
 */

import { useEffect, useRef } from "react";
import { Trash2, ScrollText } from "lucide-react";
import { useStreamStore } from "../../stores/streamStore";
import type { LogEntry } from "../../stores/streamStore";
import "./StreamLog.css";

export function StreamLog() {
  const { logEntries, clearLog, autoScroll, toggleAutoScroll } =
    useStreamStore();
  const logEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries are added (if enabled)
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logEntries, autoScroll]);

  const getEntryClassName = (entry: LogEntry) => {
    return `log-entry log-entry--${entry.type}`;
  };

  const getEntryPrefix = (entry: LogEntry) => {
    switch (entry.type) {
      case "command":
        return ">";
      case "response":
        return "<";
      case "stream":
        return "•";
      case "error":
        return "!";
      case "progress":
        return "→";
      case "info":
      default:
        return "●";
    }
  };

  return (
    <div className="stream-log">
      <div className="stream-log__header">
        <h3>Output Log</h3>
        <div className="stream-log__controls">
          <button
            onClick={toggleAutoScroll}
            className={`auto-scroll-button ${autoScroll ? "active" : ""}`}
            title={
              autoScroll
                ? "Auto-scroll enabled (click to disable)"
                : "Auto-scroll disabled (click to enable)"
            }
          >
            <ScrollText size={16} />
          </button>
          <button
            onClick={clearLog}
            className="clear-button"
            title="Clear log"
            disabled={logEntries.length === 0}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="stream-log__content" ref={scrollContainerRef}>
        {logEntries.length === 0 ? (
          <div className="log-empty">
            No log entries yet. Connect to a device to get started.
          </div>
        ) : (
          <>
            {logEntries.map((entry) => (
              <div key={entry.id} className={getEntryClassName(entry)}>
                <span className="log-entry__prefix">
                  {getEntryPrefix(entry)}
                </span>
                <span className="log-entry__content">{entry.content}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </>
        )}
      </div>
    </div>
  );
}
