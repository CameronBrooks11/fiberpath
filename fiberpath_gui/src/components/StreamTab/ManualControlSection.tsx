/**
 * ManualControlSection - Manual G-code command input and common commands
 *
 * Features:
 * - Common command buttons (Home, Get Position, E-Stop, Disable Motors)
 * - Manual command input field
 * - Send button with loading state
 * - Disabled when not connected
 */

import { KeyboardEvent } from "react";
import { Home, MapPin, AlertOctagon, Power, Send } from "lucide-react";
import { useManualCommandActions } from "../../hooks/stream/useManualCommandActions";
import "./ManualControlSection.css";

export function ManualControlSection() {
  const {
    commandInput,
    setCommandInput,
    commandLoading,
    manualControlsEnabled,
    handleSendCommand,
    handleManualSend,
  } = useManualCommandActions();

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleManualSend();
    }
  };

  return (
    <section className="manual-control-section panel panel--compact">
      <h3 className="panel-title">Manual Control</h3>

      <div className="common-commands">
        <button
          onClick={() => handleSendCommand("G28")}
          disabled={!manualControlsEnabled || commandLoading}
          className="btn btn--secondary manual-command-button"
          title="Home all axes (G28)"
        >
          <Home size={18} />
          <span>Home</span>
        </button>

        <button
          onClick={() => handleSendCommand("M114")}
          disabled={!manualControlsEnabled || commandLoading}
          className="btn btn--secondary manual-command-button"
          title="Get current position (M114)"
        >
          <MapPin size={18} />
          <span>Get Pos</span>
        </button>

        <button
          onClick={() => handleSendCommand("M112")}
          disabled={!manualControlsEnabled || commandLoading}
          className="btn btn--danger manual-command-button"
          title="Emergency stop (M112) - WARNING: Will disconnect controller"
        >
          <AlertOctagon size={18} />
          <span>E-Stop</span>
        </button>

        <button
          onClick={() => handleSendCommand("M18")}
          disabled={!manualControlsEnabled || commandLoading}
          className="btn btn--secondary manual-command-button"
          title="Disable stepper motors (M18)"
        >
          <Power size={18} />
          <span>Motors</span>
        </button>
      </div>

      <div className="manual-input-group">
        <label htmlFor="command-input" className="param-form__label manual-command-label">
          Command
        </label>
        <div className="input-row">
          <input
            id="command-input"
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter G-code command (e.g., G0 X10 A20)"
            disabled={!manualControlsEnabled || commandLoading}
            className="param-form__input text-mono manual-command-input"
          />
          <button
            onClick={handleManualSend}
            disabled={!manualControlsEnabled || commandLoading || !commandInput.trim()}
            className="btn btn--primary manual-send-button"
            title="Send command"
          >
            {commandLoading ? <div className="stream-loading-spinner" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </section>
  );
}
