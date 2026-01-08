import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ErrorNotification {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: number;
}

interface ErrorNotificationContextValue {
  notifications: ErrorNotification[];
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  dismissNotification: (id: string) => void;
}

const ErrorNotificationContext = createContext<ErrorNotificationContextValue | null>(null);

export function useErrorNotification() {
  const context = useContext(ErrorNotificationContext);
  if (!context) {
    throw new Error('useErrorNotification must be used within ErrorNotificationProvider');
  }
  return context;
}

export function ErrorNotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<ErrorNotification[]>([]);

  const addNotification = useCallback((message: string, type: ErrorNotification['type']) => {
    const id = `${Date.now()}-${Math.random()}`;
    const notification: ErrorNotification = {
      id,
      message,
      type,
      timestamp: Date.now(),
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const showError = useCallback((message: string) => {
    addNotification(message, 'error');
  }, [addNotification]);

  const showWarning = useCallback((message: string) => {
    addNotification(message, 'warning');
  }, [addNotification]);

  const showInfo = useCallback((message: string) => {
    addNotification(message, 'info');
  }, [addNotification]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <ErrorNotificationContext.Provider
      value={{
        notifications,
        showError,
        showWarning,
        showInfo,
        dismissNotification,
      }}
    >
      {children}
    </ErrorNotificationContext.Provider>
  );
}
