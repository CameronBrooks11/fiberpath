import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StreamLog } from './StreamLog';
import { useStreamStore } from '../../stores/streamStore';
import { resetStores, seedLogEntries } from '../../tests/storeUtils';

// jsdom doesn't implement scrollIntoView — stub it globally for this suite
beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  resetStores();
});

describe('StreamLog', () => {
  it('renders the Output Log heading', () => {
    render(<StreamLog />);
    expect(screen.getByText('Output Log')).toBeInTheDocument();
  });

  it('shows the empty state message when there are no log entries', () => {
    render(<StreamLog />);
    expect(screen.getByText(/No log entries yet/)).toBeInTheDocument();
  });

  it('renders log entries when present', () => {
    seedLogEntries([
      { type: 'info', content: 'Connected to /dev/ttyUSB0' },
      { type: 'command', content: 'G28' },
    ]);
    render(<StreamLog />);
    expect(screen.getByText('Connected to /dev/ttyUSB0')).toBeInTheDocument();
    expect(screen.getByText('G28')).toBeInTheDocument();
  });

  it('renders the correct prefix for each log type', () => {
    seedLogEntries([
      { type: 'command', content: 'cmd' },
      { type: 'response', content: 'resp' },
      { type: 'error', content: 'err' },
      { type: 'progress', content: 'prog' },
    ]);
    render(<StreamLog />);
    expect(screen.getByText('>')).toBeInTheDocument(); // command
    expect(screen.getByText('<')).toBeInTheDocument(); // response
    expect(screen.getByText('!')).toBeInTheDocument(); // error
    expect(screen.getByText('→')).toBeInTheDocument(); // progress
  });

  it('disables the clear button when there are no entries', () => {
    render(<StreamLog />);
    expect(screen.getByTitle('Clear log')).toBeDisabled();
  });

  it('enables the clear button when there are entries', () => {
    seedLogEntries([{ content: 'hello' }]);
    render(<StreamLog />);
    expect(screen.getByTitle('Clear log')).not.toBeDisabled();
  });

  it('calls clearLog when the clear button is clicked', async () => {
    seedLogEntries([{ content: 'hello' }]);
    const clearLog = vi.fn();
    useStreamStore.setState({ clearLog } as unknown as Parameters<typeof useStreamStore.setState>[0]);
    render(<StreamLog />);
    await userEvent.click(screen.getByTitle('Clear log'));
    expect(clearLog).toHaveBeenCalledTimes(1);
  });

  it('shows the auto-scroll toggle button', () => {
    render(<StreamLog />);
    expect(
      screen.getByTitle(/Auto-scroll enabled/),
    ).toBeInTheDocument();
  });

  it('calls toggleAutoScroll when the auto-scroll button is clicked', async () => {
    const toggleAutoScroll = vi.fn();
    useStreamStore.setState({
      toggleAutoScroll,
    } as unknown as Parameters<typeof useStreamStore.setState>[0]);
    render(<StreamLog />);
    await userEvent.click(screen.getByTitle(/Auto-scroll enabled/));
    expect(toggleAutoScroll).toHaveBeenCalledTimes(1);
  });
});
