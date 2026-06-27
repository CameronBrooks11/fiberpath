<script lang="ts">
  import { notifications, type ToastType } from "../state/notifications.svelte";

  const symbol = (t: ToastType) =>
    t === "success" ? "✓" : t === "error" ? "✕" : t === "warning" ? "⚠" : "ⓘ";
</script>

{#if notifications.toasts.length > 0}
  <div class="toast-container">
    {#each notifications.toasts as toast (toast.id)}
      <div class="toast" data-type={toast.type} role="status">
        <span class="toast__icon" aria-hidden="true">{symbol(toast.type)}</span>
        <span class="toast__message">{toast.message}</span>
        <button
          class="toast__close"
          aria-label="Close notification"
          onclick={() => notifications.dismiss(toast.id)}>×</button
        >
      </div>
    {/each}
  </div>
{/if}

<style>
  /* Self-contained (ported from the React ToastContainer.css, which the Svelte
     entry doesn't import). A fixed overlay so it floats above the app shell. */
  .toast-container {
    position: fixed;
    top: calc(var(--menubar-height) + var(--statusbar-height) + var(--spacing-lg));
    right: var(--spacing-xl);
    z-index: var(--z-index-toast);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    max-width: 25rem;
  }
  .toast {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md) var(--spacing-lg);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    background: var(--color-bg-panel);
    box-shadow: var(--shadow-md);
  }
  .toast__icon {
    flex-shrink: 0;
  }
  .toast__message {
    flex: 1;
    color: var(--color-text);
    font-size: var(--font-size-base);
    line-height: var(--line-height-normal);
  }
  .toast[data-type="success"] {
    border-color: var(--status-success);
  }
  .toast[data-type="success"] .toast__icon {
    color: var(--status-success);
  }
  .toast[data-type="error"] {
    border-color: var(--status-error);
  }
  .toast[data-type="error"] .toast__icon {
    color: var(--status-error);
  }
  .toast[data-type="warning"] {
    border-color: var(--status-warning);
  }
  .toast[data-type="warning"] .toast__icon {
    color: var(--status-warning);
  }
  .toast[data-type="info"] {
    border-color: var(--status-info);
  }
  .toast[data-type="info"] .toast__icon {
    color: var(--status-info);
  }
  .toast__close {
    flex-shrink: 0;
    appearance: none;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    font-size: var(--font-size-lg);
    line-height: 1;
    padding: 0 var(--spacing-xs);
    transition: var(--transition-colors);
  }
  .toast__close:hover {
    color: var(--color-text);
  }
</style>
