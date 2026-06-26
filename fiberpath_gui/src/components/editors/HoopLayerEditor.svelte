<script lang="ts">
  import { projectSession } from "../../state/project-session.svelte";

  let { layerId }: { layerId: string } = $props();

  const layer = $derived(projectSession.document.layers.find((l) => l.id === layerId));
  const hoop = $derived(layer?.type === "hoop" ? layer.hoop : undefined);

  function setTerminal(checked: boolean) {
    projectSession.updateLayer(layerId, { hoop: { terminal: checked } });
  }
</script>

{#if hoop}
  <div class="editor">
    <label class="editor__check">
      <input
        type="checkbox"
        checked={hoop.terminal}
        onchange={(e) => setTerminal(e.currentTarget.checked)}
      />
      <span>Terminal Layer</span>
    </label>
    <p class="editor__hint">
      Mark this as a terminal layer (first or last layer in the wind definition).
    </p>
  </div>
{/if}

<style>
  .editor__check {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-base);
    cursor: pointer;
  }
  .editor__hint {
    margin: var(--spacing-sm) 0 0;
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    line-height: var(--line-height-normal);
  }
</style>
