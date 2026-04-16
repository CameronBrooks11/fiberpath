import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useManualCommandActions } from './useManualCommandActions';
import { resetStores } from '../../tests/storeUtils';
import { useStreamStore } from '../../stores/streamStore';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockSendCommand = vi.fn();

vi.mock('../../lib/marlin-api', () => ({
  sendCommand: (...a: unknown[]) => mockSendCommand(...a),
}));

const mockFeedback = {
  command: {
    issued: vi.fn(),
    response: vi.fn(),
    homingComplete: vi.fn(),
    emergencyStop: vi.fn(),
    failed: vi.fn(),
  },
};

vi.mock('../../lib/streamFeedback', () => ({
  createStreamFeedback: () => mockFeedback,
}));

// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  resetStores();
  mockSendCommand.mockResolvedValue(['ok']);
});

// ---------------------------------------------------------------------------
describe('useManualCommandActions', () => {
  describe('initial state', () => {
    it('starts with empty commandInput and commandLoading=false', () => {
      const { result } = renderHook(() => useManualCommandActions());
      expect(result.current.commandInput).toBe('');
      expect(result.current.commandLoading).toBe(false);
    });
  });

  describe('manualControlsEnabled', () => {
    it('is false when status is disconnected', () => {
      useStreamStore.setState({ status: 'disconnected' });
      const { result } = renderHook(() => useManualCommandActions());
      expect(result.current.manualControlsEnabled).toBe(false);
    });

    it('is true when status is connected and not streaming', () => {
      useStreamStore.setState({ status: 'connected', isStreaming: false });
      const { result } = renderHook(() => useManualCommandActions());
      expect(result.current.manualControlsEnabled).toBe(true);
    });

    it('is false when connected and actively streaming (status=connected)', () => {
      useStreamStore.setState({ status: 'connected', isStreaming: true });
      const { result } = renderHook(() => useManualCommandActions());
      expect(result.current.manualControlsEnabled).toBe(false);
    });

    it('is true when status is paused even if isStreaming=true', () => {
      useStreamStore.setState({ status: 'paused', isStreaming: true });
      const { result } = renderHook(() => useManualCommandActions());
      expect(result.current.manualControlsEnabled).toBe(true);
    });
  });

  describe('handleSendCommand', () => {
    it('returns early for empty/whitespace gcode', async () => {
      useStreamStore.setState({ status: 'connected' });
      const { result } = renderHook(() => useManualCommandActions());
      await act(async () => {
        await result.current.handleSendCommand('   ');
      });
      expect(mockSendCommand).not.toHaveBeenCalled();
    });

    it('returns early when not connected', async () => {
      useStreamStore.setState({ status: 'disconnected' });
      const { result } = renderHook(() => useManualCommandActions());
      await act(async () => {
        await result.current.handleSendCommand('G28');
      });
      expect(mockSendCommand).not.toHaveBeenCalled();
    });

    it('returns early when commandLoading is true', async () => {
      useStreamStore.setState({ status: 'connected', commandLoading: true });
      const { result } = renderHook(() => useManualCommandActions());
      await act(async () => {
        await result.current.handleSendCommand('G28');
      });
      expect(mockSendCommand).not.toHaveBeenCalled();
    });

    it('calls sendCommand and emits response on success', async () => {
      useStreamStore.setState({ status: 'connected' });
      mockSendCommand.mockResolvedValue(['ok', 'T:200']);
      const { result } = renderHook(() => useManualCommandActions());
      await act(async () => {
        await result.current.handleSendCommand('M105');
      });
      expect(mockFeedback.command.issued).toHaveBeenCalledWith('M105');
      expect(mockFeedback.command.response).toHaveBeenCalledTimes(2);
    });

    it('calls homingComplete feedback for G28', async () => {
      useStreamStore.setState({ status: 'connected' });
      const { result } = renderHook(() => useManualCommandActions());
      await act(async () => {
        await result.current.handleSendCommand('G28');
      });
      expect(mockFeedback.command.homingComplete).toHaveBeenCalledTimes(1);
    });

    it('calls emergencyStop feedback for M112', async () => {
      useStreamStore.setState({ status: 'connected' });
      const { result } = renderHook(() => useManualCommandActions());
      await act(async () => {
        await result.current.handleSendCommand('M112');
      });
      expect(mockFeedback.command.emergencyStop).toHaveBeenCalledTimes(1);
    });

    it('calls failed feedback and resets commandLoading on error', async () => {
      useStreamStore.setState({ status: 'connected' });
      mockSendCommand.mockRejectedValue(new Error('timeout'));
      const { result } = renderHook(() => useManualCommandActions());
      await act(async () => {
        await result.current.handleSendCommand('G1 X10');
      });
      expect(mockFeedback.command.failed).toHaveBeenCalledTimes(1);
      expect(result.current.commandLoading).toBe(false);
    });
  });

  describe('handleManualSend', () => {
    it('does nothing when commandInput is empty', async () => {
      useStreamStore.setState({ status: 'connected' });
      const { result } = renderHook(() => useManualCommandActions());
      // commandInput starts as ''
      await act(async () => {
        await result.current.handleManualSend();
      });
      expect(mockSendCommand).not.toHaveBeenCalled();
    });

    it('sends the commandInput and clears it on success', async () => {
      useStreamStore.setState({ status: 'connected' });
      const { result } = renderHook(() => useManualCommandActions());
      act(() => {
        result.current.setCommandInput('G28');
      });
      await act(async () => {
        await result.current.handleManualSend();
      });
      expect(mockSendCommand).toHaveBeenCalledWith('G28');
      expect(result.current.commandInput).toBe('');
    });
  });
});
