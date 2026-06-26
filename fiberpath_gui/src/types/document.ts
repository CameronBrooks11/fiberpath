import type { Layer, Mandrel, Tow } from "./project";

/**
 * The persisted part of a project — exactly what round-trips to a `.wind` file.
 * Plain domain type (no Svelte), so both the tsc-checked modules (converters,
 * services) and the runes session can share it.
 */
export interface ProjectDocument {
  mandrel: Mandrel;
  tow: Tow;
  layers: Layer[];
  defaultFeedRate: number;
}

export function createEmptyDocument(): ProjectDocument {
  return {
    mandrel: { diameter: 150, wind_length: 750 },
    tow: { width: 12.7, thickness: 0.25 },
    layers: [],
    defaultFeedRate: 400,
  };
}
