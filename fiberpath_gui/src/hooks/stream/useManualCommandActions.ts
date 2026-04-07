import { useState } from "react";
import { useStreamStore } from "../../stores/streamStore";
import { useToastStore } from "../../stores/toastStore";
import { sendCommand } from "../../lib/marlin-api";
import { createStreamFeedback } from "../../lib/streamFeedback";

export function useManualCommandActions() {
  const {
    status,
    isStreaming,
    commandLoading,
    setCommandLoading,
    addLogEntry,
  } = useStreamStore();
  const { addToast } = useToastStore();

  const feedback = createStreamFeedback({ addLogEntry, addToast });
  const [commandInput, setCommandInput] = useState("");

  const isConnected = status === "connected" || status === "paused";
  const manualControlsEnabled =
    isConnected && (!isStreaming || status === "paused");

  const handleSendCommand = async (gcode: string) => {
    if (!gcode.trim() || !isConnected || commandLoading) {
      return;
    }

    setCommandLoading(true);
    feedback.command.issued(gcode);

    try {
      const responses = await sendCommand(gcode);
      responses.forEach((response) => {
        feedback.command.response(response);
      });

      if (gcode === "G28") {
        feedback.command.homingComplete();
      } else if (gcode === "M112") {
        feedback.command.emergencyStop();
      }
    } catch (error) {
      feedback.command.failed(String(error));
    } finally {
      setCommandLoading(false);
    }
  };

  const handleManualSend = async () => {
    const command = commandInput.trim();
    if (!command) {
      return;
    }

    await handleSendCommand(command);
    setCommandInput("");
  };

  return {
    commandInput,
    setCommandInput,
    commandLoading,
    manualControlsEnabled,
    handleSendCommand,
    handleManualSend,
  };
}
