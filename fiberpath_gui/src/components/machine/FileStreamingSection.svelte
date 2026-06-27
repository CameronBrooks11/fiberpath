<script lang="ts">
  import { machineSession as m } from "../../state/machine-session.svelte";
  import InspectorSection from "../../ui/InspectorSection.svelte";
</script>

<InspectorSection title="File Streaming">
  <div class="file">
    <span class="file__label">File</span>
    <span class="file__name">{m.selectedFile ?? "No file selected"}</span>
    {#if m.selectedFile && !m.isStreaming}
      <button class="icon-btn" title="Clear file selection" aria-label="Clear file selection" onclick={() => m.clearFile()}>×</button>
    {/if}
  </div>
  <button class="btn btn--secondary btn--block" disabled={m.isStreaming} onclick={() => m.selectFile()}>Select File</button>

  {#if m.progress}
    <div class="progress">
      <div class="progress__head">
        <span>Progress</span><span>{m.progress.sent} / {m.progress.total}</span>
      </div>
      <progress value={m.progress.sent} max={Math.max(m.progress.total, 1)}></progress>
      <div class="progress__cmd"><span>Current</span><span class="mono">{m.progress.currentCommand}</span></div>
    </div>
  {/if}

  <div class="controls">
    {#if !m.isStreaming}
      <button class="btn btn--primary btn--block" disabled={!m.canStartStream} onclick={() => m.startStream()}>
        Start Stream
      </button>
    {:else}
      <div class="grid">
        {#if !m.isPaused}
          <button class="btn btn--warn" disabled={m.streamControlLoading} onclick={() => m.pause()}>Pause</button>
        {:else}
          <button class="btn btn--primary" disabled={m.streamControlLoading} onclick={() => m.resume()}>Resume</button>
        {/if}
        {#if m.isPaused}
          <button class="btn btn--secondary" disabled={m.streamControlLoading} onclick={() => m.cancel()} title="Cancel job (stays connected)">
            Cancel Job
          </button>
        {:else}
          <button
            class="btn btn--danger"
            disabled={m.streamControlLoading}
            onclick={() => m.stop()}
            title="Emergency stop (M112) — WARNING: disconnects the controller">Stop</button
          >
        {/if}
      </div>
    {/if}
  </div>
</InspectorSection>

<style>
  .file {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-xs);
  }
  .file__label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  .file__name {
    flex: 1;
    min-width: 0;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .controls {
    margin-top: var(--spacing-sm);
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-xs);
  }
  .progress {
    margin-top: var(--spacing-sm);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  .progress__head,
  .progress__cmd {
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-sm);
  }
  .progress progress {
    width: 100%;
    height: 6px;
    margin: var(--spacing-xs) 0;
    accent-color: var(--status-success-fg);
  }
  .mono {
    font-family: var(--font-family-mono);
    color: var(--color-text);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
