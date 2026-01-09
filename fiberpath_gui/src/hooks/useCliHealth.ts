import { useEffect, useState, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CliHealthResponseSchema } from '../lib/schemas';
import { CommandError } from '../lib/schemas';

export type CliStatus = 'ready' | 'checking' | 'unavailable' | 'unknown';

export interface CliHealthState {
  status: CliStatus;
  version: string | null;
  errorMessage: string | null;
  lastChecked: Date | null;
}

export interface UseCliHealthOptions {
  /** Whether to poll for health status automatically */
  enablePolling?: boolean;
  /** Polling interval in milliseconds (default: 30000 = 30 seconds) */
  pollingInterval?: number;
  /** Whether to check health on mount */
  checkOnMount?: boolean;
}

/**
 * Hook for checking CLI backend health status.
 * 
 * Features:
 * - Automatic health check on mount (configurable)
 * - Optional periodic polling
 * - Manual refresh capability
 * - Error handling and recovery
 * 
 * @example
 * ```tsx
 * const { status, version, errorMessage, refresh } = useCliHealth({
 *   enablePolling: true,
 *   pollingInterval: 30000,
 *   checkOnMount: true
 * });
 * 
 * if (status === 'unavailable') {
 *   return <div>CLI is unavailable: {errorMessage}</div>;
 * }
 * ```
 * 
 * @param options - Configuration options
 * @returns CLI health state and refresh function
 */
export function useCliHealth(options: UseCliHealthOptions = {}) {
  const {
    enablePolling = false,
    pollingInterval = 30000,
    checkOnMount = true,
  } = options;

  const [healthState, setHealthState] = useState<CliHealthState>({
    status: 'unknown',
    version: null,
    errorMessage: null,
    lastChecked: null,
  });

  const pollingTimerRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Perform a health check against the CLI backend
   */
  const checkHealth = useCallback(async () => {
    setHealthState(prev => ({ ...prev, status: 'checking' }));

    try {
      const response = await invoke<unknown>('check_cli_health');
      
      // Validate response with Zod schema
      const validated = CliHealthResponseSchema.safeParse(response);
      
      if (!validated.success) {
        throw new Error(`Invalid response schema: ${validated.error.message}`);
      }

      if (!isMountedRef.current) return;

      setHealthState({
        status: validated.data.healthy ? 'ready' : 'unavailable',
        version: validated.data.version,
        errorMessage: validated.data.errorMessage,
        lastChecked: new Date(),
      });
    } catch (error) {
      if (!isMountedRef.current) return;

      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      setHealthState({
        status: 'unavailable',
        version: null,
        errorMessage,
        lastChecked: new Date(),
      });
    }
  }, []);

  /**
   * Start polling for health status
   */
  const startPolling = useCallback(() => {
    if (pollingTimerRef.current !== null) return; // Already polling

    pollingTimerRef.current = window.setInterval(() => {
      checkHealth();
    }, pollingInterval);
  }, [checkHealth, pollingInterval]);

  /**
   * Stop polling for health status
   */
  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current !== null) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  // Initial health check on mount
  useEffect(() => {
    if (checkOnMount) {
      checkHealth();
    }
  }, [checkOnMount, checkHealth]);

  // Set up polling if enabled
  useEffect(() => {
    if (enablePolling) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enablePolling, startPolling, stopPolling]);

  // Cleanup on unmount - set this AFTER other effects
  useEffect(() => {
    isMountedRef.current = true; // Reset on mount
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    status: healthState.status,
    version: healthState.version,
    errorMessage: healthState.errorMessage,
    lastChecked: healthState.lastChecked,
    refresh: checkHealth,
    isHealthy: healthState.status === 'ready',
    isChecking: healthState.status === 'checking',
    isUnavailable: healthState.status === 'unavailable',
  };
}
