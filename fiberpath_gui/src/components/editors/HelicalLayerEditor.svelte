<script lang="ts">
  import { projectSession } from "../../state/project-session.svelte";
  import { parseNumericInput } from "../../lib/numericFields";
  import { debounce } from "../../lib/debounce";
  import {
    validateHelicalField,
    getHelicalGeometryHint,
    type HelicalNumericField,
  } from "../../lib/helicalValidation";
  import type { HelicalLayer } from "../../types/project";
  import type { UiValidationField } from "../../lib/validationErrors";
  import NumberField from "../../ui/NumberField.svelte";

  let { layerId }: { layerId: string } = $props();

  interface FieldConfig {
    field: HelicalNumericField;
    label: string;
    tooltip: string;
    unit?: string;
    step?: string;
  }

  const CONFIGS: FieldConfig[] = [
    { field: "wind_angle", label: "Wind Angle", unit: "°", step: "0.1",
      tooltip: "Angle between fiber path and mandrel axis: 0 degrees is axial, 90 degrees is hoop. Helical layers must be > 0 and <= 90." },
    { field: "pattern_number", label: "Pattern Number", step: "1",
      tooltip: "How many helical bands the layer is split into around the circumference. Must be a positive integer and must divide the computed circuit count." },
    { field: "skip_index", label: "Skip Index", step: "1",
      tooltip: "Stride used to move between helical bands each circuit. Must be a positive integer and coprime with pattern number to visit every band." },
    { field: "lock_degrees", label: "Lock Degrees", unit: "°", step: "0.1",
      tooltip: "Extra mandrel rotation at the lock point for stable termination/restart alignment between circuits." },
    { field: "lead_in_mm", label: "Lead-in", unit: "mm", step: "0.1",
      tooltip: "Linear approach distance before the main winding path starts; used to smooth fiber entry onto the part." },
    { field: "lead_out_degrees", label: "Lead-out Degrees", unit: "°", step: "0.1",
      tooltip: "Extra mandrel rotation after the main path ends; used to smooth exit and maintain placement continuity." },
  ];

  const FIELD_MAP: Record<HelicalNumericField, UiValidationField> = {
    wind_angle: "layers.helical.wind_angle",
    pattern_number: "layers.helical.pattern_number",
    skip_index: "layers.helical.skip_index",
    lock_degrees: "layers.helical.lock_degrees",
    lead_in_mm: "layers.helical.lead_in_mm",
    lead_out_degrees: "layers.helical.lead_out_degrees",
  };

  const layer = $derived(projectSession.document.layers.find((l) => l.id === layerId));
  const helical = $derived(layer?.type === "helical" ? layer.helical : undefined);
  const backend = $derived(projectSession.validationErrors);

  let errors = $state<Partial<Record<HelicalNumericField, string>>>({});

  const validateAll = (h: HelicalLayer) => {
    const next: Partial<Record<HelicalNumericField, string>> = {};
    for (const c of CONFIGS) {
      const e = validateHelicalField(c.field, h[c.field], h);
      if (e) next[c.field] = e;
    }
    errors = next;
  };
  const debouncedValidateAll = debounce((h: HelicalLayer) => validateAll(h));

  // Validate on mount and whenever the helical values change (mirrors the React
  // editor's debounced effect on the store value), so re-selecting a layer that
  // already holds invalid values surfaces its errors without needing a keystroke.
  $effect(() => {
    if (helical) {
      debouncedValidateAll(helical);
    } else {
      errors = {};
    }
  });

  const isInteger = (field: HelicalNumericField) =>
    field === "pattern_number" || field === "skip_index";

  function onInput(field: HelicalNumericField, raw: string) {
    const h = helical;
    if (!h) return;
    const value = parseNumericInput(raw, isInteger(field));
    projectSession.setValidationError(FIELD_MAP[field], undefined);
    // pattern/skip share a coprimality rule — clear both so a fixed pair re-checks.
    if (isInteger(field)) {
      projectSession.setValidationError("layers.helical.pattern_number", undefined);
      projectSession.setValidationError("layers.helical.skip_index", undefined);
    }
    const nextHelical = { ...h, [field]: value };
    projectSession.updateLayer(layerId, { helical: nextHelical });
    // The $effect above re-validates from the updated store value.
  }

  function onBlur(field: HelicalNumericField, raw: string) {
    const h = helical;
    if (!h) return;
    const value = parseNumericInput(raw, isInteger(field));
    errors = { ...errors, [field]: validateHelicalField(field, value, h) };
  }

  function setSkipNearLock(checked: boolean) {
    const h = helical;
    if (!h) return;
    projectSession.updateLayer(layerId, { helical: { ...h, skip_initial_near_lock: checked } });
  }

  const geometryHint = $derived(
    helical
      ? getHelicalGeometryHint(
          helical,
          projectSession.document.mandrel.diameter,
          projectSession.document.tow.width,
        )
      : undefined,
  );
</script>

{#if helical}
  <div class="editor">
    {#each CONFIGS as config (config.field)}
      <NumberField
        id={`${config.field}-${layerId}`}
        label={config.label}
        tooltip={config.tooltip}
        unit={config.unit}
        step={config.step}
        value={helical[config.field]}
        error={errors[config.field] ?? backend[FIELD_MAP[config.field]]}
        oninput={(raw) => onInput(config.field, raw)}
        onblur={(raw) => onBlur(config.field, raw)}
      />
    {/each}

    {#if geometryHint}
      <p class="editor__hint editor__hint--warning">{geometryHint}</p>
    {/if}

    <label class="editor__check">
      <input
        type="checkbox"
        checked={helical.skip_initial_near_lock}
        onchange={(e) => setSkipNearLock(e.currentTarget.checked)}
      />
      <span>Skip Initial Near Lock</span>
    </label>
    <p class="editor__hint">
      Skip the first near-lock handling step. Enable only when you intentionally
      want custom lock behavior.
    </p>
  </div>
{/if}

<style>
  .editor__check {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-sm);
    font-size: var(--font-size-base);
    cursor: pointer;
  }
  .editor__hint {
    margin: var(--spacing-sm) 0 0;
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    line-height: var(--line-height-normal);
  }
  .editor__hint--warning {
    color: var(--status-warning-fg);
  }
</style>
