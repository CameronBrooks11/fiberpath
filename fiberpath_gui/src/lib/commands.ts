import { invoke } from "@tauri-apps/api/core";
import { withRetry } from "./retry";
import {
  PlanSummarySchema,
  SimulationSummarySchema,
  StreamSummarySchema,
  PlotPreviewPayloadSchema,
  ValidationResultSchema,
  validateData,
  CommandError,
  type PlanSummary,
  type SimulationSummary,
  type StreamSummary,
  type PlotPreviewPayload,
  type ValidationResult,
} from "./schemas";

export type AxisFormat = "xyz" | "xab";

// Core commands with retry logic and runtime validation
export const planWind = withRetry(
  async (inputPath: string, outputPath?: string, axisFormat?: AxisFormat): Promise<PlanSummary> => {
    try {
      const result = await invoke("plan_wind", { inputPath, outputPath, axisFormat });
      return validateData(PlanSummarySchema, result, "plan_wind response");
    } catch (error) {
      throw new CommandError("Failed to plan wind definition", "plan_wind", error);
    }
  },
  { maxAttempts: 2 } // Lower retry for planning - it's usually not transient
);

export const simulateProgram = withRetry(
  async (gcodePath: string): Promise<SimulationSummary> => {
    try {
      const result = await invoke("simulate_program", { gcodePath });
      return validateData(SimulationSummarySchema, result, "simulate_program response");
    } catch (error) {
      throw new CommandError("Failed to simulate program", "simulate_program", error);
    }
  }
);

export const previewPlot = withRetry(
  async (gcodePath: string, scale: number, outputPath?: string): Promise<PlotPreviewPayload> => {
    try {
      const result = await invoke("plot_preview", { gcodePath, scale, outputPath });
      return validateData(PlotPreviewPayloadSchema, result, "plot_preview response");
    } catch (error) {
      throw new CommandError("Failed to preview plot", "plot_preview", error);
    }
  }
);

export async function streamProgram(
  gcodePath: string, 
  options: { port?: string; baudRate: number; dryRun: boolean }
): Promise<StreamSummary> {
  // Don't retry streaming - it's a deliberate serial operation
  try {
    const result = await invoke("stream_program", {
      gcodePath,
      port: options.port,
      baudRate: options.baudRate,
      dryRun: options.dryRun,
    });
    return validateData(StreamSummarySchema, result, "stream_program response");
  } catch (error) {
    throw new CommandError("Failed to stream program", "stream_program", error);
  }
}

export const plotDefinition = withRetry(
  async (definitionJson: string, visibleLayerCount: number, outputPath?: string): Promise<PlotPreviewPayload> => {
    try {
      const result = await invoke("plot_definition", { definitionJson, visibleLayerCount, outputPath });
      return validateData(PlotPreviewPayloadSchema, result, "plot_definition response");
    } catch (error) {
      throw new CommandError("Failed to plot definition", "plot_definition", error);
    }
  }
);

// File operations with retry logic and runtime validation
export const saveWindFile = withRetry(
  async (path: string, content: string): Promise<void> => {
    try {
      await invoke("save_wind_file", { path, content });
    } catch (error) {
      throw new CommandError("Failed to save wind file", "save_wind_file", error);
    }
  }
);

export const loadWindFile = withRetry(
  async (path: string): Promise<string> => {
    try {
      const result = await invoke<string>("load_wind_file", { path });
      if (typeof result !== 'string') {
        throw new ValidationError("Expected string content from load_wind_file");
      }
      return result;
    } catch (error) {
      throw new CommandError("Failed to load wind file", "load_wind_file", error);
    }
  }
);

export const validateWindDefinition = withRetry(
  async (definitionJson: string): Promise<ValidationResult> => {
    try {
      const result = await invoke("validate_wind_definition", { definitionJson });
      return validateData(ValidationResultSchema, result, "validate_wind_definition response");
    } catch (error) {
      throw new CommandError("Failed to validate wind definition", "validate_wind_definition", error);
    }
  },
  { maxAttempts: 2 } // Lower retry for validation - errors are usually not transient
);
