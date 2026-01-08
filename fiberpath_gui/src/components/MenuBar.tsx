import { open as openExternal } from "@tauri-apps/plugin-shell";
import { useEffect, useRef, useState } from "react";
import { useProjectStore } from "../state/projectStore";
import { getRecentFiles, formatRecentFileName, formatRecentFilePath } from "../lib/recentFiles";
import { createFileOperations } from "../lib/fileOperations";
import { AboutDialog } from "./dialogs/AboutDialog";
import { DiagnosticsDialog } from "./dialogs/DiagnosticsDialog";

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
  
  // Create file operation handlers
  const fileOps = createFileOperations({
    project,
    newProject,
    loadProject,
    setFilePath,
    clearDirty,
    activeLayerId,
    duplicateLayer,
    removeLayer,
    updateRecentFiles: () => setRecentFiles(getRecentFiles()),
  });
  
  const handleDocsLink = () => {
    void openExternal("https://cameronbrooks11.github.io/fiberpath");
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
            <button onClick={fileOps.handleNewProject}>
              New Project<span className="menubar__shortcut">Ctrl+N</span>
            </button>
            <button onClick={fileOps.handleOpen}>
              Open<span className="menubar__shortcut">Ctrl+O</span>
            </button>
            <hr />
            <button onClick={fileOps.handleSave}>
              Save<span className="menubar__shortcut">Ctrl+S</span>
            </button>
            <button onClick={fileOps.handleSaveAs}>
              Save As<span className="menubar__shortcut">Ctrl+Shift+S</span>
            </button>
            <hr />
            <button onClick={fileOps.handleExportGcode}>
              Export G-code<span className="menubar__shortcut">Ctrl+E</span>
            </button>
            {recentFiles.length > 0 && (
              <>
                <hr />
                <div className="menubar__submenu-label">Recent Files</div>
                {recentFiles.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => fileOps.handleOpenRecent(file.path)}
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
            <button onClick={fileOps.handleDuplicateLayer} disabled={!activeLayerId}>
              Duplicate Layer<span className="menubar__shortcut">Ctrl+D</span>
            </button>
            <button onClick={fileOps.handleDeleteLayer} disabled={!activeLayerId}>
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
            <button onClick={fileOps.handleValidate}>
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
