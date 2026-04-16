import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileStreamingSection } from './FileStreamingSection';
import { useStreamStore } from '../../stores/streamStore';
import { resetStores } from '../../tests/storeUtils';

const mockHandleSelectFile = vi.fn().mockResolvedValue(undefined);
const mockHandleClearFile = vi.fn();
const mockHandleStartStream = vi.fn().mockResolvedValue(undefined);
const mockHandlePause = vi.fn().mockResolvedValue(undefined);
const mockHandleResume = vi.fn().mockResolvedValue(undefined);
const mockHandleCancel = vi.fn().mockResolvedValue(undefined);
const mockHandleStop = vi.fn().mockResolvedValue(undefined);

const hookDefaults = {
  isPaused: false,
  canStartStream: false,
  handleSelectFile: mockHandleSelectFile,
  handleClearFile: mockHandleClearFile,
  handleStartStream: mockHandleStartStream,
  handlePause: mockHandlePause,
  handleResume: mockHandleResume,
  handleCancel: mockHandleCancel,
  handleStop: mockHandleStop,
};

let hookReturn = { ...hookDefaults };

vi.mock('../../hooks/stream/useStreamingActions', () => ({
  useStreamingActions: () => hookReturn,
}));

beforeEach(() => {
  hookReturn = { ...hookDefaults };
  vi.clearAllMocks();
  resetStores();
});

describe('FileStreamingSection', () => {
  it('renders the File Streaming heading', () => {
    render(<FileStreamingSection />);
    expect(screen.getByText('File Streaming')).toBeInTheDocument();
  });

  it('shows "No file selected" when no file is chosen', () => {
    render(<FileStreamingSection />);
    expect(screen.getByText('No file selected')).toBeInTheDocument();
  });

  it('shows the selected filename when one is set', () => {
    useStreamStore.setState({ selectedFile: 'part.gcode' });
    render(<FileStreamingSection />);
    expect(screen.getByText('part.gcode')).toBeInTheDocument();
  });

  it('renders the Select File button', () => {
    render(<FileStreamingSection />);
    expect(screen.getByText('Select File')).toBeInTheDocument();
  });

  it('calls handleSelectFile when Select File is clicked', async () => {
    render(<FileStreamingSection />);
    await userEvent.click(screen.getByText('Select File'));
    expect(mockHandleSelectFile).toHaveBeenCalledTimes(1);
  });

  it('shows the Start Stream button when not streaming', () => {
    render(<FileStreamingSection />);
    expect(screen.getByText('Start Stream')).toBeInTheDocument();
  });

  it('disables Start Stream when canStartStream is false', () => {
    render(<FileStreamingSection />);
    // button text is "Start Stream"
    const btn = screen.getByText('Start Stream').closest('button')!;
    expect(btn).toBeDisabled();
  });

  it('enables Start Stream when canStartStream is true', () => {
    hookReturn = { ...hookDefaults, canStartStream: true };
    render(<FileStreamingSection />);
    const btn = screen.getByText('Start Stream').closest('button')!;
    expect(btn).not.toBeDisabled();
  });

  it('calls handleStartStream when Start Stream button is clicked', async () => {
    hookReturn = { ...hookDefaults, canStartStream: true };
    render(<FileStreamingSection />);
    await userEvent.click(screen.getByText('Start Stream').closest('button')!);
    expect(mockHandleStartStream).toHaveBeenCalledTimes(1);
  });

  it('shows Pause and Stop buttons when streaming', () => {
    useStreamStore.setState({ isStreaming: true, streamControlLoading: false });
    render(<FileStreamingSection />);
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.getByText('Stop')).toBeInTheDocument();
  });

  it('shows Resume and Cancel buttons when paused', () => {
    useStreamStore.setState({ isStreaming: true, streamControlLoading: false });
    hookReturn = { ...hookDefaults, isPaused: true };
    render(<FileStreamingSection />);
    expect(screen.getByText('Resume')).toBeInTheDocument();
    expect(screen.getByText('Cancel Job')).toBeInTheDocument();
  });

  it('shows progress bar and line counts when progress is set', () => {
    useStreamStore.setState({
      progress: { sent: 10, total: 100, currentCommand: 'G0 X5' },
    });
    render(<FileStreamingSection />);
    expect(screen.getByText('10 / 100')).toBeInTheDocument();
    expect(screen.getByText('G0 X5')).toBeInTheDocument();
  });

  it('shows the clear file button when a file is selected and not streaming', () => {
    useStreamStore.setState({ selectedFile: 'part.gcode', isStreaming: false });
    render(<FileStreamingSection />);
    expect(screen.getByTitle('Clear file selection')).toBeInTheDocument();
  });

  it('calls handleClearFile when clear file button is clicked', async () => {
    useStreamStore.setState({ selectedFile: 'part.gcode', isStreaming: false });
    render(<FileStreamingSection />);
    await userEvent.click(screen.getByTitle('Clear file selection'));
    expect(mockHandleClearFile).toHaveBeenCalledTimes(1);
  });
});
