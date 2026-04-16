/**
 * Shared test utilities for seeding and resetting Zustand stores.
 *
 * Usage:
 *   import { seedProject, resetStores } from './storeUtils';
 *   beforeEach(() => resetStores());
 *   seedProject({ isDirty: true });
 */
import { useProjectStore } from '../stores/projectStore';
import { useStreamStore } from '../stores/streamStore';
import { useToastStore } from '../stores/toastStore';
import { createEmptyProject, createLayer } from '../types/project';
import type { FiberPathProject, Layer, LayerType } from '../types/project';
import type { ConnectionStatus, LogEntry } from '../stores/streamStore';

// ---------------------------------------------------------------------------
// Project store helpers
// ---------------------------------------------------------------------------

export function resetProjectStore() {
  useProjectStore.setState({
    project: createEmptyProject(),
    validationErrors: {},
  });
}

/** Merge arbitrary partial project state into the store. */
export function seedProject(partial: Partial<FiberPathProject>) {
  useProjectStore.setState((state) => ({
    project: { ...state.project, ...partial },
  }));
}

/** Add one or more layers of a given type and return their ids. */
export function seedLayers(types: LayerType[]): string[] {
  const layers: Layer[] = types.map((t) => createLayer(t));
  useProjectStore.setState((state) => ({
    project: {
      ...state.project,
      layers: [...state.project.layers, ...layers],
    },
  }));
  return layers.map((l) => l.id);
}

// ---------------------------------------------------------------------------
// Stream store helpers
// ---------------------------------------------------------------------------

export function resetStreamStore() {
  useStreamStore.setState({
    status: 'disconnected',
    selectedPort: null,
    baudRate: 250000,
    availablePorts: [],
    isStreaming: false,
    selectedFile: null,
    progress: null,
    commandLoading: false,
    streamControlLoading: false,
    logEntries: [],
    autoScroll: true,
  });
}

export function seedStreamStatus(status: ConnectionStatus) {
  useStreamStore.setState({ status });
}

export function seedLogEntries(entries: Partial<LogEntry>[]) {
  const full: LogEntry[] = entries.map((e, i) => ({
    id: `log-${i}`,
    type: e.type ?? 'info',
    content: e.content ?? '',
    timestamp: e.timestamp ?? Date.now(),
  }));
  useStreamStore.setState({ logEntries: full });
}

// ---------------------------------------------------------------------------
// Toast store helpers
// ---------------------------------------------------------------------------

export function resetToastStore() {
  useToastStore.setState({ toasts: [] });
}

// ---------------------------------------------------------------------------
// Reset all stores in one call (use in beforeEach)
// ---------------------------------------------------------------------------

export function resetStores() {
  resetProjectStore();
  resetStreamStore();
  resetToastStore();
}
