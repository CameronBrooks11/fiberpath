import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { open } from "@tauri-apps/plugin-dialog";
import { useStreamStore } from "../../stores/streamStore";
import { useToastStore } from "../../stores/toastStore";
import { DEFAULT_BAUD_RATE } from "../../lib/constants";
import { useConnectionActions } from "../../hooks/stream/useConnectionActions";
import { useStreamingActions } from "../../hooks/stream/useStreamingActions";
import { useManualCommandActions } from "../../hooks/stream/useManualCommandActions";
import { useStreamEvents } from "../../hooks/useStreamEvents";
import * as marlinApi from "../../lib/marlin-api";
import type {
  SerialPort,
  StreamComplete,
  StreamError,
  StreamProgress,
  StreamStarted,
} from "../../lib/tauri-types";
import type { UnlistenFn } from "@tauri-apps/api/event";

vi.mock("../../lib/marlin-api", () => ({
  listSerialPorts: vi.fn(),
  startInteractive: vi.fn(),
  connectMarlin: vi.fn(),
  disconnectMarlin: vi.fn(),
  sendCommand: vi.fn(),
  streamFile: vi.fn(),
  pauseStream: vi.fn(),
  resumeStream: vi.fn(),
  cancelStream: vi.fn(),
  stopStream: vi.fn(),
  onStreamStarted: vi.fn(),
  onStreamProgress: vi.fn(),
  onStreamComplete: vi.fn(),
  onStreamError: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}));

const resetStreamState = () => {
  useStreamStore.setState({
    status: "disconnected",
    selectedPort: null,
    baudRate: DEFAULT_BAUD_RATE,
    availablePorts: [],
    isStreaming: false,
    selectedFile: null,
    progress: null,
    commandLoading: false,
    streamControlLoading: false,
    logEntries: [],
    autoScroll: true,
  });
};

