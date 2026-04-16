import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BaseDialog } from './BaseDialog';

describe('BaseDialog', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockReset();
  });

  it('renders nothing when isOpen is false', () => {
    render(
      <BaseDialog isOpen={false} title="Test" onClose={onClose}>
        <span>body</span>
      </BaseDialog>,
    );
    expect(screen.queryByText('body')).not.toBeInTheDocument();
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  it('renders title and children when isOpen is true', () => {
    render(
      <BaseDialog isOpen={true} title="My Dialog" onClose={onClose}>
        <span>dialog body</span>
      </BaseDialog>,
    );
    expect(screen.getByText('My Dialog')).toBeInTheDocument();
    expect(screen.getByText('dialog body')).toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    render(
      <BaseDialog isOpen={true} title="T" onClose={onClose} footer={<button>OK</button>}>
        <span>body</span>
      </BaseDialog>,
    );
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    render(
      <BaseDialog isOpen={true} title="T" onClose={onClose}>
        <span>body</span>
      </BaseDialog>,
    );
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the overlay background is clicked', () => {
    render(
      <BaseDialog isOpen={true} title="T" onClose={onClose}>
        <span>body</span>
      </BaseDialog>,
    );
    // Click the overlay div directly (not the dialog-content inside it)
    const overlay = document.querySelector('.dialog-overlay') as HTMLElement;
    fireEvent.click(overlay, { target: overlay });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside the dialog content', async () => {
    render(
      <BaseDialog isOpen={true} title="T" onClose={onClose}>
        <span>dialog body</span>
      </BaseDialog>,
    );
    // Click on the content itself — should not propagate to overlay handler
    await userEvent.click(screen.getByText('dialog body'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('uses custom closeAriaLabel when provided', () => {
    render(
      <BaseDialog isOpen={true} title="T" onClose={onClose} closeAriaLabel="Dismiss dialog">
        <span>body</span>
      </BaseDialog>,
    );
    expect(screen.getByRole('button', { name: 'Dismiss dialog' })).toBeInTheDocument();
  });
});
