import { open, save } from "@tauri-apps/plugin-dialog";
import { saveWindFile, loadWindFile, validateWindDefinition as validateWindCmd, planWind } from "./commands";
import { projectToWindDefinition, windDefinitionToProject } from "../types/converters";
import { addRecentFile, getRecentFiles } from "./recentFiles";
import type { FiberPathProject } from "../types/project";
import type { FiberPathWindDefinition } from "../types/wind-schema";

export interface FileOperationCallbacks {
  project: FiberPathProject;
  newProject: () => void;
  loadProject: (project: FiberPathProject) => void;
  setFilePath: (path: string | null) => void;
  clearDirty: () => void;
  activeLayerId: string | null;
  duplicateLayer: (layerId: string) => void;
  removeLayer: (layerId: string) => void;
  updateRecentFiles?: () => void;
}

export function createFileOperations(callbacks: FileOperationCallbacks) {
  const {
    project,
    newProject,
    loadProject,
    setFilePath,
    clearDirty,
    activeLayerId,
    duplicateLayer,
    removeLayer,
    updateRecentFiles,
  } = callbacks;

  const saveToFile = async (filePath: string) => {
    try {
      const windDef = projectToWindDefinition(project);
      const content = JSON.stringify(windDef, null, 2);
      
      await saveWindFile(filePath, content);
      setFilePath(filePath);
      clearDirty();
      addRecentFile(filePath);
      updateRecentFiles?.();
    } catch (error) {
      console.error('Failed to save file:', error);
      throw error;
    }
  };

  const handleNewProject = async () => {
    if (project.isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Create new project anyway?');
      if (!confirmed) return false;
    }
    newProject();
    return true;
  };

  const handleOpen = async () => {
    if (project.isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Open new file anyway?');
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
      console.error('Failed to open file:', error);
      return false;
    }
  };

  const handleSave = async () => {
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

  const handleExportGcode = async () => {
    try {
      const windDef = projectToWindDefinition(project);
      const validationResult = await validateWindCmd(JSON.stringify(windDef));
      
      if (!validationResult.valid) {
        const errors = validationResult.errors?.map(e => `${e.field}: ${e.message}`).join('\n') || 'Unknown errors';
        console.error('Validation failed:', errors);
        return false;
      }
      
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
      
      console.log(`G-code exported to: ${gcodeFilePath}`);
      return true;
    } catch (error) {
      console.error('Failed to export G-code:', error);
      return false;
    }
  };

  const handleOpenRecent = async (filePath: string) => {
    if (project.isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Open file anyway?');
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
      console.error('Failed to open file:', error);
      return false;
    }
  };

  const handleDuplicateLayer = () => {
    if (activeLayerId) {
      duplicateLayer(activeLayerId);
      return true;
    }
    return false;
  };

  const handleDeleteLayer = () => {
    if (activeLayerId) {
      removeLayer(activeLayerId);
      return true;
    }
    return false;
  };

  const handleValidate = async () => {
    try {
      const windDef = projectToWindDefinition(project);
      const result = await validateWindCmd(JSON.stringify(windDef));
      
      if (result.valid) {
        console.log('✓ Definition is valid');
        return true;
      } else {
        const errors = result.errors?.map(e => `• ${e.field}: ${e.message}`).join('\n') || 'Unknown errors';
        console.error('Validation failed:', errors);
        return false;
      }
    } catch (error) {
      console.error('Validation error:', error);
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
