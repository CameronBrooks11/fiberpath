import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from './projectStore';
import { createEmptyProject } from '../types/project';

describe('projectStore', () => {
  beforeEach(() => {
    // Reset store to empty project before each test
    useProjectStore.setState({ project: createEmptyProject() });
  });

  describe('Project Management', () => {
    it('should initialize with empty project', () => {
      const { project } = useProjectStore.getState();
      expect(project.filePath).toBeNull();
      expect(project.isDirty).toBe(false);
      expect(project.layers).toHaveLength(0);
      expect(project.activeLayerId).toBeNull();
    });

    it('should load a project', () => {
      const newProject = createEmptyProject();
      newProject.filePath = '/test/path.wind';
      newProject.mandrel.diameter = 150;
      
      useProjectStore.getState().loadProject(newProject);
      
      const { project } = useProjectStore.getState();
      expect(project.filePath).toBe('/test/path.wind');
      expect(project.mandrel.diameter).toBe(150);
    });

    it('should create new project', () => {
      // First set some data
      useProjectStore.getState().setFilePath('/test/old.wind');
      useProjectStore.getState().markDirty();
      useProjectStore.getState().addLayer('hoop');
      
      // Then create new project
      useProjectStore.getState().newProject();
      
      const { project } = useProjectStore.getState();
      expect(project.filePath).toBeNull();
      expect(project.isDirty).toBe(false);
      expect(project.layers).toHaveLength(0);
    });
  });

  describe('Mandrel Updates', () => {
    it('should update mandrel diameter', () => {
      useProjectStore.getState().updateMandrel({ diameter: 200 });
      
      const { project } = useProjectStore.getState();
      expect(project.mandrel.diameter).toBe(200);
      expect(project.mandrel.wind_length).toBe(200); // unchanged
      expect(project.isDirty).toBe(true);
    });

    it('should update mandrel wind_length', () => {
      useProjectStore.getState().updateMandrel({ wind_length: 300 });
      
      const { project } = useProjectStore.getState();
      expect(project.mandrel.wind_length).toBe(300);
      expect(project.mandrel.diameter).toBe(100); // unchanged
    });

    it('should update multiple mandrel properties', () => {
      useProjectStore.getState().updateMandrel({ diameter: 150, wind_length: 250 });
      
      const { project } = useProjectStore.getState();
      expect(project.mandrel.diameter).toBe(150);
      expect(project.mandrel.wind_length).toBe(250);
    });
  });

  describe('Tow Updates', () => {
    it('should update tow width', () => {
      useProjectStore.getState().updateTow({ width: 5 });
      
      const { project } = useProjectStore.getState();
      expect(project.tow.width).toBe(5);
      expect(project.tow.thickness).toBe(0.25); // unchanged
      expect(project.isDirty).toBe(true);
    });

    it('should update tow thickness', () => {
      useProjectStore.getState().updateTow({ thickness: 0.5 });
      
      const { project } = useProjectStore.getState();
      expect(project.tow.thickness).toBe(0.5);
      expect(project.tow.width).toBe(3); // unchanged
    });
  });

  describe('Machine Settings', () => {
    it('should update default feed rate', () => {
      useProjectStore.getState().updateDefaultFeedRate(3000);
      
      const { project } = useProjectStore.getState();
      expect(project.defaultFeedRate).toBe(3000);
      expect(project.isDirty).toBe(true);
    });

    it('should update axis format', () => {
      useProjectStore.getState().setAxisFormat('xyz');
      
      const { project } = useProjectStore.getState();
      expect(project.axisFormat).toBe('xyz');
      expect(project.isDirty).toBe(true);
    });
  });

  describe('Layer Operations', () => {
    it('should add a hoop layer', () => {
      const layerId = useProjectStore.getState().addLayer('hoop');
      
      const { project } = useProjectStore.getState();
      expect(project.layers).toHaveLength(1);
      expect(project.layers[0].type).toBe('hoop');
      expect(project.layers[0].id).toBe(layerId);
      expect(project.activeLayerId).toBe(layerId);
      expect(project.isDirty).toBe(true);
    });

    it('should add a helical layer', () => {
      const layerId = useProjectStore.getState().addLayer('helical');
      
      const { project } = useProjectStore.getState();
      expect(project.layers[0].type).toBe('helical');
      expect(project.layers[0].helical).toBeDefined();
      expect(project.layers[0].helical?.wind_angle).toBe(45);
    });

    it('should add a skip layer', () => {
      const layerId = useProjectStore.getState().addLayer('skip');
      
      const { project } = useProjectStore.getState();
      expect(project.layers[0].type).toBe('skip');
      expect(project.layers[0].skip).toBeDefined();
      expect(project.layers[0].skip?.mandrel_rotation).toBe(90);
    });

    it('should add multiple layers', () => {
      useProjectStore.getState().addLayer('hoop');
      useProjectStore.getState().addLayer('helical');
      useProjectStore.getState().addLayer('skip');
      
      const { project } = useProjectStore.getState();
      expect(project.layers).toHaveLength(3);
      expect(project.layers[0].type).toBe('hoop');
      expect(project.layers[1].type).toBe('helical');
      expect(project.layers[2].type).toBe('skip');
    });

    it('should remove a layer', () => {
      const id1 = useProjectStore.getState().addLayer('hoop');
      const id2 = useProjectStore.getState().addLayer('helical');
      
      useProjectStore.getState().removeLayer(id1);
      
      const { project } = useProjectStore.getState();
      expect(project.layers).toHaveLength(1);
      expect(project.layers[0].id).toBe(id2);
    });

    it('should update active layer when removing active layer', () => {
      const id1 = useProjectStore.getState().addLayer('hoop');
      const id2 = useProjectStore.getState().addLayer('helical');
      
      // id2 is active (last added)
      useProjectStore.getState().removeLayer(id2);
      
      const { project } = useProjectStore.getState();
      expect(project.activeLayerId).toBe(id1); // fallback to first layer
    });

    it('should set activeLayerId to null when removing last layer', () => {
      const id = useProjectStore.getState().addLayer('hoop');
      useProjectStore.getState().removeLayer(id);
      
      const { project } = useProjectStore.getState();
      expect(project.activeLayerId).toBeNull();
      expect(project.layers).toHaveLength(0);
    });

    it('should update a layer', () => {
      const layerId = useProjectStore.getState().addLayer('helical');
      
      useProjectStore.getState().updateLayer(layerId, {
        helical: { wind_angle: 60, pattern_number: 5, skip_index: 3, lock_degrees: 10, lead_in_mm: 20, lead_out_degrees: 10, skip_initial_near_lock: true },
      });
      
      const { project } = useProjectStore.getState();
      expect(project.layers[0].helical?.wind_angle).toBe(60);
      expect(project.layers[0].helical?.pattern_number).toBe(5);
    });

    it('should duplicate a layer', () => {
      const id1 = useProjectStore.getState().addLayer('helical');
      useProjectStore.getState().updateLayer(id1, {
        helical: { wind_angle: 70, pattern_number: 7, skip_index: 4, lock_degrees: 15, lead_in_mm: 25, lead_out_degrees: 15, skip_initial_near_lock: false },
      });
      
      const id2 = useProjectStore.getState().duplicateLayer(id1);
      
      const { project } = useProjectStore.getState();
      expect(project.layers).toHaveLength(2);
      expect(project.layers[1].id).toBe(id2);
      expect(project.layers[1].id).not.toBe(id1);
      expect(project.layers[1].type).toBe('helical');
      expect(project.layers[1].helical?.wind_angle).toBe(70);
      expect(project.activeLayerId).toBe(id2);
    });

    it('should insert duplicated layer after original', () => {
      const id1 = useProjectStore.getState().addLayer('hoop');
      const id2 = useProjectStore.getState().addLayer('helical');
      const id3 = useProjectStore.getState().addLayer('skip');
      
      const duplicateId = useProjectStore.getState().duplicateLayer(id2);
      
      const { project } = useProjectStore.getState();
      expect(project.layers).toHaveLength(4);
      expect(project.layers[0].id).toBe(id1);
      expect(project.layers[1].id).toBe(id2);
      expect(project.layers[2].id).toBe(duplicateId);
      expect(project.layers[3].id).toBe(id3);
    });

    it('should return empty string when duplicating non-existent layer', () => {
      const result = useProjectStore.getState().duplicateLayer('non-existent-id');
      expect(result).toBe('');
      
      const { project } = useProjectStore.getState();
      expect(project.layers).toHaveLength(0);
    });

    it('should reorder layers', () => {
      const id1 = useProjectStore.getState().addLayer('hoop');
      const id2 = useProjectStore.getState().addLayer('helical');
      const id3 = useProjectStore.getState().addLayer('skip');
      
      // Move first layer (index 0) to last position (index 2)
      useProjectStore.getState().reorderLayers(0, 2);
      
      const { project } = useProjectStore.getState();
      expect(project.layers[0].id).toBe(id2);
      expect(project.layers[1].id).toBe(id3);
      expect(project.layers[2].id).toBe(id1);
      expect(project.isDirty).toBe(true);
    });
  });

  describe('UI State', () => {
    it('should set active layer id', () => {
      const layerId = useProjectStore.getState().addLayer('hoop');
      useProjectStore.getState().setActiveLayerId(null);
      
      expect(useProjectStore.getState().project.activeLayerId).toBeNull();
      
      useProjectStore.getState().setActiveLayerId(layerId);
      expect(useProjectStore.getState().project.activeLayerId).toBe(layerId);
    });

    it('should not mark dirty when changing active layer', () => {
      const layerId = useProjectStore.getState().addLayer('hoop');
      useProjectStore.getState().clearDirty();
      
      useProjectStore.getState().setActiveLayerId(layerId);
      
      expect(useProjectStore.getState().project.isDirty).toBe(false);
    });
  });

  describe('Dirty State', () => {
    it('should mark dirty', () => {
      useProjectStore.getState().markDirty();
      expect(useProjectStore.getState().project.isDirty).toBe(true);
    });

    it('should clear dirty', () => {
      useProjectStore.getState().markDirty();
      useProjectStore.getState().clearDirty();
      expect(useProjectStore.getState().project.isDirty).toBe(false);
    });
  });

  describe('File Metadata', () => {
    it('should set file path', () => {
      useProjectStore.getState().setFilePath('/test/file.wind');
      expect(useProjectStore.getState().project.filePath).toBe('/test/file.wind');
    });

    it('should clear file path', () => {
      useProjectStore.getState().setFilePath('/test/file.wind');
      useProjectStore.getState().setFilePath(null);
      expect(useProjectStore.getState().project.filePath).toBeNull();
    });

    it('should not mark dirty when setting file path', () => {
      useProjectStore.getState().setFilePath('/test/file.wind');
      expect(useProjectStore.getState().project.isDirty).toBe(false);
    });
  });
});
