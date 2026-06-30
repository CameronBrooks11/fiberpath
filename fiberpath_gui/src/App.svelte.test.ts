import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";

// The Machine workspace mounts real marlin-api wiring; stub it so the shell tests
// don't reach for a Tauri runtime.
vi.mock("./lib/marlin-api", () => ({
  listSerialPorts: vi.fn(() => Promise.resolve([])),
}));
// On mount the shell invokes Tauri commands (CLI-health poll, file-association
// pickup). Drive them per-command so each test controls what the shell sees.
const HEALTHY = { healthy: true, version: "test", errorMessage: null };
const defaultInvoke = (cmd: string): Promise<unknown> =>
  cmd === "take_opened_file" ? Promise.resolve(null) : Promise.resolve(HEALTHY);
const mockInvoke = vi.fn(
  (cmd: string, _args?: Record<string, unknown>): Promise<unknown> => defaultInvoke(cmd),
);
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (cmd: string, args?: Record<string, unknown>) => mockInvoke(cmd, args),
}));
// The shell subscribes to a Tauri event for warm file-association opens.
const mockListen = vi.fn(
  (_event: string, _handler: unknown): Promise<() => void> => Promise.resolve(() => {}),
);
vi.mock("@tauri-apps/api/event", () => ({
  listen: (event: string, handler: unknown) => mockListen(event, handler),
}));

import App from "./App.svelte";
import { uiState } from "./state/ui-state.svelte";
import { projectSession } from "./state/project-session.svelte";
import * as fileOps from "./services/file-operations.svelte";

beforeEach(() => {
  mockInvoke.mockReset();
  mockInvoke.mockImplementation(defaultInvoke);
  mockListen.mockClear();
  uiState.setWorkspace("prepare");
  uiState.leftCollapsed = false;
  uiState.rightCollapsed = false;
  uiState.drawerOpen = false;
  projectSession.newDocument();
});

describe("App.svelte (shell)", () => {
  it("renders the Prepare workspace with the config forms and viewport", () => {
    render(App);
    expect(screen.getByText("Mandrel Parameters")).toBeInTheDocument();
    expect(screen.getByText("Tow Parameters")).toBeInTheDocument();
    expect(screen.getByText("Machine Settings")).toBeInTheDocument();
    // empty viewport (no layers yet)
    expect(screen.getByText("No layers to visualize")).toBeInTheDocument();
    expect(screen.getByText("Layer Properties")).toBeInTheDocument();
  });

  it("switches to the Machine workspace on Alt+2 and back on Alt+1", async () => {
    render(App);
    await fireEvent.keyDown(window, { key: "2", altKey: true });
    expect(screen.getByText("Connection")).toBeInTheDocument(); // machine workspace
    expect(screen.queryByText("Mandrel Parameters")).toBeNull();

    await fireEvent.keyDown(window, { key: "1", altKey: true });
    expect(screen.getByText("Mandrel Parameters")).toBeInTheDocument();
  });

  it("hides the left inspector when collapsed", () => {
    uiState.leftCollapsed = true;
    render(App);
    expect(screen.queryByText("Mandrel Parameters")).toBeNull();
    // viewport still present
    expect(screen.getByText("No layers to visualize")).toBeInTheDocument();
  });

  it("opens the utility drawer from its handle", async () => {
    render(App);
    expect(screen.queryByText(/Console, G-code and diagnostics/)).toBeNull();
    await fireEvent.click(screen.getByRole("button", { name: /Utility/ }));
    expect(screen.getByText(/Console, G-code and diagnostics/)).toBeInTheDocument();
  });

  it("opens a .wind file handed over by the OS on launch and shows Prepare", async () => {
    mockInvoke.mockImplementation((cmd: string) =>
      cmd === "take_opened_file"
        ? Promise.resolve("/spools/part.wind")
        : Promise.resolve({ healthy: true, version: "test", errorMessage: null }),
    );
    const openRecent = vi.spyOn(fileOps, "openRecent").mockResolvedValue(true);
    uiState.setWorkspace("machine");

    render(App);
    await vi.waitFor(() => expect(openRecent).toHaveBeenCalledWith("/spools/part.wind"));
    expect(uiState.workspace).toBe("prepare");

    // It also listens for warm opens (second launch / macOS Apple Event).
    expect(mockListen).toHaveBeenCalledWith("open-wind-file", expect.any(Function));
    openRecent.mockRestore();
  });

  it("does not open anything when no file was handed over", async () => {
    const openRecent = vi.spyOn(fileOps, "openRecent").mockResolvedValue(true);
    render(App);
    await vi.waitFor(() => expect(mockInvoke).toHaveBeenCalledWith("take_opened_file", undefined));
    expect(openRecent).not.toHaveBeenCalled();
    openRecent.mockRestore();
  });

  it("blocks unload only when the document is dirty", () => {
    render(App);

    const clean = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(clean);
    expect(clean.defaultPrevented).toBe(false);

    projectSession.updateMandrel({ diameter: 123 });
    const dirty = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(dirty);
    expect(dirty.defaultPrevented).toBe(true);
  });
});
