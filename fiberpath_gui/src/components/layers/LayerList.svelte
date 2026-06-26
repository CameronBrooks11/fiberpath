<script lang="ts">
  import { projectSession } from "../../state/project-session.svelte";
  import type { Layer, LayerType } from "../../types/project";

  const layers = $derived(projectSession.document.layers);
  const selectedId = $derived(projectSession.selectedLayerId);

  let showPicker = $state(false);
  let dragIndex = $state<number | null>(null);

  const TYPES: { type: LayerType; icon: string; label: string }[] = [
    { type: "hoop", icon: "○", label: "Hoop Layer" },
    { type: "helical", icon: "⟋", label: "Helical Layer" },
    { type: "skip", icon: "↻", label: "Skip Layer" },
  ];

  function icon(type: LayerType): string {
    return type === "hoop" ? "○" : type === "helical" ? "⟋" : "↻";
  }
  function summary(layer: Layer): string {
    switch (layer.type) {
      case "hoop":
        return layer.hoop?.terminal ? "Hoop (Terminal)" : "Hoop";
      case "helical":
        return `Helical ${layer.helical?.wind_angle ?? 45}°`;
      case "skip":
        return `Skip ${layer.skip?.mandrel_rotation ?? 90}°`;
    }
  }

  function addLayer(type: LayerType) {
    projectSession.addLayer(type);
    showPicker = false;
  }

  // --- Reordering: native HTML5 drag for pointer, arrow keys for a11y ---
  function onDrop(target: number) {
    if (dragIndex !== null && dragIndex !== target) {
      projectSession.reorderLayers(dragIndex, target);
    }
    dragIndex = null;
  }
  function onHandleKey(e: KeyboardEvent, index: number) {
    if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      projectSession.reorderLayers(index, index - 1);
    } else if (e.key === "ArrowDown" && index < layers.length - 1) {
      e.preventDefault();
      projectSession.reorderLayers(index, index + 1);
    }
  }
</script>

<div class="layers">
  <div class="layers__bar">
    <button class="layers__add" onclick={() => (showPicker = !showPicker)}>+ Add Layer</button>
  </div>

  {#if showPicker}
    <div class="picker" role="menu">
      {#each TYPES as t (t.type)}
        <button class="picker__opt" role="menuitem" onclick={() => addLayer(t.type)}>
          <span class="picker__icon">{t.icon}</span>{t.label}
        </button>
      {/each}
    </div>
  {/if}

  {#if layers.length === 0}
    <p class="layers__empty">No layers yet. Click “Add Layer” to get started.</p>
  {:else}
    <ul class="layers__list">
      {#each layers as layer, index (layer.id)}
        <li
          class="row"
          class:row--active={layer.id === selectedId}
          class:row--drop={dragIndex !== null && dragIndex !== index}
          draggable="true"
          ondragstart={() => (dragIndex = index)}
          ondragover={(e) => e.preventDefault()}
          ondrop={(e) => {
            e.preventDefault();
            onDrop(index);
          }}
          ondragend={() => (dragIndex = null)}
        >
          <button
            class="row__select"
            onclick={() => projectSession.selectLayer(layer.id)}
            aria-pressed={layer.id === selectedId}
          >
            <span class="row__index">{index + 1}</span>
            <span class="row__icon">{icon(layer.type)}</span>
            <span class="row__text">
              <span class="row__type">{layer.type}</span>
              <span class="row__summary">{summary(layer)}</span>
            </span>
          </button>
          <span
            class="row__handle"
            role="button"
            tabindex="0"
            aria-label={`Reorder ${layer.type} layer ${index + 1} with arrow keys`}
            onkeydown={(e) => onHandleKey(e, index)}>⋮⋮</span
          >
          <button
            class="row__act"
            title="Duplicate layer"
            onclick={(e) => {
              e.stopPropagation();
              projectSession.duplicateLayer(layer.id);
            }}>⧉</button
          >
          <button
            class="row__act row__act--danger"
            title="Remove layer"
            onclick={(e) => {
              e.stopPropagation();
              projectSession.removeLayer(layer.id);
            }}>×</button
          >
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .layers__bar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: var(--spacing-sm);
  }
  .layers__add {
    appearance: none;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    font-size: var(--font-size-xs);
    padding: 2px var(--spacing-sm);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
  }
  .layers__add:hover {
    background: var(--color-bg-hover);
  }
  .picker {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: var(--spacing-sm);
  }
  .picker__opt {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    appearance: none;
    border: 1px solid var(--color-border);
    background: var(--color-bg-panel-alt);
    color: var(--color-text);
    font-size: var(--font-size-sm);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
  }
  .picker__opt:hover {
    background: var(--color-bg-hover);
  }
  .picker__icon {
    width: 1rem;
    text-align: center;
    color: var(--color-text-muted);
  }
  .layers__empty {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .layers__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    background: var(--color-bg-panel-alt);
  }
  .row--active {
    border-color: var(--color-primary);
  }
  .row--drop {
    border-style: dashed;
  }
  .row__select {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex: 1;
    min-width: 0;
    appearance: none;
    border: none;
    background: transparent;
    color: var(--color-text);
    text-align: left;
    padding: var(--spacing-xs) var(--spacing-sm);
    cursor: pointer;
  }
  .row__index {
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    min-width: 1rem;
  }
  .row__icon {
    color: var(--color-primary);
  }
  .row__text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .row__type {
    font-size: var(--font-size-sm);
    text-transform: capitalize;
  }
  .row__summary {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  .row__handle {
    color: var(--color-text-muted);
    cursor: grab;
    padding: 0 2px;
    user-select: none;
  }
  .row__handle:focus-visible {
    outline: 2px solid var(--color-primary);
  }
  .row__act {
    appearance: none;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    padding: 0 var(--spacing-xs);
    cursor: pointer;
  }
  .row__act:hover {
    color: var(--color-text);
  }
  .row__act--danger:hover {
    color: var(--status-error);
  }
</style>
