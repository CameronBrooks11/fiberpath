import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import MenuBar from "./MenuBar.svelte";
import { uiState } from "../state/ui-state.svelte";
import { projectSession } from "../state/project-session.svelte";
import * as fileOps from "../services/file-operations.svelte";

vi.mock("../services/file-operations.svelte", () => ({
  newProject: vi.fn(() => Promise.resolve(true)),
  openProject: vi.fn(() => Promise.resolve(true)),
  saveProject: vi.fn(() => Promise.resolve(true)),
  saveProjectAs: vi.fn(() => Promise.resolve(true)),
  exportGcode: vi.fn(() => Promise.resolve(true)),
}));

beforeEach(() => {
  vi.clearAllMocks();
  uiState.setWorkspace("prepare");
  uiState.drawerOpen = false;
  uiState.leftCollapsed = false;
  uiState.rightCollapsed = false;
  projectSession.newDocument();
});

describe("MenuBar.svelte", () => {
  it("renders the top-level menus", () => {
    render(MenuBar);
    for (const label of ["File", "Edit", "View", "Help"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("opens a dropdown on click and closes it on Escape", async () => {
    render(MenuBar);
    await fireEvent.click(screen.getByRole("button", { name: "File" }));
    expect(screen.getByRole("menuitem", { name: "New Project" })).toBeInTheDocument();
    await fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("menuitem", { name: "New Project" })).toBeNull();
  });

  it("closes the open dropdown on an outside pointer press", async () => {
    render(MenuBar);
    await fireEvent.click(screen.getByRole("button", { name: "File" }));
    expect(screen.getByRole("menuitem", { name: "New Project" })).toBeInTheDocument();

    await fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menuitem", { name: "New Project" })).toBeNull();
  });

  it("wires the File menu items to the file-operations service", async () => {
    render(MenuBar);
    const openFile = () => fireEvent.click(screen.getByRole("button", { name: "File" }));

    await openFile();
    await fireEvent.click(screen.getByRole("menuitem", { name: "New Project" }));
    expect(fileOps.newProject).toHaveBeenCalledOnce();

    await openFile();
    await fireEvent.click(screen.getByRole("menuitem", { name: "Open…" }));
    expect(fileOps.openProject).toHaveBeenCalledOnce();

    await openFile();
    await fireEvent.click(screen.getByRole("menuitem", { name: "Save" }));
    expect(fileOps.saveProject).toHaveBeenCalledOnce();

    await openFile();
    await fireEvent.click(screen.getByRole("menuitem", { name: "Export G-code" }));
    expect(fileOps.exportGcode).toHaveBeenCalledOnce();
  });

  it("Edit > Duplicate/Delete act on the selected layer", async () => {
    const id = projectSession.addLayer("hoop");
    projectSession.selectLayer(id);
    render(MenuBar);

    await fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    await fireEvent.click(screen.getByRole("menuitem", { name: "Duplicate Layer" }));
    expect(projectSession.document.layers).toHaveLength(2);

    await fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    await fireEvent.click(screen.getByRole("menuitem", { name: "Delete Layer" }));
    expect(projectSession.document.layers).toHaveLength(1);
  });

  it("View menu switches workspace and toggles the drawer", async () => {
    render(MenuBar);
    await fireEvent.click(screen.getByRole("button", { name: "View" }));
    await fireEvent.click(screen.getByRole("menuitem", { name: "Machine Workspace" }));
    expect(uiState.workspace).toBe("machine");

    await fireEvent.click(screen.getByRole("button", { name: "View" }));
    await fireEvent.click(screen.getByRole("menuitem", { name: "Toggle Bottom Drawer" }));
    expect(uiState.drawerOpen).toBe(true);
  });
});
