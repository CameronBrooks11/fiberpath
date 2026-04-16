import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabBar } from './TabBar';

describe('TabBar', () => {
  const onTabChange = vi.fn();

  beforeEach(() => {
    onTabChange.mockReset();
  });

  it('renders both tab buttons', () => {
    render(<TabBar activeTab="main" onTabChange={onTabChange} />);
    expect(screen.getByRole('button', { name: /main workspace/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /marlin stream/i })).toBeInTheDocument();
  });

  it('applies active class to the current active tab', () => {
    render(<TabBar activeTab="main" onTabChange={onTabChange} />);
    const mainBtn = screen.getByRole('button', { name: /main workspace/i });
    expect(mainBtn).toHaveClass('active');
    const streamBtn = screen.getByRole('button', { name: /marlin stream/i });
    expect(streamBtn).not.toHaveClass('active');
  });

  it('calls onTabChange with "stream" when stream tab is clicked', async () => {
    render(<TabBar activeTab="main" onTabChange={onTabChange} />);
    await userEvent.click(screen.getByRole('button', { name: /marlin stream/i }));
    expect(onTabChange).toHaveBeenCalledWith('stream');
  });

  it('calls onTabChange with "main" when main tab is clicked', async () => {
    render(<TabBar activeTab="stream" onTabChange={onTabChange} />);
    await userEvent.click(screen.getByRole('button', { name: /main workspace/i }));
    expect(onTabChange).toHaveBeenCalledWith('main');
  });

  it('marks stream tab as active when activeTab is "stream"', () => {
    render(<TabBar activeTab="stream" onTabChange={onTabChange} />);
    expect(screen.getByRole('button', { name: /marlin stream/i })).toHaveClass('active');
    expect(screen.getByRole('button', { name: /main workspace/i })).not.toHaveClass('active');
  });
});
