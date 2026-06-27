<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    title: string;
    onclose: () => void;
    contentClass?: string;
    footer?: Snippet;
    children: Snippet;
  }

  let { title, onclose, contentClass = "", footer, children }: Props = $props();

  function onOverlay(e: MouseEvent) {
    if (e.target === e.currentTarget) onclose();
  }
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && onclose()} />

<!-- The backdrop click-to-close is an enhancement; Escape (window) and the × button
     are the accessible closers. role=presentation marks the backdrop as decorative. -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="dialog-overlay" role="presentation" onclick={onOverlay}>
  <div class={`dialog-content ${contentClass}`} role="dialog" aria-modal="true" aria-label={title}>
    <div class="dialog-header">
      <h2>{title}</h2>
      <button class="dialog-close" aria-label="Close" onclick={onclose}>×</button>
    </div>
    <div class="dialog-body">{@render children()}</div>
    {#if footer}<div class="dialog-footer">{@render footer()}</div>{/if}
  </div>
</div>
