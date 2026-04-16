import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManualControlSection } from './ManualControlSection';

// Mock the hook so we don't need live Tauri connections
const mockHandleSendCommand = vi.fn();
const mockHandleManualSend = vi.fn();
const mockSetCommandInput = vi.fn();

const hookDefaults = {
  commandInput: '',
  setCommandInput: mockSetCommandInput,
  commandLoading: false,
  manualControlsEnabled: true,
  handleSendCommand: mockHandleSendCommand,
  handleManualSend: mockHandleManualSend,
};

vi.mock('../../hooks/stream/useManualCommandActions', () => ({
  useManualCommandActions: () => hookReturn,
}));

// mutable reference updated per test
let hookReturn = { ...hookDefaults };

beforeEach(() => {
  hookReturn = { ...hookDefaults };
  vi.clearAllMocks();
});

describe('ManualControlSection', () => {
  it('renders the Manual Control heading', () => {
    render(<ManualControlSection />);
    expect(screen.getByText('Manual Control')).toBeInTheDocument();
  });

  it('renders all four quick-command buttons', () => {
    render(<ManualControlSection />);
    expect(screen.getByTitle(/Home all axes/)).toBeInTheDocument();
    expect(screen.getByTitle(/Get current position/)).toBeInTheDocument();
    expect(screen.getByTitle(/Emergency stop/)).toBeInTheDocument();
    expect(screen.getByTitle(/Disable stepper motors/)).toBeInTheDocument();
  });

  it('disables all buttons when manualControlsEnabled is false', () => {
    hookReturn = { ...hookDefaults, manualControlsEnabled: false };
    render(<ManualControlSection />);
    expect(screen.getByTitle(/Home all axes/)).toBeDisabled();
    expect(screen.getByTitle(/Get current position/)).toBeDisabled();
    expect(screen.getByTitle(/Emergency stop/)).toBeDisabled();
    expect(screen.getByTitle(/Disable stepper motors/)).toBeDisabled();
  });

  it('calls handleSendCommand("G28") when Home is clicked', async () => {
    render(<ManualControlSection />);
    await userEvent.click(screen.getByTitle(/Home all axes/));
    expect(mockHandleSendCommand).toHaveBeenCalledWith('G28');
  });

  it('calls handleSendCommand("M114") when Get Pos is clicked', async () => {
    render(<ManualControlSection />);
    await userEvent.click(screen.getByTitle(/Get current position/));
    expect(mockHandleSendCommand).toHaveBeenCalledWith('M114');
  });

  it('calls handleSendCommand("M112") when E-Stop is clicked', async () => {
    render(<ManualControlSection />);
    await userEvent.click(screen.getByTitle(/Emergency stop/));
    expect(mockHandleSendCommand).toHaveBeenCalledWith('M112');
  });

  it('calls handleSendCommand("M18") when Motors is clicked', async () => {
    render(<ManualControlSection />);
    await userEvent.click(screen.getByTitle(/Disable stepper motors/));
    expect(mockHandleSendCommand).toHaveBeenCalledWith('M18');
  });

  it('renders the command text input', () => {
    render(<ManualControlSection />);
    expect(screen.getByLabelText('Command')).toBeInTheDocument();
  });

  it('calls setCommandInput when the text input changes', () => {
    render(<ManualControlSection />);
    fireEvent.change(screen.getByLabelText('Command'), { target: { value: 'G0 X10' } });
    expect(mockSetCommandInput).toHaveBeenCalledWith('G0 X10');
  });

  it('calls handleManualSend when Enter is pressed in the input', async () => {
    render(<ManualControlSection />);
    await userEvent.type(screen.getByLabelText('Command'), '{Enter}');
    expect(mockHandleManualSend).toHaveBeenCalledTimes(1);
  });

  it('calls handleManualSend when the Send button is clicked', async () => {
    hookReturn = { ...hookDefaults, commandInput: 'G28' };
    render(<ManualControlSection />);
    await userEvent.click(screen.getByTitle('Send command'));
    expect(mockHandleManualSend).toHaveBeenCalledTimes(1);
  });
});
