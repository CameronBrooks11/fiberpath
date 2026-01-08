import { open as openExternal } from "@tauri-apps/plugin-shell";
import { useEffect, useRef } from "react";

interface MenuBarProps {
  onNewProject?: () => void;
  onOpenProject?: () => void;
  onSaveProject?: () => void;
  onSaveProjectAs?: () => void;
  onExportGcode?: () => void;
  onToggleLeftPanel?: () => void;
  onToggleRightPanel?: () => void;
  onPlanWind?: () => void;
  onSimulate?: () => void;
  onStream?: () => void;
  onValidate?: () => void;
}

export function MenuBar({
  onNewProject,
  onOpenProject,
  onSaveProject,
  onSaveProjectAs,
  onExportGcode,
  onToggleLeftPanel,
  onToggleRightPanel,
  onPlanWind,
  onSimulate,
  onStream,
  onValidate,
}: MenuBarProps) {
  const menuRefs = useRef<(HTMLDetailsElement | null)[]>([]);
  
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
            <button onClick={onNewProject} disabled={!onNewProject}>
              New Project<span className="menubar__shortcut">Ctrl+N</span>
            </button>
            <button onClick={onOpenProject} disabled={!onOpenProject}>
              Open<span className="menubar__shortcut">Ctrl+O</span>
            </button>
            <hr />
            <button onClick={onSaveProject} disabled={!onSaveProject}>
              Save<span className="menubar__shortcut">Ctrl+S</span>
            </button>
            <button onClick={onSaveProjectAs} disabled={!onSaveProjectAs}>
              Save As<span className="menubar__shortcut">Ctrl+Shift+S</span>
            </button>
            <hr />
            <button onClick={onExportGcode} disabled={!onExportGcode}>
              Export G-code<span className="menubar__shortcut">Ctrl+E</span>
            </button>
          </div>
        </details>

        <details className="menubar__menu" ref={el => menuRefs.current[1] = el}>
          <summary>Edit</summary>
          <div className="menubar__dropdown">
            <button disabled>Undo<span className="menubar__shortcut">Ctrl+Z</span></button>
            <button disabled>Redo<span className="menubar__shortcut">Ctrl+Y</span></button>
            <hr />
            <button disabled>Duplicate Layer<span className="menubar__shortcut">Ctrl+D</span></button>
            <button disabled>Delete Layer<span className="menubar__shortcut">Del</span></button>
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
            <button onClick={onPlanWind} disabled={!onPlanWind}>
              Plan Wind
            </button>
            <button onClick={onSimulate} disabled={!onSimulate}>
              Simulate
            </button>
            <button onClick={onStream} disabled={!onStream}>
              Stream
            </button>
            <hr />
            <button onClick={onValidate} disabled={!onValidate}>
              Validate Definition
            </button>
          </div>
        </details>

        <details className="menubar__menu" ref={el => menuRefs.current[4] = el}>
          <summary>Help</summary>
          <div className="menubar__dropdown">
            <button onClick={handleDocsLink}>
              Documentation<span className="menubar__external">↗</span>
            </button>
            <hr />
            <button disabled>About FiberPath</button>
            <button disabled>Check for Updates</button>
            <button disabled>Diagnostics</button>
          </div>
        </details>
      </div>
    </nav>
  );
}
