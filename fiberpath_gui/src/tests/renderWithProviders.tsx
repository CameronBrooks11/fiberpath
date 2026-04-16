/**
 * RTL render wrapper that includes all necessary React context providers.
 *
 * Usage:
 *   import { renderWithProviders } from './renderWithProviders';
 *   const { getByText } = renderWithProviders(<MyComponent />, {
 *     cliHealth: { status: 'ready', isHealthy: true },
 *   });
 */
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { type ReactNode } from 'react';
import { vi } from 'vitest';
import {
  CliHealthContext,
  type CliHealthContextValue,
} from '../contexts/CliHealthContext';
import { ErrorNotificationProvider } from '../contexts/ErrorNotificationContext';
import type { CliStatus } from '../hooks/useCliHealth';

// ---------------------------------------------------------------------------
// CliHealth context value shape
// ---------------------------------------------------------------------------
export interface FakeCliHealth {
  status?: CliStatus;
  version?: string | null;
  errorMessage?: string | null;
  lastChecked?: Date | null;
  refresh?: () => Promise<void>;
  isHealthy?: boolean;
  isChecking?: boolean;
  isUnavailable?: boolean;
}

const defaultCliHealth: CliHealthContextValue = {
  status: 'ready',
  version: '0.7.0',
  errorMessage: null,
  lastChecked: new Date(),
  refresh: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  isHealthy: true,
  isChecking: false,
  isUnavailable: false,
};

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------
interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Override CLI health context values. Defaults to a healthy CLI. */
  cliHealth?: FakeCliHealth;
}

/** Render a component wrapped in all shared providers. */
export function renderWithProviders(
  ui: ReactNode,
  options: RenderWithProvidersOptions = {},
): RenderResult {
  const { cliHealth, ...rest } = options;
  const health: CliHealthContextValue = { ...defaultCliHealth, ...cliHealth };

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ErrorNotificationProvider>
        <CliHealthContext.Provider value={health}>
          {children}
        </CliHealthContext.Provider>
      </ErrorNotificationProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...rest });
}

