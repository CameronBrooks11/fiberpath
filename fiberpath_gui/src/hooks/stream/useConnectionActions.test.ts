import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConnectionActions } from './useConnectionActions';
import { resetStores } from '../../tests/storeUtils';
import { useStreamStore } from '../../stores/streamStore';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockListSerialPorts = vi.fn();
const mockStartInteractive = vi.fn().mockResolvedValue(undefined);
const mockConnectMarlin = vi.fn().mockResolvedValue(undefined);
const mockDisconnectMarlin = vi.fn().mockResolvedValue(undefined);

vi.mock('../../lib/marlin-api', () => ({
  listSerialPorts: (...a: unknown[]) => mockListSerialPorts(...a),
  startInteractive: (...a: unknown[]) => mockStartInteractive(...a),
  connectMarlin: (...a: unknown[]) => mockConnectMarlin(...a),
  disconnectMarlin: (...a: unknown[]) => mockDisconnectMarlin(...a),
}));

const mockFeedback = {
  connection: {
    noPortsFound: vi.fn(),
    listPortsFailed: vi.fn(),
    noPortSelected: vi.fn(),
    connecting: vi.fn(),
    connected: vi.fn(),
    failed: vi.fn(),
    disconnected: vi.fn(),
    disconnectFailed: vi.fn(),
  },
};

vi.mock('../../lib/streamFeedback', () => ({
  createStreamFeedback: () => mockFeedback,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  resetStores();
  mockListSerialPorts.mockResolvedValue([]);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('useConnectionActions', () => {
  describe('initial state', () => {
    it('starts with refreshing = false', () => {
      const { result } = renderHook(() => useConnectionActions());
      expect(result.current.refreshing).toBe(false);
    });
  });

  describe('refreshPorts', () => {
    it('sets available ports from listSerialPorts', async () => {
      const ports = [
        { port: '/dev/ttyUSB0', description: 'Arduino' },
        { port: '/dev/ttyUSB1', description: 'Unknown' },
      ];
      mockListSerialPorts.mockResolvedValue(ports);

      const { result } = renderHook(() => useConnectionActions());
      await act(async () => {
        await result.current.refreshPorts();
      });

      expect(useStreamStore.getState().availablePorts).toEqual(ports);
    });

    it('auto-selects first port when none is selected', async () => {
      const ports = [{ port: '/dev/ttyUSB0', description: 'Arduino' }];
      mockListSerialPorts.mockResolvedValue(ports);

      const { result } = renderHook(() => useConnectionActions());
      await act(async () => {
        await result.current.refreshPorts();
      });

      expect(useStreamStore.getState().selectedPort).toBe('/dev/ttyUSB0');
    });

    it('does not override selectedPort if already set', async () => {
      useStreamStore.setState({ selectedPort: '/dev/ttyUSB1' });
      const ports = [
        { port: '/dev/ttyUSB0', description: 'Arduino' },
        { port: '/dev/ttyUSB1', description: 'Known' },
      ];
      mockListSerialPorts.mockResolvedValue(ports);

      const { result } = renderHook(() => useConnectionActions());
      await act(async () => {
        await result.current.refreshPorts();
      });

      expect(useStreamStore.getState().selectedPort).toBe('/dev/ttyUSB1');
    });

    it('calls feedback.connection.noPortsFound when no ports found', async () => {
      mockListSerialPorts.mockResolvedValue([]);
      const { result } = renderHook(() => useConnectionActions());
      await act(async () => {
        await result.current.refreshPorts();
      });
      expect(mockFeedback.connection.noPortsFound).toHaveBeenCalledTimes(1);
    });

    it('calls feedback.connection.listPortsFailed on error', async () => {
      mockListSerialPorts.mockRejectedValue(new Error('Serial bus error'));
      const { result } = renderHook(() => useConnectionActions());
      await act(async () => {
        await result.current.refreshPorts();
      });
      expect(mockFeedback.connection.listPortsFailed).toHaveBeenCalledTimes(1);
    });

    it('resets refreshing to false after success', async () => {
      mockListSerialPorts.mockResolvedValue([]);
      const { result } = renderHook(() => useConnectionActions());
      await act(async () => {
        await result.current.refreshPorts();
      });
      expect(result.current.refreshing).toBe(false);
    });

    it('resets refreshing to false after error', async () => {
      mockListSerialPorts.mockRejectedValue(new Error('fail'));
      const { result } = renderHook(() => useConnectionActions());
      await act(async () => {
        await result.current.refreshPorts();
      });
      expect(result.current.refreshing).toBe(false);
    });
  });

  describe('handleConnect', () => {
    it('calls noPortSelected and returns early when no port is selected', async () => {
      useStreamStore.setState({ selectedPort: null });
      const { result } = renderHook(() => useConnectionActions());
      await act(async () => {
        await result.current.handleConnect();
      });
      expect(mockFeedback.connection.noPortSelected).toHaveBeenCalledTimes(1);
      expect(mockStartInteractive).not.toHaveBeenCalled();
    });

    it('marks connected and calls connected feedback on success', async () => {
      useStreamStore.setState({ selectedPort: '/dev/ttyUSB0', baudRate: 115200 });
      const { result } = renderHook(() => useConnectionActions());
      await act(async () => {
        await result.current.handleConnect();
      });
      expect(useStreamStore.getState().status).toBe('connected');
      expect(mockFeedback.connection.connected).toHaveBeenCalledTimes(1);
    });

    it('marks disconnected and calls failed feedback on error', async () => {
      useStreamStore.setState({ selectedPort: '/dev/ttyUSB0' });
      mockConnectMarlin.mockRejectedValue(new Error('port in use'));
      const { result } = renderHook(() => useConnectionActions());
      await act(async () => {
        await result.current.handleConnect();
      });
      expect(useStreamStore.getState().status).toBe('disconnected');
      expect(mockFeedback.connection.failed).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleDisconnect', () => {
    it('marks disconnected and calls disconnected feedback on success', async () => {
      useStreamStore.setState({ status: 'connected', selectedPort: '/dev/ttyUSB0' });
      const { result } = renderHook(() => useConnectionActions());
      await act(async () => {
        await result.current.handleDisconnect();
      });
      expect(useStreamStore.getState().status).toBe('disconnected');
      expect(mockFeedback.connection.disconnected).toHaveBeenCalledTimes(1);
    });

    it('calls disconnectFailed feedback on error', async () => {
      mockDisconnectMarlin.mockRejectedValue(new Error('already disconnected'));
      const { result } = renderHook(() => useConnectionActions());
      await act(async () => {
        await result.current.handleDisconnect();
      });
      expect(mockFeedback.connection.disconnectFailed).toHaveBeenCalledTimes(1);
    });
  });
});
