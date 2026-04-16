import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStreamingActions } from './useStreamingActions';
import { resetStores } from '../../tests/storeUtils';
import { useStreamStore } from '../../stores/streamStore';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// vi.hoisted so mockOpenFn is available in the vi.mock factory
const { mockOpenFn } = vi.hoisted(() => ({ mockOpenFn: vi.fn() }));

vi.mock('@tauri-apps/plugin-dialog', () => ({ open: mockOpenFn }));

const mockStreamFile = vi.fn().mockResolvedValue(undefined);
const mockPauseStream = vi.fn().mockResolvedValue(undefined);
const mockResumeStream = vi.fn().mockResolvedValue(undefined);
const mockStopStream = vi.fn().mockResolvedValue(undefined);
const mockCancelStream = vi.fn().mockResolvedValue(undefined);

vi.mock('../../lib/marlin-api', () => ({
  streamFile: (...a: unknown[]) => mockStreamFile(...a),
  pauseStream: (...a: unknown[]) => mockPauseStream(...a),
  resumeStream: (...a: unknown[]) => mockResumeStream(...a),
  stopStream: (...a: unknown[]) => mockStopStream(...a),
  cancelStream: (...a: unknown[]) => mockCancelStream(...a),
}));

const mockFeedback = {
  file: {
    selected: vi.fn(),
    selectionFailed: vi.fn(),
    cleared: vi.fn(),
  },
  streaming: {
    startedToast: vi.fn(),
    startFailed: vi.fn(),
    paused: vi.fn(),
    pauseFailed: vi.fn(),
    resumed: vi.fn(),
    resumeFailed: vi.fn(),
    stopped: vi.fn(),
    stopFailed: vi.fn(),
    cancelled: vi.fn(),
    cancelFailed: vi.fn(),
  },
};

vi.mock('../../lib/streamFeedback', () => ({
  createStreamFeedback: () => mockFeedback,
}));

// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  resetStores();
});

function connected() {
  useStreamStore.setState({ status: 'connected' });
}

function paused() {
  useStreamStore.setState({ status: 'paused' });
}

