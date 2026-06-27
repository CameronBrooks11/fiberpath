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

  // Associate help text and the validation error with the input so screen
  // readers announce them (title alone is not reliably exposed).
  const describedBy = $derived(
    [tooltip ? `${id}-help` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") ||
      undefined,
  );
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
      aria-invalid={error ? "true" : undefined}
      aria-describedby={describedBy}
      oninput={(e) => oninput(e.currentTarget.value)}
      onblur={(e) => onblur?.(e.currentTarget.value)}
    />
    {#if unit}<span class="param-form__unit">{unit}</span>{/if}
  </div>
  {#if tooltip}<span id={`${id}-help`} class="field-sr-only">{tooltip}</span>{/if}
  {#if error}<span id={`${id}-error`} class="param-form__error">{error}</span>{/if}
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
  /* Visually hidden but exposed to assistive tech (linked via aria-describedby). */
  .field-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
