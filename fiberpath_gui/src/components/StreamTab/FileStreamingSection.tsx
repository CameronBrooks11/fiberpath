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

import { useState } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { useStreamStore } from '../../stores/streamStore';
import { useToastStore } from '../../stores/toastStore';
import { streamFile, pauseStream, resumeStream } from '../../lib/marlin-api';
import './FileStreamingSection.css';

export function FileStreamingSection() {
  const {
    status,
    isStreaming,
    selectedFile,
    progress,
    setSelectedFile,
    setStatus,
    addLogEntry,
  } = useStreamStore();

  const { addToast } = useToastStore();
  const [filePath, setFilePath] = useState<string | null>(null);

  const isConnected = status === 'connected' || status === 'paused';
  const isPaused = status === 'paused';

  const handleSelectFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'G-code',
          extensions: ['gcode', 'nc', 'ngc'],
        }],
      });

      if (selected) {
        setFilePath(selected);
        
        // Extract filename from path
        const filename = selected.split(/[\\/]/).pop() || selected;
        setSelectedFile(filename);
        
        addLogEntry({
          type: 'info',
          content: `File selected: ${filename}`,
        });
        addToast({
          type: 'info',
          message: `Selected: ${filename}`,
        });
      }
    } catch (error) {
      const errorMsg = String(error);
      addLogEntry({
        type: 'error',
        content: `File selection failed: ${errorMsg}`,
      });
      addToast({
        type: 'error',
        message: `File selection failed: ${errorMsg}`,
        duration: 6000,
      });
    }
  };

  const handleStartStream = async () => {
    if (!filePath || !isConnected) {
      return;
    }

    try {
      await streamFile(filePath);
      addToast({
        type: 'info',
        message: 'Streaming started',
      });
    } catch (error) {
      const errorMsg = String(error);
      addLogEntry({
        type: 'error',
        content: `Failed to start streaming: ${errorMsg}`,
      });
      addToast({
        type: 'error',
        message: `Failed to start streaming: ${errorMsg}`,
        duration: 6000,
      });
    }
  };

  const handlePause = async () => {
    try {
      await pauseStream();
      setStatus('paused');
      addLogEntry({
        type: 'info',
        content: 'Streaming paused (M0 sent)',
      });
      addToast({
        type: 'warning',
        message: 'Streaming paused',
      });
    } catch (error) {
      const errorMsg = String(error);
      addLogEntry({
        type: 'error',
        content: `Pause failed: ${errorMsg}`,
      });
      addToast({
        type: 'error',
        message: `Pause failed: ${errorMsg}`,
      });
    }
  };

  const handleResume = async () => {
    try {
      await resumeStream();
      setStatus('connected');
      addLogEntry({
        type: 'info',
        content: 'Streaming resumed (M108 sent)',
      });
      addToast({
        type: 'success',
        message: 'Streaming resumed',
      });
    } catch (error) {
      const errorMsg = String(error);
      addLogEntry({
        type: 'error',
        content: `Resume failed: ${errorMsg}`,
      });
      addToast({
        type: 'error',
        message: `Resume failed: ${errorMsg}`,
      });
    }
  };

  const handleStop = () => {
    // TODO: Implement stop functionality in Phase 5
    addLogEntry({
      type: 'error',
      content: 'Stop not yet implemented',
    });
    addToast({
      type: 'warning',
      message: 'Stop functionality coming in Phase 5',
    });
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
            {selectedFile || 'No file selected'}
          </span>
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
                className="pause-button"
                title="Pause streaming (sends M0)"
              >
                <Pause size={18} />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={handleResume}
                className="resume-button"
                title="Resume streaming (sends M108)"
              >
                <Play size={18} />
                <span>Resume</span>
              </button>
            )}
            <button
              onClick={handleStop}
              className="stop-button"
              title="Stop streaming (not yet implemented)"
            >
              <Square size={18} />
              <span>Stop</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
