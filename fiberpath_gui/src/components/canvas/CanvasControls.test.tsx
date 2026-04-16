import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CanvasControls } from './CanvasControls';

function makeProps(overrides: Partial<Parameters<typeof CanvasControls>[0]> = {}) {
  return {
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onResetZoom: vi.fn(),
    onRefresh: vi.fn(),
    isGenerating: false,
    ...overrides,
  };
}

describe('CanvasControls', () => {
  beforeEach(() => vi.resetAllMocks());

  it('renders all core control buttons', () => {
    render(<CanvasControls {...makeProps()} />);
    expect(screen.getByTitle('Generate preview')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom in (Ctrl++)')).toBeInTheDocument();
    expect(screen.getByTitle('Reset zoom (Ctrl+0)')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom out (Ctrl+-)')).toBeInTheDocument();
  });

  it('does not render the export button when onExport is not provided', () => {
    render(<CanvasControls {...makeProps()} />);
    expect(screen.queryByTitle('Export G-code (Ctrl+E)')).not.toBeInTheDocument();
  });

  it('renders the export button when onExport is provided', () => {
    render(<CanvasControls {...makeProps({ onExport: vi.fn() })} />);
    expect(screen.getByTitle('Export G-code (Ctrl+E)')).toBeInTheDocument();
  });

  it('disables the preview button while isGenerating is true', () => {
    render(<CanvasControls {...makeProps({ isGenerating: true })} />);
    expect(screen.getByTitle('Generate preview')).toBeDisabled();
  });

  it('enables the preview button when isGenerating is false', () => {
    render(<CanvasControls {...makeProps({ isGenerating: false })} />);
    expect(screen.getByTitle('Generate preview')).not.toBeDisabled();
  });

  it('calls onRefresh when preview button is clicked', async () => {
    const props = makeProps();
    render(<CanvasControls {...props} />);
    await userEvent.click(screen.getByTitle('Generate preview'));
    expect(props.onRefresh).toHaveBeenCalledTimes(1);
  });

  it('calls onZoomIn when zoom-in button is clicked', async () => {
    const props = makeProps();
    render(<CanvasControls {...props} />);
    await userEvent.click(screen.getByTitle('Zoom in (Ctrl++)'));
    expect(props.onZoomIn).toHaveBeenCalledTimes(1);
  });

  it('calls onResetZoom when reset-zoom button is clicked', async () => {
    const props = makeProps();
    render(<CanvasControls {...props} />);
    await userEvent.click(screen.getByTitle('Reset zoom (Ctrl+0)'));
    expect(props.onResetZoom).toHaveBeenCalledTimes(1);
  });

  it('calls onZoomOut when zoom-out button is clicked', async () => {
    const props = makeProps();
    render(<CanvasControls {...props} />);
    await userEvent.click(screen.getByTitle('Zoom out (Ctrl+-)'));
    expect(props.onZoomOut).toHaveBeenCalledTimes(1);
  });

  it('calls onExport when export button is clicked', async () => {
    const onExport = vi.fn();
    render(<CanvasControls {...makeProps({ onExport })} />);
    await userEvent.click(screen.getByTitle('Export G-code (Ctrl+E)'));
    expect(onExport).toHaveBeenCalledTimes(1);
  });
});
