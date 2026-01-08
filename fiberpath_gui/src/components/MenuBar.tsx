import { open as openExternal } from "@tauri-apps/plugin-shell";
import { open, save } from "@tauri-apps/plugin-dialog";
import { useEffect, useRef, useState } from "react";
import { useProjectStore } from "../state/projectStore";
import { saveWindFile, loadWindFile, validateWindDefinition as validateWindCmd, planWind } from "../lib/commands";
import { projectToWindDefinition, windDefinitionToProject } from "../types/converters";
import { getRecentFiles, addRecentFile, formatRecentFileName, formatRecentFilePath } from "../lib/recentFiles";
import { AboutDialog } from "./dialogs/AboutDialog";
import { DiagnosticsDialog } from "./dialogs/DiagnosticsDialog";
import type { FiberPathProject } from "../types/project";
import type { FiberPathWindDefinition } from "../types/wind-schema";

interface MenuBarProps {
  onToggleLeftPanel?: () => void;
  onToggleRightPanel?: () => void;
}

export function MenuBar({
  onToggleLeftPanel,
  onToggleRightPanel,
}: MenuBarProps) {
  const menuRefs = useRef<(HTMLDetailsElement | null)[]>([]);
  const [recentFiles, setRecentFiles] = useState(getRecentFiles());
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showDiagnosticsDialog, setShowDiagnosticsDialog] = useState(false);
  
  const project = useProjectStore(state => state.project);
  const newProject = useProjectStore(state => state.newProject);
  const loadProject = useProjectStore(state => state.loadProject);
  const setFilePath = useProjectStore(state => state.setFilePath);
  const clearDirty = useProjectStore(state => state.clearDirty);
  const activeLayerId = useProjectStore(state => state.project.activeLayerId);
  const duplicateLayer = useProjectStore(state => state.duplicateLayer);
  const removeLayer = useProjectStore(state => state.removeLayer);
  
  // Handlers
  const handleNewProject = async () => {
    if (project.isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Create new project anyway?');
      if (!confirmed) return;
    }
    newProject();
  };
  
  const handleOpen = async () => {
    if (project.isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Open new file anyway?');
      if (!confirmed) return;
    }
    
    const filePath = await open({
      filters: [{
        name: 'Wind Files',
        extensions: ['wind']
      }],
      multiple: false
    });
    
    if (!filePath) return;
    
    try {
      const content = await loadWindFile(filePath);
      const windDef: FiberPathWindDefinition = JSON.parse(content);
      const fullProject = windDefinitionToProject(windDef, filePath);
      
      loadProject(fullProject);
      setFilePath(filePath);
      addRecentFile(filePath);
      setRecentFiles(getRecentFiles());
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };
  
  const handleSave = async () => {
    if (project.filePath) {
      await saveToFile(project.filePath);
    } else {
      await handleSaveAs();
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
    
    if (!filePath) return;
    await saveToFile(filePath);
  };
  
  const saveToFile = async (filePath: string) => {
    try {
      const windDef = projectToWindDefinition(project);
      const content = JSON.stringify(windDef, null, 2);
      
      await saveWindFile(filePath, content);
      setFilePath(filePath);
      clearDirty();
      addRecentFile(filePath);
      setRecentFiles(getRecentFiles());
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };
  
  const handleExportGcode = async () => {
    try {
      const windDef = projectToWindDefinition(project);
      const validationResult = await validateWindCmd(JSON.stringify(windDef));
      
      if (!validationResult.valid) {
        const errors = validationResult.errors?.map(e => `${e.field}: ${e.message}`).join('\n') || 'Unknown errors';
        console.error('Validation failed:', errors);
        return;
      }
      
      const gcodeFilePath = await save({
        filters: [{
          name: 'G-code Files',
          extensions: ['gcode']
        }],
        defaultPath: 'output.gcode'
      });
      
      if (!gcodeFilePath) return;
      
      const tempWindPath = gcodeFilePath.replace(/\.gcode$/, '.wind');
      const content = JSON.stringify(windDef, null, 2);
      await saveWindFile(tempWindPath, content);
      await planWind(tempWindPath, gcodeFilePath, project.axisFormat);
      
      console.log(`G-code exported to: ${gcodeFilePath}`);
    } catch (error) {
      console.error('Failed to export G-code:', error);
    }
  };
  
  const handleOpenRecent = async (filePath: string) => {
    if (project.isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Open file anyway?');
      if (!confirmed) return;
    }
    
    try {
      const content = await loadWindFile(filePath);
      const windDef: FiberPathWindDefinition = JSON.parse(content);
      const fullProject = windDefinitionToProject(windDef, filePath);
      
      loadProject(fullProject);
      setFilePath(filePath);
      addRecentFile(filePath);
      setRecentFiles(getRecentFiles());
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };
  
  const handleDuplicateLayer = () => {
    if (activeLayerId) duplicateLayer(activeLayerId);
  };
  
  const handleDeleteLayer = () => {
    if (activeLayerId) removeLayer(activeLayerId);
  };
  
  const handleValidate = async () => {
    try {
      const windDef = projectToWindDefinition(project);
      const result = await validateWindCmd(JSON.stringify(windDef));
      
      if (result.valid) {
        console.log('✓ Definition is valid');
      } else {
        const errors = result.errors?.map(e => `• ${e.field}: ${e.message}`).join('\n') || 'Unknown errors';
        console.error('Validation failed:', errors);
      }
    } catch (error) {
      console.error('Validation error:', error);
    }
  };
  
  useEffect(() => {
    const handleToggle = (event: Event) => {
      const target = event.target as HTMLDetailsElement;
      if (target.open) {
        // Close all other menus when one opens
        menuRefs.current.forEach(menu => {
          if (menu && menu !== target && menu.open) {
            menu.open = false;
          }
        });
      }
    };

    menuRefs.current.forEach(menu => {
      if (menu) {
        menu.addEventListener('toggle', handleToggle);
      }
    });

    return () => {
      menuRefs.current.forEach(menu => {
        if (menu) {
          menu.removeEventListener('toggle', handleToggle);
        }
      });
    };
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedInsideMenu = menuRefs.current.some(menu => 
        menu && menu.contains(event.target as Node)
      );
      
      if (!clickedInsideMenu) {
        menuRefs.current.forEach(menu => {
          if (menu && menu.open) {
            menu.open = false;
          }
        });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleDocsLink = () => {
    void openExternal("https://cameronbrooks11.github.io/fiberpath");
  };

  return (
    <nav className="menubar">
      <div className="menubar__brand">
        <span className="menubar__brand-icon">⬢</span>
        <span className="menubar__brand-name">FiberPath</span>
      </div>
      
      <div className="menubar__menus">
        <details className="menubar__menu" ref={el => menuRefs.current[0] = el}>
          <summary>File</summary>
          <div className="menubar__dropdown">
            <button onClick={handleNewProject}>
              New Project<span className="menubar__shortcut">Ctrl+N</span>
            </button>
            <button onClick={handleOpen}>
              Open<span className="menubar__shortcut">Ctrl+O</span>
            </button>
            <hr />
            <button onClick={handleSave}>
              Save<span className="menubar__shortcut">Ctrl+S</span>
            </button>
            <button onClick={handleSaveAs}>
              Save As<span className="menubar__shortcut">Ctrl+Shift+S</span>
            </button>
            <hr />
            <button onClick={handleExportGcode}>
              Export G-code<span className="menubar__shortcut">Ctrl+E</span>
            </button>
            {recentFiles.length > 0 && (
              <>
                <hr />
                <div className="menubar__submenu-label">Recent Files</div>
                {recentFiles.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => handleOpenRecent(file.path)}
                    className="menubar__recent-file"
                    title={file.path}
                  >
                    <span className="menubar__recent-name">{formatRecentFileName(file.path)}</span>
                    <span className="menubar__recent-path">{formatRecentFilePath(file.path)}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </details>

        <details className="menubar__menu" ref={el => menuRefs.current[1] = el}>
          <summary>Edit</summary>
          <div className="menubar__dropdown">
            <button disabled>Undo<span className="menubar__shortcut">Ctrl+Z</span></button>
            <button disabled>Redo<span className="menubar__shortcut">Ctrl+Y</span></button>
            <hr />
            <button onClick={handleDuplicateLayer} disabled={!activeLayerId}>
              Duplicate Layer<span className="menubar__shortcut">Ctrl+D</span>
            </button>
            <button onClick={handleDeleteLayer} disabled={!activeLayerId}>
              Delete Layer<span className="menubar__shortcut">Del</span>
            </button>
          </div>
        </details>

        <details className="menubar__menu" ref={el => menuRefs.current[2] = el}>
          <summary>View</summary>
          <div className="menubar__dropdown">
            <button onClick={onToggleLeftPanel} disabled={!onToggleLeftPanel}>
              Toggle Parameters Panel
            </button>
            <button onClick={onToggleRightPanel} disabled={!onToggleRightPanel}>
              Toggle Properties Panel
            </button>
            <hr />
            <button disabled>Reset Layout</button>
            <button disabled>Zoom In<span className="menubar__shortcut">Ctrl++</span></button>
            <button disabled>Zoom Out<span className="menubar__shortcut">Ctrl+-</span></button>
            <button disabled>Zoom to Fit<span className="menubar__shortcut">Ctrl+0</span></button>
          </div>
        </details>

        <details className="menubar__menu" ref={el => menuRefs.current[3] = el}>
          <summary>Tools</summary>
          <div className="menubar__dropdown">
            <button onClick={handleValidate}>
              Validate Definition
            </button>
            <hr />
            <button disabled>Check for Updates</button>
            <button disabled>Preferences<span className="menubar__shortcut">Ctrl+,</span></button>
          </div>
        </details>

        <details className="menubar__menu" ref={el => menuRefs.current[4] = el}>
          <summary>Help</summary>
          <div className="menubar__dropdown">
            <button onClick={handleDocsLink}>
              Documentation<span className="menubar__external">↗</span>
            </button>
            <hr />
            <button onClick={() => setShowAboutDialog(true)}>
              About FiberPath
            </button>
            <button disabled>Check for Updates</button>
            <button onClick={() => setShowDiagnosticsDialog(true)}>
              Diagnostics
            </button>
          </div>
        </details>
      </div>

      <AboutDialog 
        isOpen={showAboutDialog} 
        onClose={() => setShowAboutDialog(false)} 
      />
      
      <DiagnosticsDialog 
        isOpen={showDiagnosticsDialog} 
        onClose={() => setShowDiagnosticsDialog(false)} 
      />
    </nav>
  );
}
