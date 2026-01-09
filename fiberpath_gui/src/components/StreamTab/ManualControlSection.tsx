/**
 * ManualControlSection - Manual G-code command input and common commands
 *
 * Features:
 * - Common command buttons (Home, Get Position, E-Stop, Disable Motors)
 * - Manual command input field
 * - Send button with loading state
 * - Disabled when not connected
 */

import { useState, KeyboardEvent } from "react";
import { Home, MapPin, AlertOctagon, Power, Send } from "lucide-react";
import { useStreamStore } from "../../stores/streamStore";
import { useToastStore } from "../../stores/toastStore";
import { sendCommand } from "../../lib/marlin-api";
import { TOAST_DURATION_ERROR_MS } from "../../lib/constants";
import { toastMessages } from "../../lib/toastMessages";
import "./ManualControlSection.css";

export function ManualControlSection() {
  const { status, commandLoading, setCommandLoading, addLogEntry } =
    useStreamStore();

  const { addToast } = useToastStore();
  const [commandInput, setCommandInput] = useState("");

  const isConnected = status === "connected" || status === "paused";

  const handleSendCommand = async (gcode: string) => {
    if (!gcode.trim() || !isConnected || commandLoading) {
      return;
    }

    setCommandLoading(true);

    // Add command to log
    addLogEntry({
      type: "command",
      content: gcode,
    });

    try {
      const responses = await sendCommand(gcode);

      // Add responses to log
      responses.forEach((response) => {
        addLogEntry({
          type: "response",
          content: response,
        });
      });

      // Show success toast for important commands
      if (gcode === "G28") {
        addToast({
          type: "success",
          message: toastMessages.command.homingComplete(),
        });
      } else if (gcode === "M112") {
        addToast({
          type: "warning",
          message: toastMessages.command.emergencyStop(),
          duration: TOAST_DURATION_ERROR_MS,
        });
      }
    } catch (error) {
      const errorMsg = String(error);
      addLogEntry({
        type: "error",
        content: `Command failed: ${errorMsg}`,
      });
      addToast({
        type: "error",
        message: toastMessages.command.failed(errorMsg),
      });
    } finally {
      setCommandLoading(false);
    }
  };

  const handleManualSend = async () => {
    if (commandInput.trim()) {
      await handleSendCommand(commandInput.trim());
      setCommandInput(""); // Clear input after sending
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleManualSend();
    }
  };

  return (
    <div className="manual-control-section">
      <h3 className="section-title">MANUAL CONTROL</h3>

      <div className="common-commands">
        <button
          onClick={() => handleSendCommand("G28")}
          disabled={!isConnected || commandLoading}
          className="command-button"
          title="Home all axes (G28)"
        >
          <Home size={18} />
          <span>Home</span>
        </button>

        <button
          onClick={() => handleSendCommand("M114")}
          disabled={!isConnected || commandLoading}
          className="command-button"
          title="Get current position (M114)"
        >
          <MapPin size={18} />
          <span>Get Pos</span>
        </button>

        <button
          onClick={() => handleSendCommand("M112")}
          disabled={!isConnected || commandLoading}
          className="command-button emergency-stop"
          title="Emergency stop (M112)"
        >
          <AlertOctagon size={18} />
          <span>E-Stop</span>
        </button>

        <button
          onClick={() => handleSendCommand("M18")}
          disabled={!isConnected || commandLoading}
          className="command-button"
          title="Disable stepper motors (M18)"
        >
          <Power size={18} />
          <span>Motors</span>
        </button>
      </div>

      <div className="manual-input-group">
        <label htmlFor="command-input">Command:</label>
        <div className="input-row">
          <input
            id="command-input"
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter G-code command (e.g., G0 X10 Y20)"
            disabled={!isConnected || commandLoading}
            className="command-input"
          />
          <button
            onClick={handleManualSend}
            disabled={!isConnected || commandLoading || !commandInput.trim()}
            className="send-button"
            title="Send command"
          >
            {commandLoading ? <div className="spinner" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
