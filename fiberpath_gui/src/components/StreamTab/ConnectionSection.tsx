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
    } catch (error) {
      addLogEntry({
        type: 'error',
        content: `Failed to list ports: ${error}`,
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
      return;
    }

    setStatus('connecting');
    
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
    } catch (error) {
      setStatus('disconnected');
      addLogEntry({
        type: 'error',
        content: `Connection failed: ${error}`,
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
    } catch (error) {
      addLogEntry({
        type: 'error',
        content: `Disconnect failed: ${error}`,
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
