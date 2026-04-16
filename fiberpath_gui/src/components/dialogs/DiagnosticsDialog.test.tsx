import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiagnosticsDialog } from './DiagnosticsDialog';
import { useProjectStore } from '../../stores/projectStore';
import { renderWithProviders } from '../../tests/renderWithProviders';
import { resetStores } from '../../tests/storeUtils';

// Mock getRecentFiles so localStorage isn't needed
vi.mock('../../lib/recentFiles', () => ({
  getRecentFiles: () => ['/a.wind', '/b.wind'],
  addRecentFile: vi.fn(),
  removeRecentFile: vi.fn(),
}));

beforeEach(() => {
  resetStores();
  vi.clearAllMocks();
});

describe('DiagnosticsDialog', () => {
  it('renders nothing when isOpen is false', () => {
    renderWithProviders(<DiagnosticsDialog isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Diagnostics')).not.toBeInTheDocument();
  });

  it('renders the dialog title when isOpen is true', () => {
    renderWithProviders(<DiagnosticsDialog isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Diagnostics')).toBeInTheDocument();
  });

  it('shows all four section headings', () => {
    renderWithProviders(<DiagnosticsDialog isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'CLI Status' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Project Status' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Application Data' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'System Information' })).toBeInTheDocument();
  });

  it('shows CLI healthy indicator when cli is healthy', () => {
    renderWithProviders(
      <DiagnosticsDialog isOpen={true} onClose={vi.fn()} />,
      { cliHealth: { isHealthy: true, version: '1.2.3', status: 'ready' } },
    );
    expect(screen.getByText('✓ Healthy')).toBeInTheDocument();
  });

  it('shows CLI unavailable indicator when cli is not healthy', () => {
    renderWithProviders(
      <DiagnosticsDialog isOpen={true} onClose={vi.fn()} />,
      { cliHealth: { isHealthy: false, status: 'unavailable', errorMessage: 'not found' } },
    );
    expect(screen.getByText('✗ Unavailable')).toBeInTheDocument();
    expect(screen.getByText('not found')).toBeInTheDocument();
  });

  it('shows the CLI version', () => {
    renderWithProviders(
      <DiagnosticsDialog isOpen={true} onClose={vi.fn()} />,
      { cliHealth: { version: '2.0.0', isHealthy: true, status: 'ready' } },
    );
    expect(screen.getByText('2.0.0')).toBeInTheDocument();
  });

  it('shows project file path', () => {
    useProjectStore.setState((s) => ({
      project: { ...s.project, filePath: '/home/user/tube.wind' },
    }));
    renderWithProviders(<DiagnosticsDialog isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('/home/user/tube.wind')).toBeInTheDocument();
  });

  it('shows "Untitled" when no file path is set', () => {
    renderWithProviders(<DiagnosticsDialog isOpen={true} onClose={vi.fn()} />);
    // "Untitled" appears in the project file path row
    expect(screen.getAllByText('Untitled').length).toBeGreaterThan(0);
  });

  it('shows layer count from store', () => {
    useProjectStore.setState((s) => ({
      project: {
        ...s.project,
        layers: [
          { id: 'x', type: 'hoop', hoop: { terminal: false } },
          { id: 'y', type: 'hoop', hoop: { terminal: false } },
        ],
      },
    }));
    renderWithProviders(<DiagnosticsDialog isOpen={true} onClose={vi.fn()} />);
    // LayerCount label + value
    expect(screen.getByText('Layer Count:')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows recent files count from getRecentFiles mock', () => {
    renderWithProviders(<DiagnosticsDialog isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('2 / 10')).toBeInTheDocument();
  });

  it('calls onClose when the Close footer button is clicked', async () => {
    const onClose = vi.fn();
    renderWithProviders(<DiagnosticsDialog isOpen={true} onClose={onClose} />);
    // Both the header X and the footer "Close" button share the accessible name "Close";
    // pick the footer one (last in DOM order).
    const closeButtons = screen.getAllByRole('button', { name: 'Close' });
    await userEvent.click(closeButtons[closeButtons.length - 1]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
