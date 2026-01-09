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

import { useEffect } from 'react';
import { useStreamStore } from '../stores/streamStore';
import { useToastStore } from '../stores/toastStore';
import { 
  onStreamStarted, 
  onStreamProgress, 
  onStreamComplete, 
  onStreamError 
} from '../lib/marlin-api';
import { 
  PROGRESS_MILESTONE_PERCENTAGES,
  LOG_PROGRESS_EVERY_N_COMMANDS,
  TOAST_DURATION_ERROR_MS 
} from '../lib/constants';
import { toastMessages } from '../lib/toastMessages';

/**
 * Hook to set up streaming event listeners
 * 
 * Manages all Tauri event subscriptions for the streaming lifecycle.
 * Updates stream store state and shows toast notifications appropriately.
 */
export function useStreamEvents() {
  const { 
    setIsStreaming, 
    setProgress, 
    setStatus, 
    addLogEntry 
  } = useStreamStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    // Set up event listeners for streaming events
    const unlistenPromises = [
      // Stream started event
      onStreamStarted((started) => {
        setIsStreaming(true);
        addLogEntry({
          type: 'info',
          content: `Streaming started: ${started.file} (${started.totalCommands} commands)`,
        });
      }),
      
      // Stream progress event
      onStreamProgress((progress) => {
        setProgress({
          sent: progress.commandsSent,
          total: progress.commandsTotal,
          currentCommand: progress.command,
        });
        
        // Add stream entry to log (throttled to every Nth command)
        if (progress.commandsSent % LOG_PROGRESS_EVERY_N_COMMANDS === 0 || progress.commandsSent === progress.commandsTotal) {
          addLogEntry({
            type: 'stream',
            content: `[${progress.commandsSent}/${progress.commandsTotal}] ${progress.command}`,
          });
        }
        
        // Show milestone toasts at 25%, 50%, 75%
        const percentage = Math.round((progress.commandsSent / progress.commandsTotal) * 100);
        if (PROGRESS_MILESTONE_PERCENTAGES.includes(percentage)) {
          addToast({
            type: 'info',
            message: toastMessages.streaming.progress(percentage),
          });
        }
      }),
      
      // Stream complete event
      onStreamComplete((complete) => {
        setIsStreaming(false);
        setProgress(null);
        setStatus('connected');
        addLogEntry({
          type: 'info',
          content: `Streaming complete: ${complete.commandsSent}/${complete.commandsTotal} commands sent`,
        });
        addToast({
          type: 'success',
          message: toastMessages.streaming.complete(complete.commandsSent),
        });
      }),
      
      // Stream error event
      onStreamError((error) => {
        setIsStreaming(false);
        setProgress(null);
        setStatus('connected');
        addLogEntry({
          type: 'error',
          content: `Streaming error: ${error.message}`,
        });
        addToast({
          type: 'error',
          message: toastMessages.streaming.error(error.message),
          duration: TOAST_DURATION_ERROR_MS,
        });
      }),
    ];

    // Cleanup listeners on unmount
    return () => {
      Promise.all(unlistenPromises).then((unlisteners) => {
        unlisteners.forEach((unlisten) => unlisten());
      });
    };
  }, [setIsStreaming, setProgress, setStatus, addLogEntry, addToast]);
}
