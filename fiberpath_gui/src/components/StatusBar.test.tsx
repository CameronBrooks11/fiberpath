import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { StatusBar } from './StatusBar';
import { renderWithProviders } from '../tests/renderWithProviders';
import { resetStores, seedProject, seedLayers } from '../tests/storeUtils';

beforeEach(() => resetStores());

describe('StatusBar', () => {
  describe('project info', () => {
    it('shows "Untitled" when no file is open', () => {
      renderWithProviders(<StatusBar />);
      expect(screen.getByText('Untitled')).toBeInTheDocument();
    });

    it('shows the filename when a file path is set', () => {
      seedProject({ filePath: '/home/user/my-project.wind' });
      renderWithProviders(<StatusBar />);
      expect(screen.getByText('my-project.wind')).toBeInTheDocument();
    });

    it('shows the dirty indicator when isDirty is true', () => {
      seedProject({ isDirty: true });
      renderWithProviders(<StatusBar />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('does not show dirty indicator when clean', () => {
      renderWithProviders(<StatusBar />);
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('shows layer count when there are layers', () => {
      seedLayers(['hoop', 'helical']);
      renderWithProviders(<StatusBar />);
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('does not show layer count section when there are no layers', () => {
      renderWithProviders(<StatusBar />);
      expect(screen.queryByText('Layers:')).not.toBeInTheDocument();
    });
  });

  describe('CLI status indicator', () => {
    it('shows "CLI: Ready" when status is ready', () => {
      renderWithProviders(<StatusBar />, { cliHealth: { status: 'ready' } });
      expect(screen.getByText('CLI: Ready')).toBeInTheDocument();
    });

    it('shows "CLI: Checking..." when status is checking', () => {
      renderWithProviders(<StatusBar />, { cliHealth: { status: 'checking' } });
      expect(screen.getByText('CLI: Checking...')).toBeInTheDocument();
    });

    it('shows "CLI: Unavailable" when status is unavailable', () => {
      renderWithProviders(<StatusBar />, { cliHealth: { status: 'unavailable' } });
      expect(screen.getByText('CLI: Unavailable')).toBeInTheDocument();
    });

    it('shows "CLI: Unknown" when status is unknown', () => {
      renderWithProviders(<StatusBar />, { cliHealth: { status: 'unknown' } });
      expect(screen.getByText('CLI: Unknown')).toBeInTheDocument();
    });

    it('adds ready class when status is ready', () => {
      const { container } = renderWithProviders(<StatusBar />, {
        cliHealth: { status: 'ready' },
      });
      expect(container.querySelector('.statusbar__indicator--ready')).toBeInTheDocument();
    });

    it('adds unavailable class when status is unavailable', () => {
      const { container } = renderWithProviders(<StatusBar />, {
        cliHealth: { status: 'unavailable' },
      });
      expect(container.querySelector('.statusbar__indicator--unavailable')).toBeInTheDocument();
    });
  });
});
