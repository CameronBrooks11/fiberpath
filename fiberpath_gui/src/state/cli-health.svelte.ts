import { invoke } from "@tauri-apps/api/core";
import { CliHealthResponseSchema } from "../lib/schemas";

export type CliStatus = "ready" | "checking" | "unavailable" | "unknown";

/**
 * CLI/sidecar backend health (replaces useCliHealth + CliHealthContext).
 * Invokes the `check_cli_health` Tauri command and validates the response.
 */
export class CliHealth {
  status = $state<CliStatus>("unknown");
  version = $state<string | null>(null);
  errorMessage = $state<string | null>(null);
  lastChecked = $state<Date | null>(null);

  readonly isHealthy = $derived(this.status === "ready");
  readonly isUnavailable = $derived(this.status === "unavailable");

  #timer: ReturnType<typeof setInterval> | null = null;

  async refresh() {
    this.status = "checking";
    try {
      const response = await invoke<unknown>("check_cli_health");
      const parsed = CliHealthResponseSchema.safeParse(response);
      if (!parsed.success) {
        throw new Error(`Invalid response schema: ${parsed.error.message}`);
      }
      this.status = parsed.data.healthy ? "ready" : "unavailable";
      this.version = parsed.data.version;
      this.errorMessage = parsed.data.errorMessage;
    } catch (e) {
      this.status = "unavailable";
      this.version = null;
      this.errorMessage =
        e instanceof Error ? e.message : typeof e === "string" ? e : "Unknown error occurred";
    } finally {
      this.lastChecked = new Date();
    }
  }

  /** Refresh now and then every `intervalMs`; returns an unsubscribe. */
  startPolling(intervalMs = 30000): () => void {
    void this.refresh();
    if (this.#timer === null) {
      this.#timer = setInterval(() => void this.refresh(), intervalMs);
    }
    return () => this.stopPolling();
  }

  stopPolling() {
    if (this.#timer !== null) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
  }
}

export const cliHealth = new CliHealth();
