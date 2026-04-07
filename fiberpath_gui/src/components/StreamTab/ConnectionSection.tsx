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

import { useEffect } from "react";
import { RefreshCw, Circle } from "lucide-react";
import { useStreamStore } from "../../stores/streamStore";
import { useConnectionActions } from "../../hooks/stream/useConnectionActions";
import "./ConnectionSection.css";

export function ConnectionSection() {
  const {
    status,
    selectedPort,
    baudRate,
    availablePorts,
    setSelectedPort,
    setBaudRate,
  } = useStreamStore();
  const { refreshing, refreshPorts, handleConnect, handleDisconnect } =
    useConnectionActions();

  // Load ports on mount
  useEffect(() => {
    void refreshPorts();
  }, []);

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
