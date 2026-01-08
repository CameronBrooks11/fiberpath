import { open, save, ask } from "@tauri-apps/plugin-dialog";
import { saveWindFile, loadWindFile, validateWindDefinition as validateWindCmd, planWind } from "./commands";
import { projectToWindDefinition, windDefinitionToProject } from "../types/converters";
import { addRecentFile, getRecentFiles } from "./recentFiles";
import type { FiberPathProject } from "../types/project";
import type { FiberPathWindDefinition } from "../types/wind-schema";

export interface FileOperationCallbacks {
  getProject: () => FiberPathProject;  // Changed to function to get current state
  newProject: () => void;
  loadProject: (project: FiberPathProject) => void;
  setFilePath: (path: string | null) => void;
  clearDirty: () => void;
  getActiveLayerId: () => string | null;  // Changed to function
  duplicateLayer: (layerId: string) => void;
  removeLayer: (layerId: string) => void;
  updateRecentFiles?: () => void;
  showError?: (message: string) => void;
  showInfo?: (message: string) => void;
}

export function createFileOperations(callbacks: FileOperationCallbacks) {
  const {
    getProject,
    newProject,
    loadProject,
    setFilePath,
    clearDirty,
    getActiveLayerId,
    duplicateLayer,
    removeLayer,
    updateRecentFiles,
    showError,
    showInfo,
  } = callbacks;

  const saveToFile = async (filePath: string) => {
    try {
      const project = getProject();
      const windDef = projectToWindDefinition(project);
      const content = JSON.stringify(windDef, null, 2);
      
      await saveWindFile(filePath, content);
      setFilePath(filePath);
      clearDirty();
      addRecentFile(filePath);
      updateRecentFiles?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showError?.(`Failed to save file: ${message}`);
      throw error;
    }
  };

  const handleNewProject = async () => {
    const project = getProject();
    if (project.isDirty) {
      const confirmed = await ask('You have unsaved changes. Create new project anyway?', {
        title: 'Unsaved Changes',
        kind: 'warning'
      });
      if (!confirmed) return false;
    }
    newProject();
    return true;
  };

  const handleOpen = async () => {
    const project = getProject();
    if (project.isDirty) {
      const confirmed = await ask('You have unsaved changes. Open new file anyway?', {
        title: 'Unsaved Changes',
        kind: 'warning'
      });
      if (!confirmed) return false;
    }
    
    const filePath = await open({
      filters: [{
        name: 'Wind Files',
        extensions: ['wind']
      }],
      multiple: false
    });
    
    if (!filePath) return false;
    
    try {
      const content = await loadWindFile(filePath);
      const windDef: FiberPathWindDefinition = JSON.parse(content);
      const fullProject = windDefinitionToProject(windDef, filePath);
      
      loadProject(fullProject);
      setFilePath(filePath);
      addRecentFile(filePath);
      updateRecentFiles?.();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showError?.(`Failed to open file: ${message}`);
      return false;
    }
  };

  const handleSave = async () => {
    const project = getProject();
    if (project.filePath) {
      await saveToFile(project.filePath);
      return true;
    } else {
      return await handleSaveAs();
    }
  };

  const handleSaveAs = async () => {
    const filePath = await save({
      filters: [{
        name: 'Wind Files',
        extensions: ['wind']
      }],
      defaultPath: 'untitled.wind'
    });
    
    if (!filePath) return false;
    
    try {
      await saveToFile(filePath);
      return true;
    } catch (error) {
      return false;
    }
  };

  // This is called after user confirms in the export dialog
  const handleExportGcode = async () => {
    try {
      const project = getProject();
      const windDef = projectToWindDefinition(project);
      
      const gcodeFilePath = await save({
        filters: [{
          name: 'G-code Files',
          extensions: ['gcode']
        }],
        defaultPath: 'output.gcode'
      });
      
      if (!gcodeFilePath) return false;
      
      const tempWindPath = gcodeFilePath.replace(/\.gcode$/, '.wind');
      const content = JSON.stringify(windDef, null, 2);
      await saveWindFile(tempWindPath, content);
      await planWind(tempWindPath, gcodeFilePath, project.axisFormat);
      
      showInfo?.(`G-code exported to: ${gcodeFilePath}`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showError?.(`Failed to export G-code: ${message}`);
      return false;
    }
  };

  const handleOpenRecent = async (filePath: string) => {
    const project = getProject();
    if (project.isDirty) {
      const confirmed = await ask('You have unsaved changes. Open file anyway?', {
        title: 'Unsaved Changes',
        kind: 'warning'
      });
      if (!confirmed) return false;
    }
    
    try {
      const content = await loadWindFile(filePath);
      const windDef: FiberPathWindDefinition = JSON.parse(content);
      const fullProject = windDefinitionToProject(windDef, filePath);
      
      loadProject(fullProject);
      setFilePath(filePath);
      addRecentFile(filePath);
      updateRecentFiles?.();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showError?.(`Failed to open file: ${message}`);
      return false;
    }
  };

  const handleDuplicateLayer = () => {
    const activeLayerId = getActiveLayerId();
    if (activeLayerId) {
      duplicateLayer(activeLayerId);
      return true;
    }
    return false;
  };

  const handleDeleteLayer = () => {
    const activeLayerId = getActiveLayerId();
    if (activeLayerId) {
      removeLayer(activeLayerId);
      return true;
    }
    return false;
  };

  const handleValidate = async () => {
    try {
      const project = getProject();
      const windDef = projectToWindDefinition(project);
      const result = await validateWindCmd(JSON.stringify(windDef));
      
      // Check for both possible response formats (status: "ok" or valid: true)
      const isValid = result.status === 'ok' || result.valid === true;
      
      if (isValid) {
        showInfo?.('✓ Definition is valid');
        return true;
      } else {
        const errors = result.errors?.map(e => `• ${e.field}: ${e.message}`).join('\n') || 'Unknown errors';
        showError?.(`Validation failed:\n${errors}`);
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showError?.(`Validation error: ${message}`);
      return false;
    }
  };

  return {
    handleNewProject,
    handleOpen,
    handleSave,
    handleSaveAs,
    handleExportGcode,
    handleOpenRecent,
    handleDuplicateLayer,
    handleDeleteLayer,
    handleValidate,
  };
}
