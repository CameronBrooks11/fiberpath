import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConnectionSection } from './ConnectionSection';
import { useStreamStore } from '../../stores/streamStore';
import { resetStores } from '../../tests/storeUtils';

// Mock the hook so no live Tauri calls happen
const mockRefreshPorts = vi.fn().mockResolvedValue(undefined);
const mockHandleConnect = vi.fn().mockResolvedValue(undefined);
const mockHandleDisconnect = vi.fn().mockResolvedValue(undefined);

const hookDefaults = {
  refreshing: false,
  refreshPorts: mockRefreshPorts,
  handleConnect: mockHandleConnect,
  handleDisconnect: mockHandleDisconnect,
};

let hookReturn = { ...hookDefaults };

vi.mock('../../hooks/stream/useConnectionActions', () => ({
  useConnectionActions: () => hookReturn,
}));

beforeEach(() => {
  hookReturn = { ...hookDefaults };
  vi.clearAllMocks();
  resetStores();
});

describe('ConnectionSection', () => {
  it('renders the Connection heading', () => {
    render(<ConnectionSection />);
    expect(screen.getByText('Connection')).toBeInTheDocument();
  });

  it('calls refreshPorts on mount', () => {
    render(<ConnectionSection />);
    expect(mockRefreshPorts).toHaveBeenCalledTimes(1);
  });

  it('shows "No ports found" when availablePorts is empty', () => {
    render(<ConnectionSection />);
    expect(screen.getByText('No ports found')).toBeInTheDocument();
  });

  it('renders a port option for each available port', () => {
    useStreamStore.setState({
      availablePorts: [
        { port: '/dev/ttyUSB0', description: 'Arduino' },
        { port: '/dev/ttyUSB1', description: 'Unknown' },
      ],
      selectedPort: '/dev/ttyUSB0',
    } as any);
    render(<ConnectionSection />);
    expect(screen.getByText(/\/dev\/ttyUSB0/)).toBeInTheDocument();
    expect(screen.getByText(/\/dev\/ttyUSB1/)).toBeInTheDocument();
  });

  it('shows "Disconnected" status text by default', () => {
    render(<ConnectionSection />);
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('shows "Connected" status text when connected', () => {
    useStreamStore.setState({ status: 'connected', selectedPort: '/dev/ttyUSB0' });
    render(<ConnectionSection />);
    expect(screen.getByText(/Connected to/)).toBeInTheDocument();
  });

  it('shows "Connecting..." status text when connecting', () => {
    useStreamStore.setState({ status: 'connecting' });
    render(<ConnectionSection />);
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('renders a Connect button when disconnected', () => {
    render(<ConnectionSection />);
    expect(screen.getByTitle(/Connect to the selected serial port/)).toBeInTheDocument();
  });

  it('renders a Disconnect button when connected', () => {
    useStreamStore.setState({ status: 'connected', selectedPort: '/dev/ttyUSB0' });
    render(<ConnectionSection />);
    expect(screen.getByTitle(/Disconnect from the current device/)).toBeInTheDocument();
  });

  it('port and baud selects are disabled when connected', () => {
    useStreamStore.setState({ status: 'connected', selectedPort: '/dev/ttyUSB0' });
    render(<ConnectionSection />);
    expect(screen.getByRole('combobox', { name: /Port/i })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: /Baud/i })).toBeDisabled();
  });

  it('calls handleConnect when Connect button is clicked', async () => {
    useStreamStore.setState({
      availablePorts: [{ port: '/dev/ttyUSB0', description: 'Arduino' }] as any,
      selectedPort: '/dev/ttyUSB0',
    });
    render(<ConnectionSection />);
    await userEvent.click(screen.getByTitle(/Connect to the selected serial port/));
    expect(mockHandleConnect).toHaveBeenCalledTimes(1);
  });

  it('calls handleDisconnect when Disconnect button is clicked', async () => {
    useStreamStore.setState({ status: 'connected', selectedPort: '/dev/ttyUSB0' });
    render(<ConnectionSection />);
    await userEvent.click(screen.getByTitle(/Disconnect from the current device/));
    expect(mockHandleDisconnect).toHaveBeenCalledTimes(1);
  });
});
