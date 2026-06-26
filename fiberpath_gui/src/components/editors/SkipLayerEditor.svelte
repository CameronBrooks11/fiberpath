<script lang="ts">
  import { projectSession } from "../../state/project-session.svelte";
  import { parseNumericInput } from "../../lib/numericFields";
  import { debounce } from "../../lib/debounce";
  import NumberField from "../../ui/NumberField.svelte";

  let { layerId }: { layerId: string } = $props();

  const layer = $derived(projectSession.document.layers.find((l) => l.id === layerId));
  const skip = $derived(layer?.type === "skip" ? layer.skip : undefined);
  const backend = $derived(projectSession.validationErrors);

  const validate = (value: number): string | undefined =>
    Number.isNaN(value) ? "Rotation must be a valid number" : undefined;

  let error = $state<string | undefined>(undefined);
  const debouncedValidate = debounce((v: number) => (error = validate(v)));

  // Validate on mount and on every change (mirrors the React editor's effect on
  // the store value), so re-selecting an invalid layer shows its error.
  $effect(() => {
    if (skip) {
      debouncedValidate(skip.mandrel_rotation);
    } else {
      error = undefined;
    }
  });

  function onInput(raw: string) {
    const value = parseNumericInput(raw);
    projectSession.setValidationError("layers.skip.mandrel_rotation", undefined);
    projectSession.updateLayer(layerId, { skip: { mandrel_rotation: value } });
    // The $effect above re-validates from the updated store value.
  }

  function onBlur(raw: string) {
    error = validate(parseNumericInput(raw));
  }
</script>

{#if skip}
  <div class="editor">
    <NumberField
      id={`rotation-${layerId}`}
      label="Mandrel Rotation"
      tooltip="Mandrel-only rotation performed with no fiber deposition. Use this to reposition the start phase between winding layers."
      unit="°"
      step="0.1"
      value={skip.mandrel_rotation}
      error={error ?? backend["layers.skip.mandrel_rotation"]}
      oninput={onInput}
      onblur={onBlur}
    />
    <p class="editor__hint">
      Applies a dry rotation step between layers to shift where the next winding
      path starts.
    </p>
  </div>
{/if}

<style>
  .editor__hint {
    margin: var(--spacing-sm) 0 0;
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    line-height: var(--line-height-normal);
  }
</style>
