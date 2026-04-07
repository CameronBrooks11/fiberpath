/**
 * ConnectionSection - Serial port selection and connection management
 *
 * Features:
 * - Port selector dropdown
 * - Refresh ports button
 * - Baud rate selector
 * - Connect/Disconnect button
 * - Connection status indicator
 */

import { useState, useEffect } from "react";
import { RefreshCw, Circle } from "lucide-react";
import { useStreamStore } from "../../stores/streamStore";
import { useToastStore } from "../../stores/toastStore";
import {
  listSerialPorts,
  startInteractive,
  connectMarlin,
  disconnectMarlin,
} from "../../lib/marlin-api";
import { TOAST_DURATION_ERROR_MS } from "../../lib/constants";
import { toastMessages } from "../../lib/toastMessages";
import "./ConnectionSection.css";

export function ConnectionSection() {
  const {
    status,
    selectedPort,
    baudRate,
    availablePorts,
    setStatus,
    setSelectedPort,
    setBaudRate,
    setAvailablePorts,
    addLogEntry,
    clearStreamingState,
  } = useStreamStore();

  const { addToast } = useToastStore();
  const [refreshing, setRefreshing] = useState(false);

  // Load ports on mount
  useEffect(() => {
    refreshPorts();
  }, []);

  const refreshPorts = async () => {
    setRefreshing(true);
    try {
      const ports = await listSerialPorts();
      setAvailablePorts(ports);

      // Auto-select first port if none selected
      if (!selectedPort && ports.length > 0) {
        setSelectedPort(ports[0].port);
      }

      if (ports.length === 0) {
        addToast({
          type: "warning",
          message: toastMessages.connection.noPortsFound(),
        });
      }
    } catch (error) {
      addLogEntry({
        type: "error",
        content: `Failed to list ports: ${error}`,
      });
      addToast({
        type: "error",
        message: toastMessages.connection.listPortsFailed(String(error)),
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedPort) {
      addLogEntry({
        type: "error",
        content: "Please select a port",
      });
      addToast({
        type: "error",
        message: toastMessages.connection.noPortSelected(),
      });
      return;
    }

    setStatus("connecting");
    addLogEntry({
      type: "info",
      content: `Connecting to ${selectedPort} at ${baudRate} baud...`,
    });

    try {
      // Start the interactive subprocess first
      await startInteractive();

      // Connect to the selected port
      await connectMarlin(selectedPort, baudRate);

      setStatus("connected");
      addLogEntry({
        type: "info",
        content: `Connected to ${selectedPort} at ${baudRate} baud`,
      });
      addToast({
        type: "success",
        message: toastMessages.connection.success(selectedPort),
      });

      // Clear any previous streaming state (file selection, progress)
      // This ensures a fresh start after reconnecting
      clearStreamingState();
    } catch (error) {
      setStatus("disconnected");
      const errorMsg = String(error);
      addLogEntry({
        type: "error",
        content: `Connection failed: ${errorMsg}`,
      });
      addToast({
        type: "error",
        message: toastMessages.connection.failed(errorMsg),
        duration: TOAST_DURATION_ERROR_MS,
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectMarlin();
      setStatus("disconnected");
      addLogEntry({
        type: "info",
        content: "Disconnected",
      });
      addToast({
        type: "info",
        message: toastMessages.connection.disconnected(),
      });
    } catch (error) {
      const errorMsg = String(error);
      addLogEntry({
        type: "error",
        content: `Disconnect failed: ${errorMsg}`,
      });
      addToast({
        type: "error",
        message: `Disconnect failed: ${errorMsg}`,
      });
    }
  };

  const getStatusTone = () => {
    switch (status) {
      case "connected":
        return "connected";
      case "connecting":
        return "connecting";
      case "paused":
        return "paused";
      case "disconnected":
      default:
        return "disconnected";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "connected":
        return `Connected to ${selectedPort}`;
      case "connecting":
        return "Connecting...";
      case "paused":
        return "Paused";
      case "disconnected":
      default:
        return "Disconnected";
    }
  };

  return (
    <section className="connection-section panel panel--compact">
      <h3 className="panel-title">Connection</h3>

      <div className="connection-row">
        <label htmlFor="port-select" className="connection-label">
          Port
        </label>
        <div className="port-select-group">
          <select
            id="port-select"
            value={selectedPort || ""}
            onChange={(e) => setSelectedPort(e.target.value)}
            disabled={status !== "disconnected"}
            className="param-form__select connection-select"
          >
            {availablePorts.length === 0 ? (
              <option value="">No ports found</option>
            ) : (
              availablePorts.map((port) => (
                <option key={port.port} value={port.port}>
                  {port.port} - {port.description}
                </option>
              ))
            )}
          </select>
          <button
            onClick={refreshPorts}
            disabled={refreshing || status !== "disconnected"}
            className="btn btn--secondary btn--icon-only"
            title="Refresh ports"
            aria-label="Refresh serial ports"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "stream-icon-spin" : undefined}
            />
          </button>
        </div>
      </div>

      <div className="connection-row">
        <label htmlFor="baud-select" className="connection-label">
          Baud
        </label>
        <select
          id="baud-select"
          value={baudRate}
          onChange={(e) => setBaudRate(Number(e.target.value))}
          disabled={status !== "disconnected"}
          className="param-form__select connection-select"
        >
          <option value={115200}>115200</option>
          <option value={250000}>250000</option>
          <option value={500000}>500000</option>
        </select>
      </div>

      <div className={`connection-status connection-status--${getStatusTone()}`}>
        <Circle
          size={12}
          fill="currentColor"
          color="currentColor"
          className="connection-status__dot"
        />
        <span className="connection-status__text">{getStatusText()}</span>
      </div>

      {status === "disconnected" ? (
        <button
          onClick={handleConnect}
          disabled={!selectedPort || availablePorts.length === 0}
          className="btn btn--primary connection-action-button"
          title="Connect to the selected serial port"
        >
          Connect
        </button>
      ) : (
        <button
          onClick={handleDisconnect}
          disabled={status === "connecting"}
          className="btn btn--secondary connection-action-button"
          title="Disconnect from the current device"
        >
          Disconnect
        </button>
      )}
    </section>
  );
}
