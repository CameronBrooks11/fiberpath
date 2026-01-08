// Project state interfaces matching fiberpath/config/schemas.py

export interface Mandrel {
  diameter: number;      // mm
  wind_length: number;   // mm
}

export interface Tow {
  width: number;         // mm
  thickness: number;     // mm
}

export interface HoopLayer {
  terminal: boolean;
}

export interface HelicalLayer {
  wind_angle: number;              // degrees (0-90)
  pattern_number: number;
  skip_index: number;
  lock_degrees: number;
  lead_in_mm: number;
  lead_out_degrees: number;
  skip_initial_near_lock: boolean;
}

export interface SkipLayer {
  mandrel_rotation: number;        // degrees
}

export type LayerType = 'hoop' | 'helical' | 'skip';

export interface Layer {
  id: string;                      // UUID for React keys
  type: LayerType;
  hoop?: HoopLayer;
  helical?: HelicalLayer;
  skip?: SkipLayer;
}

// ===========================
// Type Guards for Layer Types
// ===========================

/**
 * Type guard to check if a layer is a hoop layer
 */
export function isHoopLayer(layer: Layer): layer is Layer & { type: 'hoop'; hoop: HoopLayer } {
  return layer.type === 'hoop' && layer.hoop !== undefined;
}

/**
 * Type guard to check if a layer is a helical layer
 */
export function isHelicalLayer(layer: Layer): layer is Layer & { type: 'helical'; helical: HelicalLayer } {
  return layer.type === 'helical' && layer.helical !== undefined;
}

/**
 * Type guard to check if a layer is a skip layer
 */
export function isSkipLayer(layer: Layer): layer is Layer & { type: 'skip'; skip: SkipLayer } {
  return layer.type === 'skip' && layer.skip !== undefined;
}

/**
 * Get the layer-specific data from a layer (type-safe)
 */
export function getLayerData(layer: Layer): HoopLayer | HelicalLayer | SkipLayer {
  if (isHoopLayer(layer)) return layer.hoop;
  if (isHelicalLayer(layer)) return layer.helical;
  if (isSkipLayer(layer)) return layer.skip;
  throw new Error(`Invalid layer type: ${layer.type}`);
}

export interface FiberPathProject {
  // File metadata
  filePath: string | null;         // null = unsaved
  isDirty: boolean;                // unsaved changes
  
  // Wind definition
  mandrel: Mandrel;
  tow: Tow;
  layers: Layer[];
  
  // Machine settings
  defaultFeedRate: number;         // mm/min for G-code generation
  axisFormat: 'xab' | 'xyz';      // output format preference
  
  // UI state
  activeLayerId: string | null;    // selected in layer stack
}

// Helper to create empty project
export function createEmptyProject(): FiberPathProject {
  return {
    filePath: null,
    isDirty: false,
    mandrel: {
      diameter: 100,
      wind_length: 200,
    },
    tow: {
      width: 3,
      thickness: 0.25,
    },
    layers: [],
    defaultFeedRate: 2000,
    axisFormat: 'xab',
    activeLayerId: null,
  };
}

// Helper to create layer with defaults
export function createLayer(type: LayerType): Layer {
  const id = crypto.randomUUID();
  
  switch (type) {
    case 'hoop':
      return {
        id,
        type: 'hoop',
        hoop: { terminal: false },
      };
    case 'helical':
      return {
        id,
        type: 'helical',
        helical: {
          wind_angle: 45,
          pattern_number: 3,
          skip_index: 2,
          lock_degrees: 5,
          lead_in_mm: 10,
          lead_out_degrees: 5,
          skip_initial_near_lock: false,
        },
      };
    case 'skip':
      return {
        id,
        type: 'skip',
        skip: { mandrel_rotation: 90 },
      };
  }
}
