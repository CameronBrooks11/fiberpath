<script lang="ts">
  import Dialog from "../../ui/Dialog.svelte";

  interface Props {
    version: string | null;
    errorMessage: string | null;
    onretry: () => void;
    onclose: () => void;
  }
  let { version, errorMessage, onretry, onclose }: Props = $props();
</script>

<Dialog title="Backend Unavailable" {onclose}>
  {#snippet footer()}
    <button class="btn btn--secondary" onclick={() => onretry()}>Retry</button>
    <button class="btn btn--ghost" onclick={onclose}>Close</button>
  {/snippet}

  <p>
    The FiberPath compute backend could not be detected, so planning, preview and
    file operations are disabled.
  </p>

  {#if errorMessage}
    <div class="diagnostics-section">
      <h3>Details</h3>
      <pre class="backend-unavailable__error">{errorMessage}</pre>
    </div>
  {/if}

  <div class="diagnostics-section">
    <h3>Troubleshooting</h3>
    <ul>
      <li>Reinstall or update FiberPath so the bundled backend is present.</li>
      <li>For a development build, install the Python package: <code>pip install -e .</code></li>
      <li>Then click <strong>Retry</strong>.</li>
    </ul>
    {#if version}<p>Detected version: {version}</p>{/if}
  </div>
</Dialog>

<style>
  .backend-unavailable__error {
    white-space: pre-wrap;
    word-break: break-word;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    color: var(--status-error);
    margin: 0;
  }
</style>
