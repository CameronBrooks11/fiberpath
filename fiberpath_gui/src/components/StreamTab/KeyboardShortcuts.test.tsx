import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeyboardShortcuts } from './KeyboardShortcuts';

describe('KeyboardShortcuts', () => {
  const onClose = vi.fn();

  beforeEach(() => onClose.mockReset());

  it('renders the heading', () => {
    render(<KeyboardShortcuts onClose={onClose} />);
    expect(screen.getByRole('heading', { name: 'Keyboard Shortcuts' })).toBeInTheDocument();
  });

  it('renders all shortcut section headings', () => {
    render(<KeyboardShortcuts onClose={onClose} />);
    expect(screen.getByRole('heading', { name: 'Navigation' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Manual Control' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Log Controls' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Quick Commands' })).toBeInTheDocument();
  });

  it('renders representative shortcut descriptions', () => {
    render(<KeyboardShortcuts onClose={onClose} />);
    expect(screen.getByText('Switch to Main tab')).toBeInTheDocument();
    expect(screen.getByText('Switch to Stream tab')).toBeInTheDocument();
    expect(screen.getByText('Send manual G-code command')).toBeInTheDocument();
    expect(screen.getByText(/Clear log/)).toBeInTheDocument();
  });

  it('closes when close button is clicked', async () => {
    render(<KeyboardShortcuts onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Close keyboard shortcuts' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the overlay is clicked', async () => {
    render(<KeyboardShortcuts onClose={onClose} />);
    // Click the outermost overlay element
    const overlay = document.querySelector('.keyboard-shortcuts-overlay') as HTMLElement;
    await userEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside the modal content', async () => {
    render(<KeyboardShortcuts onClose={onClose} />);
    const modal = document.querySelector('.keyboard-shortcuts-modal') as HTMLElement;
    await userEvent.click(modal);
    expect(onClose).not.toHaveBeenCalled();
  });
});
