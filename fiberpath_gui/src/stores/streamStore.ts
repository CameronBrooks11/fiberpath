/**
 * Zustand store for Marlin streaming state management
 */

import { create } from 'zustand';
import { MAX_LOG_ENTRIES, DEFAULT_BAUD_RATE } from '../lib/constants';
import type { SerialPort } from '../lib/tauri-types';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'paused';

export interface LogEntry {
  id: string;
  type: 'info' | 'command' | 'response' | 'stream' | 'progress' | 'error';
  content: string;
  timestamp: number;
}

export interface StreamProgress {
  sent: number;
  total: number;
  currentCommand: string;
}

interface StreamState {
  // Connection
  status: ConnectionStatus;
  selectedPort: string | null;
  baudRate: number;
  availablePorts: SerialPort[];
  
  // Streaming
  isStreaming: boolean;
  selectedFile: string | null;
  progress: StreamProgress | null;
  
  // Manual Control
  commandLoading: boolean;
  
  // Log
  logEntries: LogEntry[];
  autoScroll: boolean;
  
  // Actions
  setStatus: (status: ConnectionStatus) => void;
  setSelectedPort: (port: string | null) => void;
  setBaudRate: (rate: number) => void;
  setAvailablePorts: (ports: SerialPort[]) => void;
  setIsStreaming: (streaming: boolean) => void;
  setSelectedFile: (file: string | null) => void;
  setProgress: (progress: StreamProgress | null) => void;
  setCommandLoading: (loading: boolean) => void;
  addLogEntry: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLog: () => void;
  toggleAutoScroll: () => void;
}

let logIdCounter = 0;

export const useStreamStore = create<StreamState>((set) => ({
  // Initial state
  status: 'disconnected',
  selectedPort: null,
  baudRate: DEFAULT_BAUD_RATE,
  availablePorts: [],
  isStreaming: false,
  selectedFile: null,
  progress: null,
  commandLoading: false,
  logEntries: [],
  autoScroll: true,
  
  // Actions
  setStatus: (status) => set({ status }),
  
  setSelectedPort: (port) => set({ selectedPort: port }),
  
  setBaudRate: (rate) => set({ baudRate: rate }),
  
  setAvailablePorts: (ports) => set({ availablePorts: ports }),
  
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  
  setSelectedFile: (file) => set({ selectedFile: file }),
  
  setProgress: (progress) => set({ progress }),
  
  setCommandLoading: (loading) => set({ commandLoading: loading }),
  
  addLogEntry: (entry) =>
    set((state) => ({
      logEntries: [
        ...state.logEntries,
        {
          ...entry,
          id: `log-${logIdCounter++}`,
          timestamp: Date.now(),
        },
      ].slice(-MAX_LOG_ENTRIES), // Keep max entries from constants
    })),
  
  clearLog: () => set({ logEntries: [] }),
  
  toggleAutoScroll: () => set((state) => ({ autoScroll: !state.autoScroll })),
}));
