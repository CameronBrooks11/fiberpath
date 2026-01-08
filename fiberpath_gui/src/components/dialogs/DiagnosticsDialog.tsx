import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getRecentFiles } from "../../lib/recentFiles";
import { useProjectStore } from "../../state/projectStore";
import { useCliHealthContext } from "../../contexts/CliHealthContext";
import type { DialogBaseProps } from "../../types/components";
import "../../styles/dialogs.css";

/**
 * Props for the DiagnosticsDialog component.
 */
interface DiagnosticsDialogProps extends DialogBaseProps {
  /** Whether the dialog is currently visible */
  isOpen: boolean;
}

/**
 * Diagnostic information displayed in the dialog.
 */
interface DiagnosticsData {
  /** Number of files in the recent files list */
  recentFilesCount: number;
  
  /** Statistics about the current project */
  projectStats: {
    /** Number of layers in the current project */
    layers: number;
    
    /** File path of the current project, or null if unsaved */
    filePath: string | null;
    
    /** Whether the project has unsaved changes */
    isDirty: boolean;
  };
}

/**
 * Diagnostics dialog showing system and project information.
 * 
 * Displays:
 * - CLI backend version and health status
 * - Recent files count
 * - Current project statistics (layer count, file path, dirty state)
 * - System information for debugging
 * 
 * This dialog is useful for troubleshooting and understanding the
 * current state of the application.
 * 
 * @example
 * ```tsx
 * <DiagnosticsDialog 
 *   isOpen={showDiagnostics} 
 *   onClose={() => setShowDiagnostics(false)} 
 * />
 * ```
 * 
 * @param props - Component props
 * @param props.isOpen - Controls dialog visibility
 * @param props.onClose - Callback invoked when the dialog should close
 * @returns The diagnostics dialog portal, or null if not open
 */
export function DiagnosticsDialog({ isOpen, onClose }: DiagnosticsDialogProps) {
  const project = useProjectStore(state => state.project);
  const { version: cliVersion, isHealthy: cliHealthy, errorMessage, lastChecked, refresh } = useCliHealthContext();
  
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData>({
    recentFilesCount: 0,
    projectStats: {
      layers: 0,
      filePath: null,
      isDirty: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      // Gather diagnostics data
      const recentFiles = getRecentFiles();
      
      setDiagnostics({
        recentFilesCount: recentFiles.length,
        projectStats: {
          layers: project.layers.length,
          filePath: project.filePath,
          isDirty: project.isDirty,
        },
      });
      
      // Refresh CLI health when dialog opens
      refresh();
    }
  }, [isOpen, project, refresh]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const dialogContent = (
    <div className="dialog-overlay" onClick={handleOverlayClick}>
      <div className="dialog-content">
        <div className="dialog-header">
          <h2>Diagnostics</h2>
          <button className="dialog-close" onClick={onClose}>×</button>
        </div>
        
        <div className="dialog-body">
          <div className="diagnostics-section">
            <h3>CLI Status</h3>
            <div className="diagnostics-grid">
              <div className="diagnostics-item">
                <span className="diagnostics-label">Health:</span>
                <span className={`diagnostics-value ${cliHealthy ? 'status-healthy' : 'status-error'}`}>
                  {cliHealthy ? '✓ Healthy' : '✗ Unavailable'}
                </span>
              </div>
              <div className="diagnostics-item">
                <span className="diagnostics-label">Version:</span>
                <span className="diagnostics-value">
                  {cliVersion || 'Unknown'}
                </span>
              </div>
              {!cliHealthy && errorMessage && (
                <div className="diagnostics-item diagnostics-item--full-width">
                  <span className="diagnostics-label">Error:</span>
                  <span className="diagnostics-value diagnostics-value--error">
                    {errorMessage}
                  </span>
                </div>
              )}
              {lastChecked && (
                <div className="diagnostics-item">
                  <span className="diagnostics-label">Last Checked:</span>
                  <span className="diagnostics-value">
                    {lastChecked.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
            <button className="btn btn--secondary" onClick={refresh} style={{ marginTop: '0.5rem' }}>
              Refresh CLI Status
            </button>
          </div>

          <div className="diagnostics-section">
            <h3>Project Status</h3>
            <div className="diagnostics-grid">
              <div className="diagnostics-item">
                <span className="diagnostics-label">File Path:</span>
                <span className="diagnostics-value diagnostics-value--path">
                  {diagnostics.projectStats.filePath || 'Untitled'}
                </span>
              </div>
              <div className="diagnostics-item">
                <span className="diagnostics-label">Layer Count:</span>
                <span className="diagnostics-value">
                  {diagnostics.projectStats.layers}
                </span>
              </div>
              <div className="diagnostics-item">
                <span className="diagnostics-label">Unsaved Changes:</span>
                <span className={`diagnostics-value ${diagnostics.projectStats.isDirty ? 'status-warning' : 'status-healthy'}`}>
                  {diagnostics.projectStats.isDirty ? '⚠ Yes' : '✓ No'}
                </span>
              </div>
            </div>
          </div>

          <div className="diagnostics-section">
            <h3>Application Data</h3>
            <div className="diagnostics-grid">
              <div className="diagnostics-item">
                <span className="diagnostics-label">Recent Files:</span>
                <span className="diagnostics-value">
                  {diagnostics.recentFilesCount} / 10
                </span>
              </div>
              <div className="diagnostics-item">
                <span className="diagnostics-label">Temp Files:</span>
                <span className="diagnostics-value">
                  Cleaned on exit
                </span>
              </div>
            </div>
          </div>

          <div className="diagnostics-section">
            <h3>System Information</h3>
            <div className="diagnostics-grid">
              <div className="diagnostics-item">
                <span className="diagnostics-label">Platform:</span>
                <span className="diagnostics-value">
                  {navigator.platform}
                </span>
              </div>
              <div className="diagnostics-item">
                <span className="diagnostics-label">User Agent:</span>
                <span className="diagnostics-value diagnostics-value--path">
                  {navigator.userAgent}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="button button--secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
