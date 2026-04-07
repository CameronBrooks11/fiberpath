import { open as openExternal } from "@tauri-apps/plugin-shell";
import { Monitor, Moon, Sun } from "lucide-react";
import { useCallback, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useProjectStore } from "../stores/projectStore";
import { useTheme } from "../hooks/useTheme";
import { useFileOperations } from "../hooks/useFileOperations";
import { useMenubarInteractions } from "../hooks/useMenubarInteractions";
import { MENU_DEFINITIONS, type MenuActionId } from "../lib/menuConfig";
import {
  getRecentFiles,
  formatRecentFileName,
  formatRecentFilePath,
} from "../lib/recentFiles";
import { AboutDialog } from "./dialogs/AboutDialog";
import { DiagnosticsDialog } from "./dialogs/DiagnosticsDialog";
import { ExportConfirmationDialog } from "./dialogs/ExportConfirmationDialog";

interface MenuBarProps {
  onToggleLeftPanel?: () => void;
  onToggleRightPanel?: () => void;
}

type MenuActionHandler = () => unknown;

export function MenuBar({
  onToggleLeftPanel,
  onToggleRightPanel,
}: MenuBarProps) {
  const { project, activeLayerId } = useProjectStore(
    useShallow((state) => ({
      project: state.project,
      activeLayerId: state.project.activeLayerId,
    })),
  );

  const [recentFiles, setRecentFiles] = useState(getRecentFiles());
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showDiagnosticsDialog, setShowDiagnosticsDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const refreshRecentFiles = useCallback(() => {
    setRecentFiles(getRecentFiles());
  }, []);

  const fileOps = useFileOperations({
    onRecentFilesChanged: refreshRecentFiles,
  });

  const { setMenuRef } = useMenubarInteractions();
  const { theme, setTheme, isSystemTheme } = useTheme();

  const cycleTheme = () => {
    if (isSystemTheme) {
      setTheme("dark");
      return;
    }

    if (theme === "dark") {
      setTheme("light");
      return;
    }

    setTheme(null);
  };

  const themeState = isSystemTheme ? "system" : theme;
  const themeLabel = isSystemTheme
    ? "System"
    : theme === "dark"
      ? "Dark"
      : "Light";

  const actionHandlers: Partial<Record<MenuActionId, MenuActionHandler>> = {
    "file.new": fileOps.handleNewProject,
    "file.open": fileOps.handleOpen,
    "file.save": fileOps.handleSave,
    "file.saveAs": fileOps.handleSaveAs,
    "file.export": () => setShowExportDialog(true),
    "edit.duplicateLayer": fileOps.handleDuplicateLayer,
    "edit.deleteLayer": fileOps.handleDeleteLayer,
    "view.toggleLeftPanel": onToggleLeftPanel,
    "view.toggleRightPanel": onToggleRightPanel,
    "tools.validateDefinition": fileOps.handleValidate,
    "help.documentation": () =>
      openExternal("https://cameronbrooks11.github.io/fiberpath"),
    "help.about": () => setShowAboutDialog(true),
    "help.diagnostics": () => setShowDiagnosticsDialog(true),
  };

  const isActionDisabled = (
    actionId: MenuActionId,
    configDisabled: boolean | undefined,
  ) => {
    if (configDisabled) {
      return true;
    }

    if (
      (actionId === "edit.duplicateLayer" || actionId === "edit.deleteLayer") &&
      !activeLayerId
    ) {
      return true;
    }

    if (actionId === "view.toggleLeftPanel" && !onToggleLeftPanel) {
      return true;
    }

    if (actionId === "view.toggleRightPanel" && !onToggleRightPanel) {
      return true;
    }

    return !actionHandlers[actionId];
  };

  const handleMenuAction = (actionId: MenuActionId) => {
    const handler = actionHandlers[actionId];
    if (handler) {
      void handler();
    }
  };

  return (
    <nav className="menubar">
      <div className="menubar__brand">
        <span className="menubar__brand-icon">⬢</span>
        <span className="menubar__brand-name">FiberPath</span>
      </div>

      <div className="menubar__menus">
        {MENU_DEFINITIONS.map((menu, menuIndex) => (
          <details
            key={menu.id}
            className="menubar__menu"
            ref={setMenuRef(menuIndex)}
          >
            <summary>{menu.label}</summary>
            <div className="menubar__dropdown">
              {menu.entries.map((entry, entryIndex) => {
                if (entry.type === "separator") {
                  return <hr key={`${menu.id}-separator-${entryIndex}`} />;
                }

                return (
                  <button
                    key={entry.actionId}
                    onClick={() => handleMenuAction(entry.actionId)}
                    disabled={isActionDisabled(entry.actionId, entry.disabled)}
                  >
                    {entry.label}
                    {entry.shortcut && (
                      <span className="menubar__shortcut">{entry.shortcut}</span>
                    )}
                    {entry.external && (
                      <span className="menubar__external">↗</span>
                    )}
                  </button>
                );
              })}

              {menu.id === "file" && recentFiles.length > 0 && (
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
                      <span className="menubar__recent-name">
                        {formatRecentFileName(file.path)}
                      </span>
                      <span className="menubar__recent-path">
                        {formatRecentFilePath(file.path)}
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </details>
        ))}
      </div>

      <div className="menubar__spacer" />

      <button
        type="button"
        className="menubar__theme-toggle"
        data-theme-state={themeState}
        onClick={cycleTheme}
        title={`Theme: ${themeLabel} (click to cycle)`}
        aria-label={`Theme: ${themeLabel}. Click to cycle dark, light, and system.`}
      >
        {isSystemTheme ? (
          <Monitor size={16} aria-hidden="true" />
        ) : theme === "dark" ? (
          <Moon size={16} aria-hidden="true" />
        ) : (
          <Sun size={16} aria-hidden="true" />
        )}
      </button>

      <AboutDialog
        isOpen={showAboutDialog}
        onClose={() => setShowAboutDialog(false)}
      />

      <DiagnosticsDialog
        isOpen={showDiagnosticsDialog}
        onClose={() => setShowDiagnosticsDialog(false)}
      />

      {showExportDialog && (
        <ExportConfirmationDialog
          project={project}
          onConfirm={async () => {
            setShowExportDialog(false);
            await fileOps.handleExportGcode();
            refreshRecentFiles();
          }}
          onCancel={() => setShowExportDialog(false)}
        />
      )}
    </nav>
  );
}