describe("Integration Tests - Stream Lifecycle", () => {
  beforeEach(() => {
    resetStreamState();
    useToastStore.setState({ toasts: [] });
    vi.clearAllMocks();

    vi.mocked(marlinApi.listSerialPorts).mockResolvedValue([]);
    vi.mocked(marlinApi.startInteractive).mockResolvedValue();
    vi.mocked(marlinApi.connectMarlin).mockResolvedValue();
    vi.mocked(marlinApi.disconnectMarlin).mockResolvedValue();
    vi.mocked(marlinApi.streamFile).mockResolvedValue();
    vi.mocked(marlinApi.pauseStream).mockResolvedValue();
    vi.mocked(marlinApi.resumeStream).mockResolvedValue();
    vi.mocked(marlinApi.cancelStream).mockResolvedValue();
    vi.mocked(marlinApi.stopStream).mockResolvedValue();
    vi.mocked(marlinApi.sendCommand).mockResolvedValue(["ok"]);
    vi.mocked(open).mockResolvedValue(null);
  });

  it("refreshes ports and auto-selects first available port", async () => {
    const ports: SerialPort[] = [
      {
        port: "COM7",
        description: "USB Serial",
        hwid: "USB-123",
      },
    ];
    vi.mocked(marlinApi.listSerialPorts).mockResolvedValue(ports);

    const { result } = renderHook(() => useConnectionActions());

    await act(async () => {
      await result.current.refreshPorts();
    });

    expect(useStreamStore.getState().availablePorts).toEqual(ports);
    expect(useStreamStore.getState().selectedPort).toBe("COM7");
  });

  it("connects successfully and clears stale streaming state", async () => {
    useStreamStore.getState().setSelectedPort("COM3");
    useStreamStore.getState().setSelectedFile("old-file.gcode");
    useStreamStore.getState().setIsStreaming(true);

    const { result } = renderHook(() => useConnectionActions());

    await act(async () => {
      await result.current.handleConnect();
    });

    const state = useStreamStore.getState();
    expect(marlinApi.startInteractive).toHaveBeenCalledTimes(1);
    expect(marlinApi.connectMarlin).toHaveBeenCalledWith(
      "COM3",
      DEFAULT_BAUD_RATE,
    );
    expect(state.status).toBe("connected");
    expect(state.isStreaming).toBe(false);
    expect(state.selectedFile).toBeNull();
  });

  it("runs streaming action transitions for start/pause/resume/cancel/stop", async () => {
    useStreamStore.getState().markConnected();
    useStreamStore.getState().setIsStreaming(true);
    vi.mocked(open).mockResolvedValue("C:/jobs/part.gcode");

    const { result } = renderHook(() => useStreamingActions());

    await act(async () => {
      await result.current.handleSelectFile();
    });

    expect(useStreamStore.getState().selectedFile).toBe("part.gcode");

    await act(async () => {
      await result.current.handleStartStream();
    });

    expect(marlinApi.streamFile).toHaveBeenCalledWith("C:/jobs/part.gcode");

    await act(async () => {
      await result.current.handlePause();
    });
    expect(useStreamStore.getState().status).toBe("paused");

    await act(async () => {
      await result.current.handleResume();
    });
    expect(useStreamStore.getState().status).toBe("connected");

    await act(async () => {
      await result.current.handleCancel();
    });
    expect(useStreamStore.getState().status).toBe("connected");
    expect(useStreamStore.getState().isStreaming).toBe(false);
    expect(useStreamStore.getState().progress).toBeNull();

    await act(async () => {
      await result.current.handleStop();
    });
    expect(useStreamStore.getState().status).toBe("disconnected");
  });

  it("sends manual commands and logs command/response entries", async () => {
    useStreamStore.getState().markConnected();

    const { result } = renderHook(() => useManualCommandActions());

    await act(async () => {
      await result.current.handleSendCommand("M114");
    });

    const entries = useStreamStore.getState().logEntries;
    expect(marlinApi.sendCommand).toHaveBeenCalledWith("M114");
    expect(
      entries.some(
        (entry) => entry.type === "command" && entry.content === "M114",
      ),
    ).toBe(true);
    expect(
      entries.some((entry) => entry.type === "response" && entry.content === "ok"),
    ).toBe(true);
  });

  it("applies event-driven lifecycle transitions and feedback", async () => {
    let startedHandler: ((event: StreamStarted) => void) | undefined;
    let progressHandler: ((event: StreamProgress) => void) | undefined;
    let completeHandler: ((event: StreamComplete) => void) | undefined;
    let errorHandler: ((event: StreamError) => void) | undefined;

    const unlisten = vi.fn() as unknown as UnlistenFn;

    vi.mocked(marlinApi.onStreamStarted).mockImplementation(async (callback) => {
      startedHandler = callback;
      return unlisten;
    });
    vi.mocked(marlinApi.onStreamProgress).mockImplementation(async (callback) => {
      progressHandler = callback;
      return unlisten;
    });
    vi.mocked(marlinApi.onStreamComplete).mockImplementation(async (callback) => {
      completeHandler = callback;
      return unlisten;
    });
    vi.mocked(marlinApi.onStreamError).mockImplementation(async (callback) => {
      errorHandler = callback;
      return unlisten;
    });

    renderHook(() => useStreamEvents());

    act(() => {
      startedHandler?.({ file: "part.gcode", totalCommands: 100 });
    });
    expect(useStreamStore.getState().isStreaming).toBe(true);

    act(() => {
      progressHandler?.({
        commandsSent: 25,
        commandsTotal: 100,
        command: "G1 X10",
        dryRun: false,
      });
    });
    expect(useStreamStore.getState().progress?.sent).toBe(25);

    act(() => {
      completeHandler?.({ commandsSent: 100, commandsTotal: 100 });
    });
    expect(useStreamStore.getState().status).toBe("connected");
    expect(useStreamStore.getState().isStreaming).toBe(false);
    expect(useStreamStore.getState().progress).toBeNull();

    useStreamStore.getState().markStreamingStarted();
    useStreamStore.getState().setProgress({
      sent: 50,
      total: 100,
      currentCommand: "G1 X20",
    });

    act(() => {
      errorHandler?.({ code: "stream_error", message: "serial lost" });
    });

    expect(useStreamStore.getState().status).toBe("connected");
    expect(useStreamStore.getState().isStreaming).toBe(false);
    expect(useStreamStore.getState().progress).toBeNull();
  });
});
