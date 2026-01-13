/**
 * Tauri commands for Marlin integration
 *
 * This module provides typed wrappers around the Tauri commands
 * for interacting with Marlin controllers via serial connection.
 */

import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type {
  SerialPort,
  StreamProgress,
  StreamComplete,
  StreamError,
  StreamStarted,
} from "./tauri-types";

/**
 * List available serial ports
 */
export async function listSerialPorts(): Promise<SerialPort[]> {
  return await invoke<SerialPort[]>("marlin_list_ports");
}

/**
 * Start the interactive Python subprocess
 */
export async function startInteractive(): Promise<void> {
  await invoke("marlin_start_interactive");
}

/**
 * Connect to a Marlin controller
 */
export async function connectMarlin(
  port: string,
  baudRate: number = 250000,
): Promise<void> {
  await invoke("marlin_connect", { port, baudRate });
}

/**
 * Disconnect from the Marlin controller
 */
export async function disconnectMarlin(): Promise<void> {
  await invoke("marlin_disconnect");
}

/**
 * Send a single G-code command to the Marlin controller
 */
export async function sendCommand(gcode: string): Promise<string[]> {
  try {
    const result = await invoke<string[]>("marlin_send_command", { gcode });
    return result;
  } catch (error) {
    console.error("Command failed:", error);
    throw error;
  }
}

/**
 * Stream a G-code file to the Marlin controller
 */
export async function streamFile(filePath: string): Promise<void> {
  await invoke("marlin_stream_file", { filePath });
}

/**
 * Pause streaming (sends M0)
 */
export async function pauseStream(): Promise<void> {
  await invoke("marlin_pause");
}

/**
 * Resume streaming (sends M108)
 */
export async function resumeStream(): Promise<void> {
  await invoke("marlin_resume");
}

/**
 * Cancel streaming (clean exit, stays connected)
 */
export async function cancelStream(): Promise<void> {
  await invoke("marlin_cancel");
}

/**
 * Stop streaming (sends M112 emergency stop)
 */
export async function stopStream(): Promise<void> {
  await invoke("marlin_stop");
}

/**
 * Listen for streaming started events
 */
export async function onStreamStarted(
  callback: (started: StreamStarted) => void,
): Promise<UnlistenFn> {
  return await listen<StreamStarted>("stream-started", (event) => {
    callback(event.payload);
  });
}

/**
 * Listen for streaming progress events
 */
export async function onStreamProgress(
  callback: (progress: StreamProgress) => void,
): Promise<UnlistenFn> {
  return await listen<StreamProgress>("stream-progress", (event) => {
    callback(event.payload);
  });
}

/**
 * Listen for streaming complete events
 */
export async function onStreamComplete(
  callback: (complete: StreamComplete) => void,
): Promise<UnlistenFn> {
  return await listen<StreamComplete>("stream-complete", (event) => {
    callback(event.payload);
  });
}

/**
 * Listen for streaming error events
 */
export async function onStreamError(
  callback: (error: StreamError) => void,
): Promise<UnlistenFn> {
  return await listen<StreamError>("stream-error", (event) => {
    callback(event.payload);
  });
}
