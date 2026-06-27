import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn(() => Promise.reject(new Error("no cli"))) }));

import { render, screen, fireEvent } from "@testing-library/svelte";
import CliHealthWarning from "./CliHealthWarning.svelte";
import { cliHealth } from "../../state/cli-health.svelte";

beforeEach(() => {
  cliHealth.status = "ready";
});

describe("CliHealthWarning.svelte", () => {
  it("shows nothing while the backend is healthy", () => {
    cliHealth.status = "ready";
    render(CliHealthWarning);
    expect(screen.queryByText("CLI Backend Unavailable")).toBeNull();
  });

  it("shows the banner when unavailable and opens the details dialog", async () => {
    cliHealth.status = "unavailable";
    cliHealth.errorMessage = "CLI not found on PATH";
    render(CliHealthWarning);

    expect(screen.getByText("CLI Backend Unavailable")).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "Details" }));
    // the dialog (separate title) opens
    expect(screen.getByText("Troubleshooting")).toBeInTheDocument();
    expect(screen.getByText("CLI not found on PATH")).toBeInTheDocument();
  });
});
