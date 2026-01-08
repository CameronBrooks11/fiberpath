import type { Layer } from './project';
import type { FiberPathWindDefinition, HoopLayer, HelicalLayer, SkipLayer } from './wind-schema';

/**
 * Convert internal GUI layer format to .wind schema format
 */
export function convertLayerToWindSchema(layer: Layer): HoopLayer | HelicalLayer | SkipLayer {
  if (layer.type === 'hoop') {
    const hoopData = layer.hoop || {};
    return {
      windType: 'hoop',
      terminal: hoopData.terminal ?? false,
    };
  } else if (layer.type === 'helical') {
    const helicalData = layer.helical || {};
    return {
      windType: 'helical',
      windAngle: helicalData.wind_angle ?? 45,
      patternNumber: helicalData.pattern_number ?? 3,
      skipIndex: helicalData.skip_index ?? 2,
      lockDegrees: helicalData.lock_degrees ?? 5,
      leadInMM: helicalData.lead_in_mm ?? 10,
      leadOutDegrees: helicalData.lead_out_degrees ?? 5,
      skipInitialNearLock: helicalData.skip_initial_near_lock ?? null,
    };
  } else if (layer.type === 'skip') {
    const skipData = layer.skip || {};
    return {
      windType: 'skip',
      mandrelRotation: skipData.mandrel_rotation ?? 90,
    };
  }
  
  throw new Error(`Unknown layer type: ${(layer as any).type}`);
}

/**
 * Convert full project to .wind schema format
 */
export function projectToWindDefinition(
  project: {
    mandrel: { diameter: number; wind_length: number };
    tow: { width: number; thickness: number };
    layers: Layer[];
  },
  visibleLayerCount?: number
): FiberPathWindDefinition {
  const layersToInclude = visibleLayerCount 
    ? project.layers.slice(0, visibleLayerCount)
    : project.layers;
  
  return {
    mandrelParameters: {
      diameter: project.mandrel.diameter,
      windLength: project.mandrel.wind_length,
    },
    towParameters: {
      width: project.tow.width,
      thickness: project.tow.thickness,
    },
    defaultFeedRate: 2000,
    layers: layersToInclude.map(convertLayerToWindSchema),
  };
}
