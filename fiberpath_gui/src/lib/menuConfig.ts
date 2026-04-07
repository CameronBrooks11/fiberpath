export type MenuId = "file" | "edit" | "view" | "tools" | "help";

export type MenuActionId =
  | "file.new"
  | "file.open"
  | "file.save"
  | "file.saveAs"
  | "file.export"
  | "edit.undo"
  | "edit.redo"
  | "edit.duplicateLayer"
  | "edit.deleteLayer"
  | "view.toggleLeftPanel"
  | "view.toggleRightPanel"
  | "view.resetLayout"
  | "view.zoomIn"
  | "view.zoomOut"
  | "view.zoomFit"
  | "tools.validateDefinition"
  | "tools.checkUpdates"
  | "tools.preferences"
  | "help.documentation"
  | "help.about"
  | "help.checkUpdates"
  | "help.diagnostics";

interface MenuActionEntry {
  type: "action";
  actionId: MenuActionId;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  external?: boolean;
}

interface MenuSeparatorEntry {
  type: "separator";
}

export type MenuEntry = MenuActionEntry | MenuSeparatorEntry;

export interface MenuDefinition {
  id: MenuId;
  label: string;
  entries: MenuEntry[];
}

export const MENU_DEFINITIONS: MenuDefinition[] = [
  {
    id: "file",
    label: "File",
    entries: [
      { type: "action", actionId: "file.new", label: "New Project", shortcut: "Ctrl+N" },
      { type: "action", actionId: "file.open", label: "Open", shortcut: "Ctrl+O" },
      { type: "separator" },
      { type: "action", actionId: "file.save", label: "Save", shortcut: "Ctrl+S" },
      {
        type: "action",
        actionId: "file.saveAs",
        label: "Save As",
        shortcut: "Ctrl+Shift+S",
      },
      { type: "separator" },
      {
        type: "action",
        actionId: "file.export",
        label: "Export G-code",
        shortcut: "Ctrl+E",
      },
    ],
  },
  {
    id: "edit",
    label: "Edit",
    entries: [
      { type: "action", actionId: "edit.undo", label: "Undo", shortcut: "Ctrl+Z", disabled: true },
      { type: "action", actionId: "edit.redo", label: "Redo", shortcut: "Ctrl+Y", disabled: true },
      { type: "separator" },
      {
        type: "action",
        actionId: "edit.duplicateLayer",
        label: "Duplicate Layer",
        shortcut: "Ctrl+D",
      },
      {
        type: "action",
        actionId: "edit.deleteLayer",
        label: "Delete Layer",
        shortcut: "Del",
      },
    ],
  },
  {
    id: "view",
    label: "View",
    entries: [
      {
        type: "action",
        actionId: "view.toggleLeftPanel",
        label: "Toggle Parameters Panel",
      },
      {
        type: "action",
        actionId: "view.toggleRightPanel",
        label: "Toggle Properties Panel",
      },
      { type: "separator" },
      {
        type: "action",
        actionId: "view.resetLayout",
        label: "Reset Layout",
        disabled: true,
      },
      {
        type: "action",
        actionId: "view.zoomIn",
        label: "Zoom In",
        shortcut: "Ctrl++",
        disabled: true,
      },
      {
        type: "action",
        actionId: "view.zoomOut",
        label: "Zoom Out",
        shortcut: "Ctrl+-",
        disabled: true,
      },
      {
        type: "action",
        actionId: "view.zoomFit",
        label: "Zoom to Fit",
        shortcut: "Ctrl+0",
        disabled: true,
      },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    entries: [
      {
        type: "action",
        actionId: "tools.validateDefinition",
        label: "Validate Definition",
      },
      { type: "separator" },
      {
        type: "action",
        actionId: "tools.checkUpdates",
        label: "Check for Updates",
        disabled: true,
      },
      {
        type: "action",
        actionId: "tools.preferences",
        label: "Preferences",
        shortcut: "Ctrl+,",
        disabled: true,
      },
    ],
  },
  {
    id: "help",
    label: "Help",
    entries: [
      {
        type: "action",
        actionId: "help.documentation",
        label: "Documentation",
        external: true,
      },
      { type: "separator" },
      { type: "action", actionId: "help.about", label: "About FiberPath" },
      {
        type: "action",
        actionId: "help.checkUpdates",
        label: "Check for Updates",
        disabled: true,
      },
      {
        type: "action",
        actionId: "help.diagnostics",
        label: "Diagnostics",
      },
    ],
  },
];
