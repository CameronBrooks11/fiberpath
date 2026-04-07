/**
 * FileStreamingSection - G-code file selection and streaming control
 *
 * Features:
 * - File selection button (Tauri file dialog)
 * - Display selected filename
 * - Progress bar
 * - Current command display
 * - Start/Pause/Resume/Stop buttons
 */

import { Play, Pause, Square } from "lucide-react";
import { useStreamStore } from "../../stores/streamStore";
import { useStreamingActions } from "../../hooks/stream/useStreamingActions";
import "./FileStreamingSection.css";

export function FileStreamingSection() {
  const {
    isStreaming,
    selectedFile,
    progress,
    streamControlLoading,
  } = useStreamStore();
  const {
    isPaused,
    canStartStream,
    handleSelectFile,
    handleClearFile,
    handleStartStream,
    handlePause,
    handleResume,
    handleCancel,
    handleStop,
  } = useStreamingActions();

  return (
    <section className="file-streaming-section panel panel--compact">
      <h3 className="panel-title">File Streaming</h3>

      <div className="file-selection">
        <div className="file-info">
          <span className="file-label">File</span>
          <span className="file-name text-mono">
            {selectedFile || "No file selected"}
          </span>
          {selectedFile && !isStreaming && (
            <button
              onClick={handleClearFile}
              className="btn btn--ghost btn--icon-only clear-file-button"
              title="Clear file selection"
              aria-label="Clear file selection"
            >
              ×
            </button>
          )}
        </div>
        <button
          onClick={handleSelectFile}
          disabled={isStreaming}
          className="btn btn--secondary file-select-button"
          title="Select a G-code file to stream"
        >
          Select File
        </button>
      </div>

      {progress && (
        <>
          <div className="stream-progress">
            <div className="stream-progress__header">
              <span className="stream-progress__label">Progress</span>
              <span className="stream-progress__text">
                {progress.sent} / {progress.total}
              </span>
            </div>
            <progress
              className="stream-progress__bar"
              value={progress.sent}
              max={Math.max(progress.total, 1)}
            />
            <div className="current-command">
              <span className="stream-progress__label">Current</span>
              <span className="command-text text-mono">{progress.currentCommand}</span>
            </div>
          </div>
        </>
      )}

      <div className="stream-buttons">
        {!isStreaming ? (
          <button
            onClick={handleStartStream}
            disabled={!canStartStream}
            className="btn btn--success stream-action-button"
            title="Start streaming the selected G-code file"
          >
            <Play size={18} />
            <span>Start Stream</span>
          </button>
        ) : (
          <div className="stream-buttons-grid">
            {!isPaused ? (
              <button
                onClick={handlePause}
                disabled={streamControlLoading}
                className="btn btn--warning stream-action-button"
                title="Pause streaming (sends M0)"
              >
                {streamControlLoading ? (
                  <div className="stream-loading-spinner" />
                ) : (
                  <Pause size={18} />
                )}
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={handleResume}
                disabled={streamControlLoading}
                className="btn btn--success stream-action-button"
                title="Resume streaming (sends M108)"
              >
                {streamControlLoading ? (
                  <div className="stream-loading-spinner" />
                ) : (
                  <Play size={18} />
                )}
                <span>Resume</span>
              </button>
            )}
            {isPaused ? (
              <button
                onClick={handleCancel}
                disabled={streamControlLoading}
                className="btn btn--secondary stream-action-button"
                title="Cancel job (stays connected)"
              >
                {streamControlLoading ? (
                  <div className="stream-loading-spinner" />
                ) : (
                  <Square size={18} />
                )}
                <span>Cancel Job</span>
              </button>
            ) : (
              <button
                onClick={handleStop}
                disabled={streamControlLoading}
                className="btn btn--danger stream-action-button"
                title="Emergency stop (M112) - WARNING: Will disconnect controller"
              >
                {streamControlLoading ? (
                  <div className="stream-loading-spinner" />
                ) : (
                  <Square size={18} />
                )}
                <span>Stop</span>
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
