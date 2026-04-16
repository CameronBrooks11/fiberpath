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
import { ErrorNotificationProvider } from '../contexts/ErrorNotificationContext';
import type { CliStatus } from '../hooks/useCliHealth';

// ---------------------------------------------------------------------------
// CliHealth context value shape (matches CliHealthContextValue)
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

const defaultCliHealth: Required<FakeCliHealth> = {
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

// ---------------------------------------------------------------------------
// Mock CliHealthProvider — injects values directly without calling useCliHealth
// so tests that use this wrapper don't require a live invoke mock.
// ---------------------------------------------------------------------------
vi.mock('../contexts/CliHealthContext', async (importOriginal) => {
  const { createContext, useContext } = await import('react');

  // We create a new context here just for the mock; the real context is
  // replaced module-wide. Components that call useCliHealthContext() will
  // get this mocked version.
  const MockCliHealthContext = createContext<unknown>(null);

  return {
    ...(await importOriginal<typeof import('../contexts/CliHealthContext')>()),
    CliHealthProvider: MockCliHealthContext.Provider,
    useCliHealthContext: () => useContext(MockCliHealthContext),
    _MockCliHealthContext: MockCliHealthContext,
  };
});

/** Render a component wrapped in all shared providers. */
export function renderWithProviders(
  ui: ReactNode,
  options: RenderWithProvidersOptions = {},
): RenderResult {
  const { cliHealth, ...rest } = options;
  const health = { ...defaultCliHealth, ...cliHealth };

  // We need access to the mock context to pass the value. Import synchronously
  // from the (already-mocked) module.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { _MockCliHealthContext } = require('../contexts/CliHealthContext');

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ErrorNotificationProvider>
        <_MockCliHealthContext.Provider value={health}>
          {children}
        </_MockCliHealthContext.Provider>
      </ErrorNotificationProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...rest });
}
