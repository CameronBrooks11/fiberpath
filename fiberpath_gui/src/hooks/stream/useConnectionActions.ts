import { useState } from "react";
import { useStreamStore } from "../../stores/streamStore";
import { useToastStore } from "../../stores/toastStore";
import {
  listSerialPorts,
  startInteractive,
  connectMarlin,
  disconnectMarlin,
} from "../../lib/marlin-api";
import { createStreamFeedback } from "../../lib/streamFeedback";

export function useConnectionActions() {
  const {
    selectedPort,
    baudRate,
    setSelectedPort,
    setAvailablePorts,
    addLogEntry,
    markConnecting,
    markConnected,
    markDisconnected,
    clearStreamingState,
  } = useStreamStore();
  const { addToast } = useToastStore();

  const feedback = createStreamFeedback({ addLogEntry, addToast });
  const [refreshing, setRefreshing] = useState(false);

  const refreshPorts = async () => {
    setRefreshing(true);
    try {
      const ports = await listSerialPorts();
      setAvailablePorts(ports);

      if (!selectedPort && ports.length > 0) {
        setSelectedPort(ports[0].port);
      }

      if (ports.length === 0) {
        feedback.connection.noPortsFound();
      }
    } catch (error) {
      feedback.connection.listPortsFailed(String(error));
    } finally {
      setRefreshing(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedPort) {
      feedback.connection.noPortSelected();
      return;
    }

    markConnecting();
    feedback.connection.connecting(selectedPort, baudRate);

    try {
      await startInteractive();
      await connectMarlin(selectedPort, baudRate);
      markConnected();
      feedback.connection.connected(selectedPort, baudRate);
      clearStreamingState();
    } catch (error) {
      markDisconnected();
      feedback.connection.failed(String(error));
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectMarlin();
      markDisconnected();
      clearStreamingState();
      feedback.connection.disconnected();
    } catch (error) {
      feedback.connection.disconnectFailed(String(error));
    }
  };

  return {
    refreshing,
    refreshPorts,
    handleConnect,
    handleDisconnect,
  };
}
