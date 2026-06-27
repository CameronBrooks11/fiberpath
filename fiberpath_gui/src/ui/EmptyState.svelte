<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    title: string;
    hint?: string;
    /** "error" tints the title with the error color. */
    tone?: "default" | "error";
    action?: Snippet;
  }

  let { title, hint, tone = "default", action }: Props = $props();
</script>

<div class="empty" data-tone={tone}>
  <p class="empty__title">{title}</p>
  {#if hint}<p class="empty__hint">{hint}</p>{/if}
  {#if action}<div class="empty__action">{@render action()}</div>{/if}
</div>

<style>
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xl);
    text-align: center;
    color: var(--color-text-muted);
  }
  .empty__title {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--color-text);
  }
  .empty[data-tone="error"] .empty__title {
    color: var(--status-error-fg);
  }
  .empty__hint {
    margin: 0;
    font-size: var(--font-size-xs);
  }
  .empty__action {
    margin-top: var(--spacing-xs);
  }
</style>
