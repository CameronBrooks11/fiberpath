import { createPortal } from "react-dom";
import type { DialogBaseProps } from "../../types/components";
import "../../styles/dialogs.css";

interface CliUnavailableDialogProps extends DialogBaseProps {
  /** Whether the dialog is currently visible */
  isOpen: boolean;
  /** CLI version if known */
  version: string | null;
  /** Error message from health check */
  errorMessage: string | null;
  /** Callback to retry the health check */
  onRetry: () => void;
}

/**
 * Dialog displayed when the CLI backend becomes unavailable.
 *
 * This dialog informs the user that file operations cannot be performed
 * until the CLI is available again. Provides a retry button and helpful
 * troubleshooting information.
 *
 * @example
 * ```tsx
 * <CliUnavailableDialog
 *   isOpen={!isCliHealthy}
 *   version={cliVersion}
 *   errorMessage={errorMessage}
 *   onRetry={refreshCliHealth}
 *   onClose={() => {}}
 * />
 * ```
 */
export function CliUnavailableDialog({
  isOpen,
  version,
  errorMessage,
  onRetry,
  onClose,
}: CliUnavailableDialogProps) {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const dialogContent = (
    <div className="dialog-overlay" onClick={handleOverlayClick}>
      <div className="dialog-content dialog-content--warning">
        <div className="dialog-header">
          <h2>⚠️ CLI Backend Unavailable</h2>
          <button className="dialog-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="dialog-body">
          <p className="dialog-message">
            The FiberPath CLI backend is not available. File operations
            (planning, simulation, export) cannot be performed until the CLI is
            detected.
          </p>

          {errorMessage && (
            <div className="dialog-error-details">
              <strong>Error details:</strong>
              <code>{errorMessage}</code>
            </div>
          )}

          <div className="dialog-help-section">
            <h3>Troubleshooting Steps:</h3>
            <ol>
              <li>
                Ensure the <code>fiberpath</code> CLI is installed
              </li>
              <li>Verify it's accessible from your system PATH</li>
              <li>
                Try running <code>fiberpath --version</code> in a terminal
              </li>
              <li>
                Reinstall the FiberPath package if needed:{" "}
                <code>pip install fiberpath</code>
              </li>
            </ol>
          </div>

          {version && (
            <p className="dialog-hint">
              Last known CLI version: <code>{version}</code>
            </p>
          )}
        </div>

        <div className="dialog-footer">
          <button className="btn btn--primary" onClick={onRetry}>
            Retry Connection
          </button>
          <button className="btn btn--secondary" onClick={onClose}>
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
