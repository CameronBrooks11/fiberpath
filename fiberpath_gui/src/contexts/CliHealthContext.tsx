import { createContext, useContext, ReactNode } from 'react';
import { useCliHealth, CliStatus } from '../hooks/useCliHealth';

interface CliHealthContextValue {
  status: CliStatus;
  version: string | null;
  errorMessage: string | null;
  lastChecked: Date | null;
  refresh: () => Promise<void>;
  isHealthy: boolean;
  isChecking: boolean;
  isUnavailable: boolean;
}

const CliHealthContext = createContext<CliHealthContextValue | null>(null);

interface CliHealthProviderProps {
  children: ReactNode;
}

/**
 * Provider component for CLI health status.
 * 
 * Automatically checks CLI health on mount and polls every 30 seconds.
 * Provides health status to all child components via context.
 * 
 * @example
 * ```tsx
 * <CliHealthProvider>
 *   <App />
 * </CliHealthProvider>
 * ```
 */
export function CliHealthProvider({ children }: CliHealthProviderProps) {
  const health = useCliHealth({
    enablePolling: true,
    pollingInterval: 30000, // 30 seconds
    checkOnMount: true,
  });

  return (
    <CliHealthContext.Provider value={health}>
      {children}
    </CliHealthContext.Provider>
  );
}

/**
 * Hook to access CLI health status from context.
 * 
 * Must be used within a CliHealthProvider.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { status, version, isHealthy } = useCliHealthContext();
 *   
 *   if (!isHealthy) {
 *     return <div>CLI is not available</div>;
 *   }
 *   
 *   return <div>CLI {version} is ready</div>;
 * }
 * ```
 * 
 * @throws Error if used outside of CliHealthProvider
 * @returns CLI health context value
 */
export function useCliHealthContext(): CliHealthContextValue {
  const context = useContext(CliHealthContext);
  
  if (context === null) {
    throw new Error('useCliHealthContext must be used within a CliHealthProvider');
  }
  
  return context;
}
