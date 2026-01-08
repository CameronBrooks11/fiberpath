import { invoke } from "@tauri-apps/api/core";
import { withRetry } from "./retry";

export type AxisFormat = "xyz" | "xab";

export interface PlanSummary {
  output: string;
  commands: number;
  layers?: number;
  metadata?: Record<string, unknown>;
  axisFormat?: string;
}

export interface SimulationSummary {
  commands_executed: number;
  moves: number;
  estimated_time_s: number;
  total_distance_mm: number;
  average_feed_rate_mmpm: number;
  tow_length_mm: number;
}

export interface StreamSummary {
  status: string;
  commands: number;
  total: number;
  baudRate: number;
  dryRun: boolean;
}

export interface PlotPreviewPayload {
  path: string;
  imageBase64: string;
  warnings: string[];
}

// Core commands with retry logic for transient failures
export const planWind = withRetry(
  async (inputPath: string, outputPath?: string, axisFormat?: AxisFormat) => {
    return invoke<PlanSummary>("plan_wind", { inputPath, outputPath, axisFormat });
  },
  { maxAttempts: 2 } // Lower retry for planning - it's usually not transient
);

export const simulateProgram = withRetry(
  async (gcodePath: string) => {
    return invoke<SimulationSummary>("simulate_program", { gcodePath });
  }
);

export const previewPlot = withRetry(
  async (gcodePath: string, scale: number, outputPath?: string) => {
    return invoke<PlotPreviewPayload>("plot_preview", { gcodePath, scale, outputPath });
  }
);

export async function streamProgram(gcodePath: string, options: { port?: string; baudRate: number; dryRun: boolean }) {
  // Don't retry streaming - it's a deliberate serial operation
  return invoke<StreamSummary>("stream_program", {
    gcodePath,
    port: options.port,
    baudRate: options.baudRate,
    dryRun: options.dryRun,
  });
}

export const plotDefinition = withRetry(
  async (definitionJson: string, visibleLayerCount: number, outputPath?: string) => {
    return invoke<PlotPreviewPayload>("plot_definition", { definitionJson, visibleLayerCount, outputPath });
  }
);

// File operations with retry logic
export const saveWindFile = withRetry(
  async (path: string, content: string) => {
    return invoke<void>("save_wind_file", { path, content });
  }
);

export const loadWindFile = withRetry(
  async (path: string) => {
    return invoke<string>("load_wind_file", { path });
  }
);

export interface ValidationResult {
  valid?: boolean;
  status?: string;  // Backend returns "ok" or "error"
  path?: string;
  errors?: Array<{ field: string; message: string }>;
}

export const validateWindDefinition = withRetry(
  async (definitionJson: string) => {
    return invoke<ValidationResult>("validate_wind_definition", { definitionJson });
  },
  { maxAttempts: 2 } // Lower retry for validation - errors are usually not transient
);
