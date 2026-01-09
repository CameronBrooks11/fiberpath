/**
 * StreamTab - Main container for Marlin streaming interface
 * 
 * Layout: Two horizontal panels
 * - Left: Control sections (Connection, Manual Control, File Streaming)
 * - Right: Output log
 */

import { useEffect } from 'react';
import { StreamControls } from './StreamControls';
import { StreamLog } from './StreamLog';
import { useStreamStore } from '../../stores/streamStore';
import { 
  onStreamStarted, 
  onStreamProgress, 
  onStreamComplete, 
  onStreamError 
} from '../../lib/marlin-api';
import './StreamTab.css';

export function StreamTab() {
  const { 
    setIsStreaming, 
    setProgress, 
    setStatus, 
    addLogEntry 
  } = useStreamStore();

  useEffect(() => {
    // Set up event listeners for streaming events
    const unlistenPromises = [
      onStreamStarted((started) => {
        setIsStreaming(true);
        addLogEntry({
          type: 'info',
          content: `Streaming started: ${started.file} (${started.totalCommands} commands)`,
        });
      }),
      
      onStreamProgress((progress) => {
        setProgress({
          sent: progress.commandsSent,
          total: progress.commandsTotal,
          currentCommand: progress.command,
        });
        
        // Add stream entry to log (less verbose)
        if (progress.commandsSent % 10 === 0 || progress.commandsSent === progress.commandsTotal) {
          addLogEntry({
            type: 'stream',
            content: `[${progress.commandsSent}/${progress.commandsTotal}] ${progress.command}`,
          });
        }
      }),
      
      onStreamComplete((complete) => {
        setIsStreaming(false);
        setProgress(null);
        setStatus('connected');
        addLogEntry({
          type: 'info',
          content: `Streaming complete: ${complete.commandsSent}/${complete.commandsTotal} commands sent`,
        });
      }),
      
      onStreamError((error) => {
        setIsStreaming(false);
        setProgress(null);
        setStatus('connected');
        addLogEntry({
          type: 'error',
          content: `Streaming error: ${error.message}`,
        });
      }),
    ];

    // Cleanup listeners on unmount
    return () => {
      Promise.all(unlistenPromises).then((unlisteners) => {
        unlisteners.forEach((unlisten) => unlisten());
      });
    };
  }, [setIsStreaming, setProgress, setStatus, addLogEntry]);

  return (
    <div className="main-layout__workspace">
      <div className="stream-tab">
        <div className="stream-tab__controls">
          <StreamControls />
        </div>
        <div className="stream-tab__log">
          <StreamLog />
        </div>
      </div>
    </div>
  );
}
