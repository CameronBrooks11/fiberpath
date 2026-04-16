import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastContainer } from './ToastContainer';
import { useToastStore } from '../../stores/toastStore';
import { resetToastStore } from '../../tests/storeUtils';

beforeEach(() => {
  resetToastStore();
});

describe('ToastContainer', () => {
  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastContainer />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a success toast message', () => {
    useToastStore.setState({
      toasts: [{ id: 't1', type: 'success', message: 'Saved!' }],
    });
    render(<ToastContainer />);
    expect(screen.getByText('Saved!')).toBeInTheDocument();
  });

  it('renders an error toast message', () => {
    useToastStore.setState({
      toasts: [{ id: 't1', type: 'error', message: 'Something failed' }],
    });
    render(<ToastContainer />);
    expect(screen.getByText('Something failed')).toBeInTheDocument();
  });

  it('renders multiple toasts', () => {
    useToastStore.setState({
      toasts: [
        { id: 't1', type: 'info', message: 'First' },
        { id: 't2', type: 'warning', message: 'Second' },
      ],
    });
    render(<ToastContainer />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('calls removeToast when the close button is clicked', async () => {
    const removeToast = vi.fn();
    useToastStore.setState({
      toasts: [{ id: 't1', type: 'info', message: 'Click me' }],
      removeToast,
    });
    render(<ToastContainer />);
    await userEvent.click(screen.getByRole('button', { name: /close notification/i }));
    expect(removeToast).toHaveBeenCalledWith('t1');
  });

  it('applies the correct CSS modifier class per toast type', () => {
    useToastStore.setState({
      toasts: [{ id: 't1', type: 'warning', message: 'Watch out' }],
    });
    render(<ToastContainer />);
    const toast = screen.getByText('Watch out').closest('.toast');
    expect(toast).toHaveClass('toast--warning');
  });
});