// ---------------------------------------------------------------------------
describe('useStreamingActions', () => {
  describe('isConnected / isPaused', () => {
    it('isConnected is true when status is connected', () => {
      connected();
      const { result } = renderHook(() => useStreamingActions());
      expect(result.current.isConnected).toBe(true);
    });

    it('isConnected is true when status is paused', () => {
      paused();
      const { result } = renderHook(() => useStreamingActions());
      expect(result.current.isConnected).toBe(true);
    });

    it('isConnected is false when disconnected', () => {
      const { result } = renderHook(() => useStreamingActions());
      expect(result.current.isConnected).toBe(false);
    });

    it('isPaused is true only when status is paused', () => {
      paused();
      const { result } = renderHook(() => useStreamingActions());
      expect(result.current.isPaused).toBe(true);
    });
  });

  describe('handleSelectFile', () => {
    it('sets filePath and selectedFile on successful pick', async () => {
      connected();
      mockOpenFn.mockResolvedValue('/home/user/plan.gcode');
      const { result } = renderHook(() => useStreamingActions());
      await act(async () => {
        await result.current.handleSelectFile();
      });
      expect(mockFeedback.file.selected).toHaveBeenCalledWith('plan.gcode');
      expect(useStreamStore.getState().selectedFile).toBe('plan.gcode');
    });

    it('does nothing when the dialog is cancelled (returns null)', async () => {
      connected();
      mockOpenFn.mockResolvedValue(null);
      const { result } = renderHook(() => useStreamingActions());
      await act(async () => {
        await result.current.handleSelectFile();
      });
      expect(mockFeedback.file.selected).not.toHaveBeenCalled();
    });

    it('calls selectionFailed when open throws', async () => {
      connected();
      mockOpenFn.mockRejectedValue(new Error('dialog error'));
      const { result } = renderHook(() => useStreamingActions());
      await act(async () => {
        await result.current.handleSelectFile();
      });
      expect(mockFeedback.file.selectionFailed).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleClearFile', () => {
    it('clears selectedFile and calls feedback', async () => {
      connected();
      useStreamStore.setState({ selectedFile: 'plan.gcode' });
      const { result } = renderHook(() => useStreamingActions());
      act(() => {
        result.current.handleClearFile();
      });
      expect(useStreamStore.getState().selectedFile).toBeNull();
      expect(mockFeedback.file.cleared).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleStartStream', () => {
    it('calls streamFile and startedToast feedback on success', async () => {
      connected();
      mockOpenFn.mockResolvedValue('/path/to/file.gcode');
      const { result } = renderHook(() => useStreamingActions());

      // First select a file
      await act(async () => {
        await result.current.handleSelectFile();
      });
      // Then start stream
      await act(async () => {
        await result.current.handleStartStream();
      });

      expect(mockStreamFile).toHaveBeenCalledWith('/path/to/file.gcode');
      expect(mockFeedback.streaming.startedToast).toHaveBeenCalledTimes(1);
    });

    it('calls startFailed feedback when streamFile throws', async () => {
      connected();
      mockOpenFn.mockResolvedValue('/path/to/file.gcode');
      mockStreamFile.mockRejectedValue(new Error('stream error'));
      const { result } = renderHook(() => useStreamingActions());

      await act(async () => {
        await result.current.handleSelectFile();
      });
      await act(async () => {
        await result.current.handleStartStream();
      });

      expect(mockFeedback.streaming.startFailed).toHaveBeenCalledTimes(1);
    });

    it('returns early when no file is selected', async () => {
      connected();
      const { result } = renderHook(() => useStreamingActions());
      await act(async () => {
        await result.current.handleStartStream();
      });
      expect(mockStreamFile).not.toHaveBeenCalled();
    });

    it('returns early when not connected', async () => {
      mockOpenFn.mockResolvedValue('/path/file.gcode');
      const { result } = renderHook(() => useStreamingActions());
      await act(async () => {
        await result.current.handleStartStream();
      });
      expect(mockStreamFile).not.toHaveBeenCalled();
    });
  });

  describe('handlePause', () => {
    it('marks paused and calls paused feedback on success', async () => {
      connected();
      const { result } = renderHook(() => useStreamingActions());
      await act(async () => {
        await result.current.handlePause();
      });
      expect(useStreamStore.getState().status).toBe('paused');
      expect(mockFeedback.streaming.paused).toHaveBeenCalledTimes(1);
    });

    it('calls pauseFailed feedback on error', async () => {
      connected();
      mockPauseStream.mockRejectedValue(new Error('pause error'));
      const { result } = renderHook(() => useStreamingActions());
      await act(async () => {
        await result.current.handlePause();
      });
      expect(mockFeedback.streaming.pauseFailed).toHaveBeenCalledTimes(1);
    });

    it('returns early when streamControlLoading is true', async () => {
      useStreamStore.setState({ status: 'connected', streamControlLoading: true });
      const { result } = renderHook(() => useStreamingActions());
      await act(async () => {
        await result.current.handlePause();
      });
      expect(mockPauseStream).not.toHaveBeenCalled();
    });
  });

  describe('handleResume', () => {
    it('marks connected and calls resumed feedback on success', async () => {
      paused();
      const { result } = renderHook(() => useStreamingActions());
      await act(async () => {
        await result.current.handleResume();
      });
      expect(useStreamStore.getState().status).toBe('connected');
      expect(mockFeedback.streaming.resumed).toHaveBeenCalledTimes(1);
    });

    it('calls resumeFailed feedback on error', async () => {
      paused();
      mockResumeStream.mockRejectedValue(new Error('resume error'));
      const { result } = renderHook(() => useStreamingActions());
      await act(async () => {
        await result.current.handleResume();
      });
      expect(mockFeedback.streaming.resumeFailed).toHaveBeenCalledTimes(1);
    });

    it('returns early when streamControlLoading is true', async () => {
      useStreamStore.setState({ status: 'paused', streamControlLoading: true });
      const { result } = renderHook(() => useStreamingActions());
      await act(async () => {
        await result.current.handleResume();
      });
      expect(mockResumeStream).not.toHaveBeenCalled();
    });
  });

  describe('handleStop', () => {
    it('marks disconnected and calls stopped feedback on success', async () => {
      connected();
      const { result } = renderHook(() => useStreamingActions());
      await act(async () => {
        await result.current.handleStop();
      });
      expect(useStreamStore.getState().status).toBe('disconnected');
      expect(mockFeedback.streaming.stopped).toHaveBeenCalledTimes(1);
    });

    it('calls stopFailed feedback and still marks disconnected on error', async () => {
      connected();
      mockStopStream.mockRejectedValue(new Error('stop error'));
      const { result } = renderHook(() => useStreamingActions());
      await act(async () => {
        await result.current.handleStop();
      });
      expect(mockFeedback.streaming.stopFailed).toHaveBeenCalledTimes(1);
      expect(useStreamStore.getState().status).toBe('disconnected');
    });

    it('returns early when streamControlLoading is true', async () => {
      useStreamStore.setState({ status: 'connected', streamControlLoading: true });
      const { result } = renderHook(() => useStreamingActions());
      await act(async () => {
        await result.current.handleStop();
      });
      expect(mockStopStream).not.toHaveBeenCalled();
    });
  });

  describe('handleCancel', () => {
    it('calls cancelled feedback and resets state on success', async () => {
      connected();
      const { result } = renderHook(() => useStreamingActions());
      await act(async () => {
        await result.current.handleCancel();
      });
      expect(mockFeedback.streaming.cancelled).toHaveBeenCalledTimes(1);
    });

    it('calls cancelFailed feedback and still resets state on error', async () => {
      connected();
      mockCancelStream.mockRejectedValue(new Error('cancel error'));
      const { result } = renderHook(() => useStreamingActions());
      await act(async () => {
        await result.current.handleCancel();
      });
      expect(mockFeedback.streaming.cancelFailed).toHaveBeenCalledTimes(1);
    });

    it('returns early when streamControlLoading is true', async () => {
      useStreamStore.setState({ status: 'connected', streamControlLoading: true });
      const { result } = renderHook(() => useStreamingActions());
      await act(async () => {
        await result.current.handleCancel();
      });
      expect(mockCancelStream).not.toHaveBeenCalled();
    });
  });
});
