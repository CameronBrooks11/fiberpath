import { useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useStreamStore } from "../../stores/streamStore";
import { useToastStore } from "../../stores/toastStore";
import {
  streamFile,
  pauseStream,
  resumeStream,
  stopStream,
  cancelStream,
} from "../../lib/marlin-api";
import { createStreamFeedback } from "../../lib/streamFeedback";

export function useStreamingActions() {
  const {
    status,
    selectedFile,
    streamControlLoading,
    setSelectedFile,
    setProgress,
    setStreamControlLoading,
    addLogEntry,
    markPaused,
    markConnected,
    markDisconnected,
    resetAfterCancel,
  } = useStreamStore();
  const { addToast } = useToastStore();

  const feedback = createStreamFeedback({ addLogEntry, addToast });
  const [filePath, setFilePath] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setFilePath(null);
    }
  }, [selectedFile]);

  const isConnected = status === "connected" || status === "paused";
  const isPaused = status === "paused";
  const canStartStream = Boolean(filePath) && isConnected;

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

      if (!selected) {
        return;
      }

      setFilePath(selected);
      const filename = selected.split(/[\\/]/).pop() || selected;
      setSelectedFile(filename);
      feedback.file.selected(filename);
    } catch (error) {
      feedback.file.selectionFailed(String(error));
    }
  };

  const handleClearFile = () => {
    setFilePath(null);
    setSelectedFile(null);
    setProgress(null);
    feedback.file.cleared();
  };

  const handleStartStream = async () => {
    if (!filePath || !isConnected) {
      return;
    }

    try {
      await streamFile(filePath);
      feedback.streaming.startedToast();
    } catch (error) {
      feedback.streaming.startFailed(String(error));
    }
  };

  const handlePause = async () => {
    if (streamControlLoading) {
      return;
    }

    setStreamControlLoading(true);
    try {
      await pauseStream();
      markPaused();
      feedback.streaming.paused();
    } catch (error) {
      feedback.streaming.pauseFailed(String(error));
    } finally {
      setStreamControlLoading(false);
    }
  };

  const handleResume = async () => {
    if (streamControlLoading) {
      return;
    }

    setStreamControlLoading(true);
    try {
      await resumeStream();
      markConnected();
      feedback.streaming.resumed();
    } catch (error) {
      feedback.streaming.resumeFailed(String(error));
    } finally {
      setStreamControlLoading(false);
    }
  };

  const handleCancel = async () => {
    if (streamControlLoading) {
      return;
    }

    setStreamControlLoading(true);
    try {
      await cancelStream();
      resetAfterCancel();
      feedback.streaming.cancelled();
    } catch (error) {
      feedback.streaming.cancelFailed(String(error));
      resetAfterCancel();
    } finally {
      setStreamControlLoading(false);
    }
  };

  const handleStop = async () => {
    if (streamControlLoading) {
      return;
    }

    setStreamControlLoading(true);
    try {
      await stopStream();
      markDisconnected();
      feedback.streaming.stopped();
    } catch (error) {
      feedback.streaming.stopFailed(String(error));
      markDisconnected();
    } finally {
      setStreamControlLoading(false);
    }
  };

  return {
    isConnected,
    isPaused,
    canStartStream,
    handleSelectFile,
    handleClearFile,
    handleStartStream,
    handlePause,
    handleResume,
    handleCancel,
    handleStop,
  };
}
