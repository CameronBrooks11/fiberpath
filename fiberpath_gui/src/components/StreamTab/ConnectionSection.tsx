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

import { useState, useEffect } from 'react';
import { RefreshCw, Circle } from 'lucide-react';
import { useStreamStore } from '../../stores/streamStore';
import { useToastStore } from '../../stores/toastStore';
import { 
  listSerialPorts, 
  startInteractive, 
  connectMarlin, 
  disconnectMarlin 
} from '../../lib/marlin-api';
import './ConnectionSection.css';

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
          type: 'warning',
          message: 'No serial ports found. Check your connections.',
        });
      }
    } catch (error) {
      addLogEntry({
        type: 'error',
        content: `Failed to list ports: ${error}`,
      });
      addToast({
        type: 'error',
        message: `Failed to list ports: ${error}`,
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedPort) {
      addLogEntry({
        type: 'error',
        content: 'Please select a port',
      });
      addToast({
        type: 'error',
        message: 'Please select a serial port before connecting',
      });
      return;
    }

    setStatus('connecting');
    addLogEntry({
      type: 'info',
      content: `Connecting to ${selectedPort} at ${baudRate} baud...`,
    });
    
    try {
      // Start the interactive subprocess first
      await startInteractive();
      
      // Connect to the selected port
      await connectMarlin(selectedPort, baudRate);
      
      setStatus('connected');
      addLogEntry({
        type: 'info',
        content: `Connected to ${selectedPort} at ${baudRate} baud`,
      });
      addToast({
        type: 'success',
        message: `Connected to ${selectedPort}`,
      });
    } catch (error) {
      setStatus('disconnected');
      const errorMsg = String(error);
      addLogEntry({
        type: 'error',
        content: `Connection failed: ${errorMsg}`,
      });
      addToast({
        type: 'error',
        message: `Connection failed: ${errorMsg}`,
        duration: 6000,
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectMarlin();
      setStatus('disconnected');
      addLogEntry({
        type: 'info',
        content: 'Disconnected',
      });
      addToast({
        type: 'info',
        message: 'Disconnected from device',
      });
    } catch (error) {
      const errorMsg = String(error);
      addLogEntry({
        type: 'error',
        content: `Disconnect failed: ${errorMsg}`,
      });
      addToast({
        type: 'error',
        message: `Disconnect failed: ${errorMsg}`,
      });
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return '#22c55e'; // green
      case 'connecting':
        return '#f97316'; // orange
      case 'paused':
        return '#eab308'; // yellow
      case 'disconnected':
      default:
        return '#ef4444'; // red
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return `Connected to ${selectedPort}`;
      case 'connecting':
        return 'Connecting...';
      case 'paused':
        return 'Paused';
      case 'disconnected':
      default:
        return 'Disconnected';
    }
  };

  return (
    <div className="connection-section">
      <h3 className="section-title">CONNECTION</h3>
      
      <div className="connection-row">
        <label htmlFor="port-select">Port:</label>
        <div className="port-select-group">
          <select
            id="port-select"
            value={selectedPort || ''}
            onChange={(e) => setSelectedPort(e.target.value)}
            disabled={status !== 'disconnected'}
            className="port-select"
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
            disabled={refreshing || status !== 'disconnected'}
            className="refresh-button"
            title="Refresh ports"
          >
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      <div className="connection-row">
        <label htmlFor="baud-select">Baud:</label>
        <select
          id="baud-select"
          value={baudRate}
          onChange={(e) => setBaudRate(Number(e.target.value))}
          disabled={status !== 'disconnected'}
          className="baud-select"
        >
          <option value={115200}>115200</option>
          <option value={250000}>250000</option>
          <option value={500000}>500000</option>
        </select>
      </div>

      <div className="status-row">
        <Circle 
          size={12} 
          fill={getStatusColor()} 
          color={getStatusColor()} 
        />
        <span className="status-text">{getStatusText()}</span>
      </div>

      {status === 'disconnected' ? (
        <button
          onClick={handleConnect}
          disabled={!selectedPort || availablePorts.length === 0}
          className="connect-button"
        >
          Connect
        </button>
      ) : (
        <button
          onClick={handleDisconnect}
          disabled={status === 'connecting'}
          className="disconnect-button"
        >
          Disconnect
        </button>
      )}
    </div>
  );
}
