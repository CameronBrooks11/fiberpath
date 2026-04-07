/**
 * useStreamEvents - Custom hook to manage Marlin streaming event listeners
 *
 * Subscribes to Tauri events for streaming lifecycle:
 * - stream-started: Fired when streaming begins
 * - stream-progress: Fired periodically during streaming
 * - stream-complete: Fired when streaming finishes successfully
 * - stream-error: Fired when streaming encounters an error
 *
 * Automatically handles cleanup on unmount.
 */

import { useEffect, useMemo } from "react";
import { useStreamStore } from "../stores/streamStore";
import { useToastStore } from "../stores/toastStore";
import {
  onStreamStarted,
  onStreamProgress,
  onStreamComplete,
  onStreamError,
} from "../lib/marlin-api";
import {
  PROGRESS_MILESTONE_PERCENTAGES,
  LOG_PROGRESS_EVERY_N_COMMANDS,
} from "../lib/constants";
import { createStreamFeedback } from "../lib/streamFeedback";

/**
 * Hook to set up streaming event listeners
 *
 * Manages all Tauri event subscriptions for the streaming lifecycle.
 * Updates stream store state and shows toast notifications appropriately.
 */
export function useStreamEvents() {
  const { markStreamingStarted, setProgress, resetAfterCancel, addLogEntry } =
    useStreamStore();
  const { addToast } = useToastStore();
  const feedback = useMemo(
    () => createStreamFeedback({ addLogEntry, addToast }),
    [addLogEntry, addToast],
  );

  useEffect(() => {
    // Set up event listeners for streaming events
    const unlistenPromises = [
      // Stream started event
      onStreamStarted((started) => {
        markStreamingStarted();
        feedback.streaming.startedEvent(started.file, started.totalCommands);
      }),

      // Stream progress event
      onStreamProgress((progress) => {
        setProgress({
          sent: progress.commandsSent,
          total: progress.commandsTotal,
          currentCommand: progress.command,
        });

        // Add stream entry to log (throttled to every Nth command)
        if (
          progress.commandsSent % LOG_PROGRESS_EVERY_N_COMMANDS === 0 ||
          progress.commandsSent === progress.commandsTotal
        ) {
          feedback.streaming.progressLog(
            progress.commandsSent,
            progress.commandsTotal,
            progress.command,
          );
        }

        // Show milestone toasts at 25%, 50%, 75%
        const percentage = Math.round(
          (progress.commandsSent / progress.commandsTotal) * 100,
        );
        if (PROGRESS_MILESTONE_PERCENTAGES.includes(percentage)) {
          feedback.streaming.progressMilestone(percentage);
        }
      }),

      // Stream complete event
      onStreamComplete((complete) => {
        resetAfterCancel();
        feedback.streaming.complete(
          complete.commandsSent,
          complete.commandsTotal,
        );
      }),

      // Stream error event
      onStreamError((error) => {
        resetAfterCancel();
        feedback.streaming.error(error.message);
      }),
    ];

    // Cleanup listeners on unmount
    return () => {
      Promise.all(unlistenPromises).then((unlisteners) => {
        unlisteners.forEach((unlisten) => unlisten());
      });
    };
  }, [markStreamingStarted, setProgress, resetAfterCancel, feedback]);
}
