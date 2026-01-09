/**
 * StreamTab - Main container for Marlin streaming interface
 * 
 * Layout: Two horizontal panels
 * - Left: Control sections (Connection, Manual Control, File Streaming)
 * - Right: Output log
 */

import { useEffect, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { StreamControls } from './StreamControls';
import { StreamLog } from './StreamLog';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { useStreamStore } from '../../stores/streamStore';
import { useToastStore } from '../../stores/toastStore';
import { 
  onStreamStarted, 
  onStreamProgress, 
  onStreamComplete, 
  onStreamError 
} from '../../lib/marlin-api';
import './StreamTab.css';

export function StreamTab() {
  const [showShortcuts, setShowShortcuts] = useState(false);
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
        
        // Show milestone toasts (25%, 50%, 75%)
        const percentage = (progress.commandsSent / progress.commandsTotal) * 100;
        if (percentage === 25 || percentage === 50 || percentage === 75) {
          addToast({
            type: 'info',
            message: `Streaming ${Math.round(percentage)}% complete`,
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
        addToast({
          type: 'success',
          message: `Streaming complete: ${complete.commandsSent} commands sent`,
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
        addToast({
          type: 'error',
          message: `Streaming error: ${error.message}`,
          duration: 6000,
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

  // Keyboard shortcut to show/hide help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Only trigger if not in an input field
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setShowShortcuts(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="main-layout__workspace">
      <div className="stream-tab">
        <div className="stream-tab__header">
          <h2>Marlin Streaming Control</h2>
          <button 
            onClick={() => setShowShortcuts(true)}
            className="help-button"
            title="Keyboard shortcuts (?)"
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
