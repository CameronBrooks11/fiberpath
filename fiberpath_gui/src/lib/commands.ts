import { invoke } from "@tauri-apps/api/core";

export interface PlanSummary {
  output: string;
  commands: number;
  layers?: number;
  metadata?: Record<string, unknown>;
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
}

export async function planWind(inputPath: string, outputPath?: string) {
  return invoke<PlanSummary>("plan_wind", { inputPath, outputPath });
}

export async function simulateProgram(gcodePath: string) {
  return invoke<SimulationSummary>("simulate_program", { gcodePath });
}

export async function previewPlot(gcodePath: string, scale: number) {
  return invoke<PlotPreviewPayload>("plot_preview", { gcodePath, scale });
}

export async function streamProgram(gcodePath: string, options: { port?: string; baudRate: number; dryRun: boolean }) {
  return invoke<StreamSummary>("stream_program", {
    gcodePath,
    port: options.port,
    baudRate: options.baudRate,
    dryRun: options.dryRun,
  });
}
