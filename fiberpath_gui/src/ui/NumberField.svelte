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
    oninput,
    onblur,
  }: Props = $props();
</script>

<div class="param-form__group">
  <label for={id} class="param-form__label">{label}</label>
  <div class="param-form__input-wrapper">
    <input
      {id}
      type="number"
      {step}
      {min}
      {max}
      {value}
      class="param-form__input"
      class:param-form__input--error={!!error}
      oninput={(e) => oninput(e.currentTarget.value)}
      onblur={(e) => onblur?.(e.currentTarget.value)}
    />
    {#if unit}<span class="param-form__unit">{unit}</span>{/if}
  </div>
  {#if error}<span class="param-form__error">{error}</span>{/if}
</div>
