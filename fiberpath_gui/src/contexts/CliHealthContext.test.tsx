import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import {
  CliHealthProvider,
  useCliHealthContext,
} from './CliHealthContext';

const { mockInvokeFn } = vi.hoisted(() => ({ mockInvokeFn: vi.fn() }));

vi.mock('@tauri-apps/api/core', () => ({ invoke: mockInvokeFn }));

const healthyResponse = { healthy: true, version: '1.0.0', errorMessage: null };

function setInvokeResponse(value: unknown) {
  mockInvokeFn.mockResolvedValue(value);
}

describe('CliHealthContext', () => {
  it('renders children inside CliHealthProvider', () => {
    setInvokeResponse(healthyResponse);
    render(
      <CliHealthProvider>
        <span>child content</span>
      </CliHealthProvider>,
    );
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('useCliHealthContext throws when used outside CliHealthProvider', () => {
    // renderHook outside a provider — expect the hook to throw
    expect(() =>
      renderHook(() => useCliHealthContext()),
    ).toThrow('useCliHealthContext must be used within a CliHealthProvider');
  });
});
