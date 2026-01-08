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

export interface FiberPathProject {
  // File metadata
  filePath: string | null;         // null = unsaved
  isDirty: boolean;                // unsaved changes
  
  // Wind definition
  mandrel: Mandrel;
  tow: Tow;
  layers: Layer[];
  
  // UI state
  activeLayerId: string | null;    // selected in layer stack
  axisFormat: 'xab' | 'xyz';      // output format preference
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
    activeLayerId: null,
    axisFormat: 'xab',
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
