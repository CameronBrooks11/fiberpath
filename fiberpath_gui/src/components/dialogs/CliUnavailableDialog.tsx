import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useErrorNotification } from "../../contexts/ErrorNotificationContext";
import type { DialogBaseProps } from "../../types/components";
import { BaseDialog } from "./BaseDialog";
import "../../styles/dialogs.css";

interface CliUnavailableDialogProps extends DialogBaseProps {
  isOpen: boolean;
  version: string | null;
  errorMessage: string | null;
  onRetry: () => void;
}

interface CliDiagnostics {
  resourceDir: string;
  bundledPath: string;
  bundledExists: boolean;
  bundledIsFile: boolean;
  systemPath: string;
  actualCliUsed: string;
  platform: string;
  executionResult: string;
  executionExitCode: number | null;
}

export function CliUnavailableDialog({
  isOpen,
  version,
  errorMessage,
  onRetry,
  onClose,
}: CliUnavailableDialogProps) {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<CliDiagnostics | null>(null);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false);
  const { showError, showInfo } = useErrorNotification();

  const loadDiagnostics = async () => {
    setLoadingDiagnostics(true);
    try {
      const result = await invoke<CliDiagnostics>("get_cli_diagnostics");
      setDiagnostics(result);
      setShowDiagnostics(true);
    } catch (error) {
      const message = `Failed to load diagnostics: ${String(error)}`;
      console.error(message);
      showError(message);
    } finally {
      setLoadingDiagnostics(false);
    }
  };

  const copyDiagnostics = async () => {
    if (!diagnostics) {
      return;
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
      showInfo("Diagnostics copied to clipboard.");
    } catch (error) {
      showError(`Failed to copy diagnostics: ${String(error)}`);
    }
  };

  return (
    <BaseDialog
      isOpen={isOpen}
      title="⚠️ CLI Backend Unavailable"
      onClose={onClose}
      contentClassName="dialog-content--warning"
      footer={
        <>
          <button className="btn btn--primary" onClick={onRetry}>
            Retry Connection
          </button>
          <button className="btn btn--secondary" onClick={onClose}>
            Continue Anyway
          </button>
        </>
      }
    >
      <p className="dialog-message">
        The FiberPath CLI backend is not available. File operations (planning,
        simulation, export) cannot be performed until the CLI is detected.
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
          <li>Verify it&apos;s accessible from your system PATH</li>
          <li>
            Try running <code>fiberpath --version</code> in a terminal
          </li>
          <li>
            Reinstall the FiberPath package if needed: <code>pip install fiberpath</code>
          </li>
        </ol>
      </div>

      {version && (
        <p className="dialog-hint">
          Last known CLI version: <code>{version}</code>
        </p>
      )}

      {!showDiagnostics && (
        <div className="dialog-help-section">
          <button
            className="btn btn--ghost btn--small"
            onClick={loadDiagnostics}
            disabled={loadingDiagnostics}
          >
            {loadingDiagnostics ? "Loading..." : "🔍 Show Advanced Diagnostics"}
          </button>
        </div>
      )}

      {showDiagnostics && diagnostics && (
        <div className="dialog-diagnostics">
          <h3>Advanced Diagnostics</h3>

          <div className="diagnostic-section">
            <h4>Platform</h4>
            <p>
              <code>{diagnostics.platform}</code>
            </p>
          </div>

          <div className="diagnostic-section">
            <h4>Path Resolution</h4>
            <table className="diagnostic-table">
              <tbody>
                <tr>
                  <td>
                    <strong>Resource Dir:</strong>
                  </td>
                  <td>
                    <code>{diagnostics.resourceDir}</code>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Bundled Path:</strong>
                  </td>
                  <td>
                    <code>{diagnostics.bundledPath}</code>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Path Exists:</strong>
                  </td>
                  <td className={diagnostics.bundledExists ? "status-healthy" : "status-error"}>
                    {diagnostics.bundledExists ? "✓ Yes" : "✗ No"}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Is File:</strong>
                  </td>
                  <td className={diagnostics.bundledIsFile ? "status-healthy" : "status-error"}>
                    {diagnostics.bundledIsFile ? "✓ Yes" : "✗ No"}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>System PATH:</strong>
                  </td>
                  <td>
                    <code>{diagnostics.systemPath}</code>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Actual CLI Used:</strong>
                  </td>
                  <td>
                    <code>{diagnostics.actualCliUsed}</code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="diagnostic-section">
            <h4>Execution Test</h4>
            <table className="diagnostic-table">
              <tbody>
                <tr>
                  <td>
                    <strong>Result:</strong>
                  </td>
                  <td className={diagnostics.executionResult === "Success" ? "status-healthy" : "status-error"}>
                    {diagnostics.executionResult}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Exit Code:</strong>
                  </td>
                  <td>
                    <code>{diagnostics.executionExitCode ?? "N/A"}</code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <button className="btn btn--ghost btn--small" onClick={copyDiagnostics}>
            📋 Copy to Clipboard
          </button>
        </div>
      )}
    </BaseDialog>
  );
}
