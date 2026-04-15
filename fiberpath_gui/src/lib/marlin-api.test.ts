import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  listSerialPorts,
  startInteractive,
  connectMarlin,
  disconnectMarlin,
  sendCommand,
  streamFile,
  pauseStream,
  resumeStream,
  cancelStream,
  stopStream,
  onStreamStarted,
  onStreamProgress,
  onStreamComplete,
  onStreamError,
} from "./marlin-api";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);
const mockListen = vi.mocked(listen);

beforeEach(() => {
  mockInvoke.mockReset();
  mockListen.mockReset();
});

describe("marlin-api", () => {
  describe("listSerialPorts()", () => {
    it("returns array of serial ports", async () => {
      const ports = [{ port: "/dev/ttyUSB0", description: "USB Serial" }];
      mockInvoke.mockResolvedValue(ports);
      const result = await listSerialPorts();
      expect(result).toEqual(ports);
      expect(mockInvoke).toHaveBeenCalledWith("marlin_list_ports");
    });
  });

  describe("startInteractive()", () => {
    it("resolves on success", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await expect(startInteractive()).resolves.toBeUndefined();
      expect(mockInvoke).toHaveBeenCalledWith("marlin_start_interactive");
    });
  });

  describe("connectMarlin()", () => {
    it("calls invoke with port and baud rate", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await connectMarlin("/dev/ttyUSB0", 250000);
      expect(mockInvoke).toHaveBeenCalledWith("marlin_connect", {
        port: "/dev/ttyUSB0",
        baudRate: 250000,
      });
    });

    it("uses default baud rate of 250000", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await connectMarlin("/dev/ttyUSB0");
      expect(mockInvoke).toHaveBeenCalledWith(
        "marlin_connect",
        expect.objectContaining({ baudRate: 250000 }),
      );
    });
  });

  describe("disconnectMarlin()", () => {
    it("calls marlin_disconnect", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await disconnectMarlin();
      expect(mockInvoke).toHaveBeenCalledWith("marlin_disconnect");
    });
  });

  describe("sendCommand()", () => {
    it("returns response array on success", async () => {
      mockInvoke.mockResolvedValue(["ok"]);
      const result = await sendCommand("G28");
      expect(result).toEqual(["ok"]);
      expect(mockInvoke).toHaveBeenCalledWith("marlin_send_command", {
        gcode: "G28",
      });
    });

    it("re-throws and logs errors", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      mockInvoke.mockRejectedValue(new Error("command failed"));
      await expect(sendCommand("G28")).rejects.toThrow("command failed");
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe("streamFile()", () => {
    it("calls marlin_stream_file with path", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await streamFile("/path/to/file.gcode");
      expect(mockInvoke).toHaveBeenCalledWith("marlin_stream_file", {
        filePath: "/path/to/file.gcode",
      });
    });
  });

  describe("pauseStream()", () => {
    it("calls marlin_pause", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await pauseStream();
      expect(mockInvoke).toHaveBeenCalledWith("marlin_pause");
    });
  });

  describe("resumeStream()", () => {
    it("calls marlin_resume", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await resumeStream();
      expect(mockInvoke).toHaveBeenCalledWith("marlin_resume");
    });
  });

  describe("cancelStream()", () => {
    it("calls marlin_cancel", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await cancelStream();
      expect(mockInvoke).toHaveBeenCalledWith("marlin_cancel");
    });
  });

  describe("stopStream()", () => {
    it("calls marlin_stop", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await stopStream();
      expect(mockInvoke).toHaveBeenCalledWith("marlin_stop");
    });
  });

  describe("event listeners", () => {
    const mockUnlisten = vi.fn();

    beforeEach(() => {
      mockListen.mockImplementation(async (event, callback) => {
        // Immediately invoke callback with a synthetic payload so the handler path is exercised
        (callback as (e: { payload: unknown }) => void)({ payload: { test: true } });
        return mockUnlisten;
      });
    });

    it("onStreamStarted registers listener and returns unlisten fn", async () => {
      const cb = vi.fn();
      const unlisten = await onStreamStarted(cb);
      expect(mockListen).toHaveBeenCalledWith("stream-started", expect.any(Function));
      expect(cb).toHaveBeenCalledWith({ test: true });
      expect(unlisten).toBe(mockUnlisten);
    });

    it("onStreamProgress registers listener and returns unlisten fn", async () => {
      const cb = vi.fn();
      const unlisten = await onStreamProgress(cb);
      expect(mockListen).toHaveBeenCalledWith("stream-progress", expect.any(Function));
      expect(cb).toHaveBeenCalled();
      expect(unlisten).toBe(mockUnlisten);
    });

    it("onStreamComplete registers listener and returns unlisten fn", async () => {
      const cb = vi.fn();
      const unlisten = await onStreamComplete(cb);
      expect(mockListen).toHaveBeenCalledWith("stream-complete", expect.any(Function));
      expect(cb).toHaveBeenCalled();
      expect(unlisten).toBe(mockUnlisten);
    });

    it("onStreamError registers listener and returns unlisten fn", async () => {
      const cb = vi.fn();
      const unlisten = await onStreamError(cb);
      expect(mockListen).toHaveBeenCalledWith("stream-error", expect.any(Function));
      expect(cb).toHaveBeenCalled();
      expect(unlisten).toBe(mockUnlisten);
    });
  });
});
