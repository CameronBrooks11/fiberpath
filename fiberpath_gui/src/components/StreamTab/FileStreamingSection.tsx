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

import { useState } from "react";
import { Play, Pause, Square } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { useStreamStore } from "../../stores/streamStore";
import { useToastStore } from "../../stores/toastStore";
import { streamFile, pauseStream, resumeStream, stopStream, cancelStream } from "../../lib/marlin-api";
import { TOAST_DURATION_ERROR_MS } from "../../lib/constants";
import { toastMessages } from "../../lib/toastMessages";
import "./FileStreamingSection.css";

export function FileStreamingSection() {
  const {
    status,
    isStreaming,
    selectedFile,
    progress,
    streamControlLoading,
    setSelectedFile,
    setProgress,
    setStatus,
    setIsStreaming,
    setStreamControlLoading,
    addLogEntry,
  } = useStreamStore();

  const { addToast } = useToastStore();
  const [filePath, setFilePath] = useState<string | null>(null);

  const isConnected = status === "connected" || status === "paused";
  const isPaused = status === "paused";

  const handleSelectFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "G-code",
            extensions: ["gcode", "nc", "ngc"],
          },
        ],
      });

      if (selected) {
        setFilePath(selected);

        // Extract filename from path
        const filename = selected.split(/[\\/]/).pop() || selected;
        setSelectedFile(filename);

        addLogEntry({
          type: "info",
          content: `File selected: ${filename}`,
        });
        addToast({
          type: "info",
          message: toastMessages.file.selected(filename),
        });
      }
    } catch (error) {
      const errorMsg = String(error);
      addLogEntry({
        type: "error",
        content: `File selection failed: ${errorMsg}`,
      });
      addToast({
        type: "error",
        message: toastMessages.file.selectionFailed(errorMsg),
        duration: TOAST_DURATION_ERROR_MS,
      });
    }
  };

  const handleClearFile = () => {
    setFilePath(null);
    setSelectedFile(null);
    setProgress(null);
    addLogEntry({
      type: "info",
      content: "File selection cleared",
    });
    addToast({
      type: "info",
      message: "File selection cleared",
    });
  };

  const handleStartStream = async () => {
    if (!filePath || !isConnected) {
      return;
    }

    try {
      await streamFile(filePath);
      addToast({
        type: "info",
        message: toastMessages.streaming.started(),
      });
    } catch (error) {
      const errorMsg = String(error);
      addLogEntry({
        type: "error",
        content: `Failed to start streaming: ${errorMsg}`,
      });
      addToast({
        type: "error",
        message: toastMessages.streaming.failed(errorMsg),
        duration: TOAST_DURATION_ERROR_MS,
      });
    }
  };

  const handlePause = async () => {
    if (streamControlLoading) return;
    
    setStreamControlLoading(true);
    try {
      await pauseStream();
      setStatus("paused");
      addLogEntry({
        type: "info",
        content: "Streaming paused (M0 sent)",
      });
      addToast({
        type: "warning",
        message: toastMessages.streaming.paused(),
      });
    } catch (error) {
      const errorMsg = String(error);
      addLogEntry({
        type: "error",
        content: `Pause failed: ${errorMsg}`,
      });
      addToast({
        type: "error",
        message: toastMessages.streaming.pauseFailed(errorMsg),
      });
    } finally {
      setStreamControlLoading(false);
    }
  };

  const handleResume = async () => {
    if (streamControlLoading) return;
    
    setStreamControlLoading(true);
    try {
      await resumeStream();
      setStatus("connected");
      addLogEntry({
        type: "info",
        content: "Streaming resumed (M108 sent)",
      });
      addToast({
        type: "success",
        message: toastMessages.streaming.resumed(),
      });
    } catch (error) {
      const errorMsg = String(error);
      addLogEntry({
        type: "error",
        content: `Resume failed: ${errorMsg}`,
      });
      addToast({
        type: "error",
        message: toastMessages.streaming.resumeFailed(errorMsg),
      });
    } finally {
      setStreamControlLoading(false);
    }
  };

  const handleCancel = async () => {
    if (streamControlLoading) return;

    setStreamControlLoading(true);
    try {
      await cancelStream();
      // Clean cancel - connection stays open
      setIsStreaming(false);
      setStatus("connected"); // Reset from "paused" to "connected"
      setProgress(null); // Clear progress display
      addLogEntry({
        type: "info",
        content: "Job cancelled - ready for new file",
      });
      addToast({
        type: "info",
        message: "Job cancelled successfully. Connection maintained.",
      });
    } catch (error) {
      const errorMsg = String(error);
      addLogEntry({
        type: "error",
        content: `Cancel failed: ${errorMsg}`,
      });
      addToast({
        type: "error",
        message: `Failed to cancel: ${errorMsg}`,
        duration: TOAST_DURATION_ERROR_MS,
      });
      // On error, still mark streaming as false and reset state
      setIsStreaming(false);
      setStatus("connected");
      setProgress(null);
    } finally {
      setStreamControlLoading(false);
    }
  };

  const handleStop = async () => {
    if (streamControlLoading) return;
    
    setStreamControlLoading(true);
    try {
      await stopStream();
      // M112 typically causes disconnect - update UI to reflect this
      setStatus("disconnected");
      addLogEntry({
        type: "error",
        content: "Emergency stop (M112) sent - controller will disconnect",
      });
      addToast({
        type: "warning",
        message: "Emergency stop executed. Controller disconnected - reconnect to continue.",
        duration: TOAST_DURATION_ERROR_MS,
      });
    } catch (error) {
      const errorMsg = String(error);
      addLogEntry({
        type: "error",
        content: `Stop failed: ${errorMsg}`,
      });
      addToast({
        type: "error",
        message: `Failed to stop: ${errorMsg}`,
        duration: TOAST_DURATION_ERROR_MS,
      });
      // Even on error, assume connection is broken after M112 attempt
      setStatus("disconnected");
    } finally {
      setStreamControlLoading(false);
    }
  };

  const getProgressPercentage = () => {
    if (!progress || progress.total === 0) return 0;
    return (progress.sent / progress.total) * 100;
  };

  return (
    <div className="file-streaming-section">
      <h3 className="section-title">FILE STREAMING</h3>

      <div className="file-selection">
        <div className="file-info">
          <span className="file-label">File:</span>
          <span className="file-name">
            {selectedFile || "No file selected"}
          </span>
          {selectedFile && !isStreaming && (
            <button
              onClick={handleClearFile}
              className="clear-file-button"
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
          className="select-file-button"
          title="Select a G-code file to stream"
        >
          Select File
        </button>
      </div>

      {progress && (
        <>
          <div className="progress-section">
            <label>Progress:</label>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <div className="progress-text">
              {progress.sent} / {progress.total}
            </div>
          </div>

          <div className="current-command">
            <label>Current:</label>
            <span className="command-text">{progress.currentCommand}</span>
          </div>
        </>
      )}

      <div className="stream-buttons">
        {!isStreaming ? (
          <button
            onClick={handleStartStream}
            disabled={!isConnected || !filePath}
            className="start-button"
            title="Start streaming the selected G-code file"
          >
            <Play size={18} />
            <span>Start Stream</span>
          </button>
        ) : (
          <div className="stream-controls">
            {!isPaused ? (
              <button
                onClick={handlePause}
                disabled={streamControlLoading}
                className="pause-button"
                title="Pause streaming (sends M0)"
              >
                {streamControlLoading ? (
                  <div className="spinner" />
                ) : (
                  <Pause size={18} />
                )}
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={handleResume}
                disabled={streamControlLoading}
                className="resume-button"
                title="Resume streaming (sends M108)"
              >
                {streamControlLoading ? (
                  <div className="spinner" />
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
                className="cancel-button"
                title="Cancel job (stays connected)"
              >
                {streamControlLoading ? (
                  <div className="spinner" />
                ) : (
                  <Square size={18} />
                )}
                <span>Cancel Job</span>
              </button>
            ) : (
              <button
                onClick={handleStop}
                disabled={streamControlLoading}
                className="stop-button"
                title="Emergency stop (M112) - WARNING: Will disconnect controller"
              >
                {streamControlLoading ? (
                  <div className="spinner" />
                ) : (
                  <Square size={18} />
                )}
                <span>Stop</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
