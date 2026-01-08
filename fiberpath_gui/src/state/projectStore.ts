import { create } from 'zustand';
import {
  FiberPathProject,
  Layer,
  LayerType,
  Mandrel,
  Tow,
  createEmptyProject,
  createLayer,
} from '../types/project';

interface ProjectState {
  project: FiberPathProject;
  
  // Project management
  loadProject: (project: FiberPathProject) => void;
  newProject: () => void;
  
  // Mandrel & Tow
  updateMandrel: (mandrel: Partial<Mandrel>) => void;
  updateTow: (tow: Partial<Tow>) => void;
  
  // Machine settings
  updateDefaultFeedRate: (feedRate: number) => void;
  setAxisFormat: (format: 'xab' | 'xyz') => void;
  
  // Layer operations
  addLayer: (type: LayerType) => string; // returns new layer id
  removeLayer: (id: string) => void;
  updateLayer: (id: string, props: Partial<Layer>) => void;
  reorderLayers: (startIndex: number, endIndex: number) => void;
  duplicateLayer: (id: string) => string; // returns new layer id
  
  // UI state
  setActiveLayerId: (id: string | null) => void;
  autoRefreshPreview: boolean;
  toggleAutoRefreshPreview: () => void;
  
  // Dirty state
  markDirty: () => void;
  clearDirty: () => void;
  
  // File metadata
  setFilePath: (path: string | null) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: createEmptyProject(),
  autoRefreshPreview: false,
  
  loadProject: (project: FiberPathProject) => {
    set({ project });
  },
  
  newProject: () => {
    set({ project: createEmptyProject() });
  },
  
  updateMandrel: (mandrel: Partial<Mandrel>) => {
    set((state) => ({
      project: {
        ...state.project,
        mandrel: { ...state.project.mandrel, ...mandrel },
        isDirty: true,
      },
    }));
  },
  
  updateTow: (tow: Partial<Tow>) => {
    set((state) => ({
      project: {
        ...state.project,
        tow: { ...state.project.tow, ...tow },
        isDirty: true,
      },
    }));
  },
  
  updateDefaultFeedRate: (feedRate: number) => {
    set((state) => ({
      project: {
        ...state.project,
        defaultFeedRate: feedRate,
        isDirty: true,
      },
    }));
  },
  
  addLayer: (type: LayerType) => {
    const newLayer = createLayer(type);
    set((state) => ({
      project: {
        ...state.project,
        layers: [...state.project.layers, newLayer],
        activeLayerId: newLayer.id,
        isDirty: true,
      },
    }));
    return newLayer.id;
  },
  
  removeLayer: (id: string) => {
    set((state) => {
      const layers = state.project.layers.filter(l => l.id !== id);
      const activeLayerId = state.project.activeLayerId === id
        ? (layers.length > 0 ? layers[0].id : null)
        : state.project.activeLayerId;
      
      return {
        project: {
          ...state.project,
          layers,
          activeLayerId,
          isDirty: true,
        },
      };
    });
  },
  
  updateLayer: (id: string, props: Partial<Layer>) => {
    set((state) => ({
      project: {
        ...state.project,
        layers: state.project.layers.map(layer =>
          layer.id === id
            ? { ...layer, ...props }
            : layer
        ),
        isDirty: true,
      },
    }));
  },
  
  reorderLayers: (startIndex: number, endIndex: number) => {
    set((state) => {
      const layers = [...state.project.layers];
      const [removed] = layers.splice(startIndex, 1);
      layers.splice(endIndex, 0, removed);
      
      return {
        project: {
          ...state.project,
          layers,
          isDirty: true,
        },
      };
    });
  },
  
  duplicateLayer: (id: string) => {
    const state = get();
    const layerToDuplicate = state.project.layers.find(l => l.id === id);
    
    if (!layerToDuplicate) {
      return '';
    }
    
    // Create a new layer with the same properties but new ID
    const newLayer: Layer = {
      ...layerToDuplicate,
      id: crypto.randomUUID(),
    };
    
    // Insert after the duplicated layer
    const index = state.project.layers.findIndex(l => l.id === id);
    const layers = [...state.project.layers];
    layers.splice(index + 1, 0, newLayer);
    
    set({
      project: {
        ...state.project,
        layers,
        activeLayerId: newLayer.id,
        isDirty: true,
      },
    });
    
    return newLayer.id;
  },
  
  setActiveLayerId: (id: string | null) => {
    set((state) => ({
      project: { ...state.project, activeLayerId: id },
    }));
  },
  
  setAxisFormat: (format: 'xab' | 'xyz') => {
    set((state) => ({
      project: { ...state.project, axisFormat: format, isDirty: true },
    }));
  },
  
  markDirty: () => {
    set((state) => ({
      project: { ...state.project, isDirty: true },
    }));
  },
  
  clearDirty: () => {
    set((state) => ({
      project: { ...state.project, isDirty: false },
    }));
  },
  
  setFilePath: (path: string | null) => {
    set((state) => ({
      project: { ...state.project, filePath: path },
    }));
  },
  
  toggleAutoRefreshPreview: () => {
    set((state) => ({
      autoRefreshPreview: !state.autoRefreshPreview,
    }));
  },
}));
