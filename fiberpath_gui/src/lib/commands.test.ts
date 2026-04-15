import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import {
  planWind,
  simulateProgram,
  previewPlot,
  streamProgram,
  plotDefinition,
  saveWindFile,
  loadWindFile,
  validateWindDefinition,
} from "./commands";
import { CommandError, ValidationError } from "./schemas";

// Remove retry wrapping so each test controls invoke directly
vi.mock("./retry", () => ({
  withRetry: (fn: (...args: unknown[]) => unknown, _opts?: unknown) =>
    (...args: unknown[]) =>
      fn(...args),
  retry: (fn: () => unknown) => fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

beforeEach(() => {
  mockInvoke.mockReset();
});

describe("commands", () => {
  describe("planWind()", () => {
    it("returns validated PlanSummary on success", async () => {
      mockInvoke.mockResolvedValue({
        output: "/out.gcode",
        commands: 10,
        layers: 2,
      });
      const result = await planWind("/input.wind");
      expect(result.output).toBe("/out.gcode");
      expect(result.commands).toBe(10);
    });

    it("throws CommandError when invoke rejects", async () => {
      mockInvoke.mockRejectedValue(new Error("backend error"));
      await expect(planWind("/input.wind")).rejects.toBeInstanceOf(CommandError);
    });

    it("passes outputPath to invoke when provided", async () => {
      mockInvoke.mockResolvedValue({ output: "/out.gcode", commands: 1, layers: 1 });
      await planWind("/input.wind", "/out.gcode");
      expect(mockInvoke).toHaveBeenCalledWith(
        "plan_wind",
        expect.objectContaining({ outputPath: "/out.gcode" }),
      );
    });
  });

  describe("simulateProgram()", () => {
    it("returns validated SimulationSummary on success", async () => {
      mockInvoke.mockResolvedValue({
        commands_executed: 100,
        moves: 80,
        estimated_time_s: 30,
        total_distance_mm: 5000,
        average_feed_rate_mmpm: 400,
        tow_length_mm: 4800,
      });
      const result = await simulateProgram("/file.gcode");
      expect(result.commands_executed).toBe(100);
    });

    it("throws CommandError when invoke rejects", async () => {
      mockInvoke.mockRejectedValue(new Error("sim error"));
      await expect(simulateProgram("/file.gcode")).rejects.toBeInstanceOf(
        CommandError,
      );
    });
  });

  describe("previewPlot()", () => {
    it("returns validated PlotPreviewPayload on success", async () => {
      mockInvoke.mockResolvedValue({
        path: "/plot.png",
        imageBase64: "abc123",
        warnings: [],
      });
      const result = await previewPlot("/file.gcode", 1.0);
      expect(result.imageBase64).toBe("abc123");
    });

    it("throws CommandError on invoke failure", async () => {
      mockInvoke.mockRejectedValue(new Error("plot error"));
      await expect(previewPlot("/file.gcode", 1.0)).rejects.toBeInstanceOf(
        CommandError,
      );
    });
  });

  describe("streamProgram()", () => {
    it("returns validated StreamSummary on success", async () => {
      mockInvoke.mockResolvedValue({
        status: "complete",
        commands: 50,
        total: 50,
        baudRate: 250000,
        dryRun: true,
      });
      const result = await streamProgram("/file.gcode", {
        baudRate: 250000,
        dryRun: true,
      });
      expect(result.commands).toBe(50);
    });

    it("throws CommandError on invoke failure", async () => {
      mockInvoke.mockRejectedValue(new Error("stream error"));
      await expect(
        streamProgram("/file.gcode", { baudRate: 250000, dryRun: false }),
      ).rejects.toBeInstanceOf(CommandError);
    });

    it("passes port and dryRun options to invoke", async () => {
      mockInvoke.mockResolvedValue({ status: "complete", commands: 1, total: 1, baudRate: 115200, dryRun: false });
      await streamProgram("/file.gcode", {
        port: "/dev/ttyUSB0",
        baudRate: 115200,
        dryRun: false,
      });
      expect(mockInvoke).toHaveBeenCalledWith(
        "stream_program",
        expect.objectContaining({ port: "/dev/ttyUSB0", baudRate: 115200 }),
      );
    });
  });

  describe("plotDefinition()", () => {
    it("returns payload on success", async () => {
      mockInvoke.mockResolvedValue({ path: "/out.png", imageBase64: "xyz", warnings: [] });
      const result = await plotDefinition("{}", 3);
      expect(result.imageBase64).toBe("xyz");
    });

    it("throws CommandError on failure", async () => {
      mockInvoke.mockRejectedValue(new Error("fail"));
      await expect(plotDefinition("{}", 3)).rejects.toBeInstanceOf(CommandError);
    });
  });

  describe("saveWindFile()", () => {
    it("resolves without error on success", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await expect(saveWindFile("/path.wind", "{}")).resolves.toBeUndefined();
    });

    it("throws CommandError on failure", async () => {
      mockInvoke.mockRejectedValue(new Error("write error"));
      await expect(saveWindFile("/path.wind", "{}")).rejects.toBeInstanceOf(
        CommandError,
      );
    });
  });

  describe("loadWindFile()", () => {
    it("returns string content on success", async () => {
      mockInvoke.mockResolvedValue('{"key":"value"}');
      const result = await loadWindFile("/path.wind");
      expect(result).toBe('{"key":"value"}');
    });

    it("throws CommandError when result is not a string", async () => {
      mockInvoke.mockResolvedValue(42);
      await expect(loadWindFile("/path.wind")).rejects.toBeInstanceOf(
        CommandError,
      );
    });

    it("throws CommandError on invoke failure", async () => {
      mockInvoke.mockRejectedValue(new Error("read error"));
      await expect(loadWindFile("/path.wind")).rejects.toBeInstanceOf(
        CommandError,
      );
    });
  });

  describe("validateWindDefinition()", () => {
    it("returns ValidationResult on success", async () => {
      mockInvoke.mockResolvedValue({ status: "ok", valid: true, errors: [] });
      const result = await validateWindDefinition("{}");
      expect(result.status).toBe("ok");
    });

    it("throws CommandError on failure", async () => {
      mockInvoke.mockRejectedValue(new Error("validation backend error"));
      await expect(validateWindDefinition("{}")).rejects.toBeInstanceOf(
        CommandError,
      );
    });
  });
});
