/**
 * Zustand store for Marlin streaming state management
 */

import { create } from "zustand";
import { MAX_LOG_ENTRIES, DEFAULT_BAUD_RATE } from "../lib/constants";
import type { SerialPort } from "../lib/tauri-types";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "paused";

export interface LogEntry {
  id: string;
  type: "info" | "command" | "response" | "stream" | "progress" | "error";
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

  // Streaming Controls
  streamControlLoading: boolean;

  // Log
  logEntries: LogEntry[];
  autoScroll: boolean;

  // Actions
  setStatus: (status: ConnectionStatus) => void;
  markConnecting: () => void;
  markConnected: () => void;
  markPaused: () => void;
  markDisconnected: () => void;
  setSelectedPort: (port: string | null) => void;
  setBaudRate: (rate: number) => void;
  setAvailablePorts: (ports: SerialPort[]) => void;
  setIsStreaming: (streaming: boolean) => void;
  markStreamingStarted: () => void;
  markStreamingStopped: () => void;
  setSelectedFile: (file: string | null) => void;
  setProgress: (progress: StreamProgress | null) => void;
  resetAfterCancel: () => void;
  setCommandLoading: (loading: boolean) => void;
  setStreamControlLoading: (loading: boolean) => void;
  addLogEntry: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
  clearLog: () => void;
  toggleAutoScroll: () => void;
  clearStreamingState: () => void;
}

let logIdCounter = 0;

export const useStreamStore = create<StreamState>((set) => ({
  // Initial state
  status: "disconnected",
  selectedPort: null,
  baudRate: DEFAULT_BAUD_RATE,
  availablePorts: [],
  isStreaming: false,
  selectedFile: null,
  progress: null,
  commandLoading: false,
  streamControlLoading: false,
  logEntries: [],
  autoScroll: true,

  // Actions
  setStatus: (status) => set({ status }),

  markConnecting: () => set({ status: "connecting" }),

  markConnected: () => set({ status: "connected" }),

  markPaused: () => set({ status: "paused" }),

  markDisconnected: () => set({ status: "disconnected" }),

  setSelectedPort: (port) => set({ selectedPort: port }),

  setBaudRate: (rate) => set({ baudRate: rate }),

  setAvailablePorts: (ports) => set({ availablePorts: ports }),

  setIsStreaming: (streaming) => set({ isStreaming: streaming }),

  markStreamingStarted: () => set({ isStreaming: true }),

  markStreamingStopped: () => set({ isStreaming: false }),

  setSelectedFile: (file) => set({ selectedFile: file }),

  setProgress: (progress) => set({ progress }),

  resetAfterCancel: () =>
    set({
      isStreaming: false,
      status: "connected",
      progress: null,
    }),

  setCommandLoading: (loading) => set({ commandLoading: loading }),

  setStreamControlLoading: (loading) => set({ streamControlLoading: loading }),

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

  clearStreamingState: () =>
    set({
      selectedFile: null,
      progress: null,
      isStreaming: false,
    }),
}));
