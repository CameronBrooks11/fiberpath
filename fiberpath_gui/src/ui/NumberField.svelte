<script lang="ts">
  // Reusable numeric input: label + unit + error, using the existing global
  // `param-form__*` classes (no restyling here — the restrained redesign is #216).
  // The parent owns parse/validate/store wiring and passes raw strings back, so
  // this stays a dumb primitive.
  interface Props {
    id: string;
    label: string;
    value: number;
    unit?: string;
    step?: string | number;
    min?: string | number;
    max?: string | number;
    error?: string;
    /** Optional help text shown as a hoverable ⓘ next to the label. */
    tooltip?: string;
    oninput: (raw: string) => void;
    onblur?: (raw: string) => void;
  }

  let {
    id,
    label,
    value,
    unit,
    step,
    min,
    max,
    error,
    tooltip,
    oninput,
    onblur,
  }: Props = $props();
</script>

<div class="param-form__group">
  <div class="label-row">
    <label for={id} class="param-form__label">{label}</label>
    {#if tooltip}
      <button type="button" class="field-help" aria-label={`Help: ${label}`} title={tooltip}>ⓘ</button>
    {/if}
  </div>
  <div class="param-form__input-wrapper">
    <input
      {id}
      type="number"
      {step}
      {min}
      {max}
      {value}
      class="param-form__input"
      class:param-form__input--with-unit={!!unit}
      class:param-form__input--error={!!error}
      oninput={(e) => oninput(e.currentTarget.value)}
      onblur={(e) => onblur?.(e.currentTarget.value)}
    />
    {#if unit}<span class="param-form__unit">{unit}</span>{/if}
  </div>
  {#if error}<span class="param-form__error">{error}</span>{/if}
</div>

<style>
  .label-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-xs);
  }
  .label-row .param-form__label {
    margin-bottom: 0;
  }
  /* Keyboard-accessible help: a real button (was a title-only span). */
  .field-help {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1rem;
    height: 1rem;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: help;
    font-size: var(--font-size-xs);
  }
  .field-help:hover {
    color: var(--color-text);
  }
</style>
