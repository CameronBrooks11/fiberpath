import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useProjectStore } from "../stores/projectStore";
import { useErrorNotification } from "../contexts/ErrorNotificationContext";
import { createFileOperations } from "../lib/fileOperations";

interface UseFileOperationsOptions {
  onRecentFilesChanged?: () => void;
}

/**
 * Shared adapter for file operation wiring.
 * Keeps createFileOperations configuration in one place.
 */
export function useFileOperations(options: UseFileOperationsOptions = {}) {
  const { onRecentFilesChanged } = options;

  const {
    newProject,
    loadProject,
    setFilePath,
    clearDirty,
    duplicateLayer,
    removeLayer,
  } = useProjectStore(
    useShallow((state) => ({
      newProject: state.newProject,
      loadProject: state.loadProject,
      setFilePath: state.setFilePath,
      clearDirty: state.clearDirty,
      duplicateLayer: state.duplicateLayer,
      removeLayer: state.removeLayer,
    })),
  );

  const { showError, showInfo } = useErrorNotification();

  return useMemo(
    () =>
      createFileOperations({
        getProject: () => useProjectStore.getState().project,
        newProject,
        loadProject,
        setFilePath,
        clearDirty,
        getActiveLayerId: () => useProjectStore.getState().project.activeLayerId,
        duplicateLayer,
        removeLayer,
        updateRecentFiles: onRecentFilesChanged,
        showError,
        showInfo,
      }),
    [
      newProject,
      loadProject,
      setFilePath,
      clearDirty,
      duplicateLayer,
      removeLayer,
      onRecentFilesChanged,
      showError,
      showInfo,
    ],
  );
}
