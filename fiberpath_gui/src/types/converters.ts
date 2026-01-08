import type { Layer, HoopLayer as GUIHoopLayer, HelicalLayer as GUIHelicalLayer, SkipLayer as GUISkipLayer, FiberPathProject } from './project';
import type { FiberPathWindDefinition, HoopLayer, HelicalLayer, SkipLayer } from './wind-schema';

/**
 * Convert internal GUI layer format to .wind schema format
 */
export function convertLayerToWindSchema(layer: Layer): HoopLayer | HelicalLayer | SkipLayer {
  if (layer.type === 'hoop') {
    const hoopData = layer.hoop as GUIHoopLayer | undefined;
    return {
      windType: 'hoop',
      terminal: hoopData?.terminal ?? false,
    };
  } else if (layer.type === 'helical') {
    const helicalData = layer.helical as GUIHelicalLayer | undefined;
    return {
      windType: 'helical',
      windAngle: helicalData?.wind_angle ?? 45,
      patternNumber: helicalData?.pattern_number ?? 3,
      skipIndex: helicalData?.skip_index ?? 2,
      lockDegrees: helicalData?.lock_degrees ?? 5,
      leadInMM: helicalData?.lead_in_mm ?? 10,
      leadOutDegrees: helicalData?.lead_out_degrees ?? 5,
      skipInitialNearLock: helicalData?.skip_initial_near_lock ?? null,
    };
  } else if (layer.type === 'skip') {
    const skipData = layer.skip as GUISkipLayer | undefined;
    return {
      windType: 'skip',
      mandrelRotation: skipData?.mandrel_rotation ?? 90,
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
    schemaVersion: '1.0',
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

/**
 * Convert .wind schema layer format back to internal GUI format
 */
export function convertWindSchemaToLayer(schemaLayer: HoopLayer | HelicalLayer | SkipLayer): Layer {
  if (schemaLayer.windType === 'hoop') {
    return {
      id: crypto.randomUUID(),
      type: 'hoop',
      hoop: {
        terminal: schemaLayer.terminal ?? false,
      },
    };
  } else if (schemaLayer.windType === 'helical') {
    return {
      id: crypto.randomUUID(),
      type: 'helical',
      helical: {
        wind_angle: schemaLayer.windAngle,
        pattern_number: schemaLayer.patternNumber,
        skip_index: schemaLayer.skipIndex,
        lock_degrees: schemaLayer.lockDegrees ?? 5,
        lead_in_mm: schemaLayer.leadInMM ?? 10,
        lead_out_degrees: schemaLayer.leadOutDegrees ?? 5,
        skip_initial_near_lock: schemaLayer.skipInitialNearLock ?? false,
      },
    };
  } else if (schemaLayer.windType === 'skip') {
    return {
      id: crypto.randomUUID(),
      type: 'skip',
      skip: {
        mandrel_rotation: schemaLayer.mandrelRotation,
      },
    };
  }
  
  throw new Error(`Unknown wind type: ${(schemaLayer as any).windType}`);
}

/**
 * Convert .wind definition format to GUI project format
 */
export function windDefinitionToProject(windDef: FiberPathWindDefinition, filePath: string | null = null): FiberPathProject {
  return {
    filePath,
    isDirty: false,
    mandrel: {
      diameter: windDef.mandrelParameters.diameter,
      wind_length: windDef.mandrelParameters.windLength,
    },
    tow: {
      width: windDef.towParameters.width,
      thickness: windDef.towParameters.thickness,
    },
    layers: windDef.layers.map(convertWindSchemaToLayer),
    activeLayerId: null,
    axisFormat: 'xab', // Default, could be stored in wind file in future
  };
}
