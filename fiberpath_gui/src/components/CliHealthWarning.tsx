import { useState } from "react";
import { useCliHealthContext } from "../contexts/CliHealthContext";
import { CliUnavailableDialog } from "./dialogs/CliUnavailableDialog";

/**
 * Component that displays a warning banner when the CLI backend is unavailable.
 * 
 * Shows a persistent banner at the top of the application alerting the user
 * that file operations are disabled. Provides a button to open the CLI
 * unavailable dialog with more details and troubleshooting steps.
 * 
 * @example
 * ```tsx
 * <CliHealthWarning />
 * ```
 */
export function CliHealthWarning() {
  const { isUnavailable, version, errorMessage, refresh } = useCliHealthContext();
  const [showDialog, setShowDialog] = useState(false);

  if (!isUnavailable) return null;

  return (
    <>
      <div className="cli-warning-banner">
        <div className="cli-warning-banner__content">
          <span className="cli-warning-banner__icon">⚠️</span>
          <div className="cli-warning-banner__text">
            <strong>CLI Backend Unavailable</strong>
            <span>File operations are currently disabled. The FiberPath CLI cannot be detected.</span>
          </div>
        </div>
        <div className="cli-warning-banner__actions">
          <button 
            className="btn btn--small btn--secondary" 
            onClick={refresh}
            title="Retry CLI connection"
          >
            Retry
          </button>
          <button 
            className="btn btn--small btn--ghost" 
            onClick={() => setShowDialog(true)}
            title="Show troubleshooting information"
          >
            Details
          </button>
        </div>
      </div>

      <CliUnavailableDialog
        isOpen={showDialog}
        version={version}
        errorMessage={errorMessage}
        onRetry={refresh}
        onClose={() => setShowDialog(false)}
      />
    </>
  );
}
