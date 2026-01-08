import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getRecentFiles } from "../../lib/recentFiles";
import { useProjectStore } from "../../state/projectStore";
import "../../styles/dialogs.css";

interface DiagnosticsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DiagnosticsData {
  cliVersion: string | null;
  cliHealthy: boolean;
  recentFilesCount: number;
  projectStats: {
    layers: number;
    filePath: string | null;
    isDirty: boolean;
  };
}

export function DiagnosticsDialog({ isOpen, onClose }: DiagnosticsDialogProps) {
  const project = useProjectStore(state => state.project);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData>({
    cliVersion: "0.2.3",
    cliHealthy: true,
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
        cliVersion: "0.2.3", // TODO: Actually check CLI version
        cliHealthy: true, // TODO: Actually check CLI health
        recentFilesCount: recentFiles.length,
        projectStats: {
          layers: project.layers.length,
          filePath: project.filePath,
          isDirty: project.isDirty,
        },
      });
    }
  }, [isOpen, project]);

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
                <span className={`diagnostics-value ${diagnostics.cliHealthy ? 'status-healthy' : 'status-error'}`}>
                  {diagnostics.cliHealthy ? '✓ Healthy' : '✗ Unavailable'}
                </span>
              </div>
              <div className="diagnostics-item">
                <span className="diagnostics-label">Version:</span>
                <span className="diagnostics-value">
                  {diagnostics.cliVersion || 'Unknown'}
                </span>
              </div>
            </div>
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
