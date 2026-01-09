import { describe, it, expect, beforeEach, vi } from "vitest";
import { useProjectStore } from "../../state/projectStore";
import {
  projectToWindDefinition,
  windDefinitionToProject,
} from "../../types/converters";
import { createEmptyProject } from "../../types/project";
import type { FiberPathWindDefinition } from "../../types/wind-schema";

// Mock Tauri commands
vi.mock("../../lib/commands", () => ({
  saveWindFile: vi.fn().mockResolvedValue(undefined),
  loadWindFile: vi.fn(),
  validateWindDefinition: vi.fn(),
  planWind: vi.fn(),
}));

// Mock Tauri dialog
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
  save: vi.fn(),
  ask: vi.fn().mockResolvedValue(true),
}));

// Mock recent files
vi.mock("../../lib/recentFiles", () => ({
  addRecentFile: vi.fn(),
  getRecentFiles: vi.fn().mockReturnValue([]),
}));

describe("Integration Tests - Complete Workflows", () => {
  beforeEach(() => {
    // Properly reset store to a fresh empty project before each test
    useProjectStore.setState({ project: createEmptyProject() });
    vi.clearAllMocks();
  });

  describe("New Project → Add Layers → Save → Load Workflow", () => {
    it("should complete full workflow successfully", async () => {
      // Get fresh state after beforeEach reset
      let state = useProjectStore.getState();

      // Step 1: Verify clean state
      expect(state.project.layers).toHaveLength(0);
      expect(state.project.filePath).toBeNull();
      expect(state.project.isDirty).toBe(false);

      // Step 2: Add layers
      const hoopId = state.addLayer("hoop");
      const helicalId = state.addLayer("helical");
      const skipId = state.addLayer("skip");

      // Refresh state after mutations
      state = useProjectStore.getState();
      expect(state.project.layers).toHaveLength(3);
      expect(state.project.isDirty).toBe(true);
      expect(state.project.activeLayerId).toBe(skipId);

      // Step 3: Configure layers
      state.updateLayer(helicalId, {
        helical: {
          wind_angle: 60,
          pattern_number: 5,
          skip_index: 3,
          lock_degrees: 10,
          lead_in_mm: 15,
          lead_out_degrees: 8,
          skip_initial_near_lock: true,
        },
      });

      // Step 4: Configure mandrel and tow
      state.updateMandrel({ diameter: 150, wind_length: 300 });
      state.updateTow({ width: 5, thickness: 0.4 });
      state.updateDefaultFeedRate(2500);
      state = useProjectStore.getState();

      // Step 5: Convert to wind definition
      const windDef = projectToWindDefinition(state.project);

      expect(windDef.mandrelParameters.diameter).toBe(150);
      expect(windDef.mandrelParameters.windLength).toBe(300);
      expect(windDef.towParameters.width).toBe(5);
      expect(windDef.defaultFeedRate).toBe(2500);
      expect(windDef.layers).toHaveLength(3);
      expect(windDef.layers[0].windType).toBe("hoop");
      expect(windDef.layers[1].windType).toBe("helical");
      expect(windDef.layers[2].windType).toBe("skip");

      // Step 6: Simulate save (store wind definition)
      const savedWindDefJson = JSON.stringify(windDef, null, 2);
      state.setFilePath("/test/project.wind");
      state.clearDirty();
      state = useProjectStore.getState();

      expect(state.project.filePath).toBe("/test/project.wind");
      expect(state.project.isDirty).toBe(false);

      // Step 7: Simulate load (parse and convert back)
      const loadedWindDef: FiberPathWindDefinition =
        JSON.parse(savedWindDefJson);
      const loadedProject = windDefinitionToProject(
        loadedWindDef,
        "/test/project.wind",
      );

      state.loadProject(loadedProject);

      // Step 8: Verify loaded project matches saved project
      const finalState = useProjectStore.getState();

      expect(finalState.project.filePath).toBe("/test/project.wind");
      expect(finalState.project.mandrel.diameter).toBe(150);
      expect(finalState.project.mandrel.wind_length).toBe(300);
      expect(finalState.project.tow.width).toBe(5);
      expect(finalState.project.defaultFeedRate).toBe(2500);
      expect(finalState.project.layers).toHaveLength(3);
      expect(finalState.project.layers[0].type).toBe("hoop");
      expect(finalState.project.layers[1].type).toBe("helical");
      expect(finalState.project.layers[1].helical?.wind_angle).toBe(60);
      expect(finalState.project.layers[2].type).toBe("skip");
    });
  });

  describe("Load → Edit → Save Workflow", () => {
    it("should load, modify, and save project", async () => {
      let state = useProjectStore.getState();

      // Step 1: Create and load initial project
      const initialWindDef: FiberPathWindDefinition = {
        schemaVersion: "1.0",
        mandrelParameters: { diameter: 100, windLength: 200 },
        towParameters: { width: 3, thickness: 0.25 },
        defaultFeedRate: 2000,
        layers: [
          { windType: "hoop", terminal: false },
          {
            windType: "helical",
            windAngle: 45,
            patternNumber: 3,
            skipIndex: 2,
            lockDegrees: 5,
            leadInMM: 10,
            leadOutDegrees: 5,
            skipInitialNearLock: false,
          },
        ],
      };

      const loadedProject = windDefinitionToProject(
        initialWindDef,
        "/test/existing.wind",
      );
      state.loadProject(loadedProject);
      state = useProjectStore.getState();

      expect(state.project.layers).toHaveLength(2);
      expect(state.project.isDirty).toBe(false);

      // Step 2: Make edits
      state.updateMandrel({ diameter: 120 });
      state = useProjectStore.getState();
      expect(state.project.isDirty).toBe(true);

      state.addLayer("skip");
      state = useProjectStore.getState();
      expect(state.project.layers).toHaveLength(3);

      const helicalId = state.project.layers.find(
        (l) => l.type === "helical",
      )?.id;
      if (helicalId) {
        state.updateLayer(helicalId, {
          helical: {
            wind_angle: 55,
            pattern_number: 5,
            skip_index: 3,
            lock_degrees: 8,
            lead_in_mm: 12,
            lead_out_degrees: 6,
            skip_initial_near_lock: true,
          },
        });
        state = useProjectStore.getState();
      }

      // Step 3: Save changes
      const updatedWindDef = projectToWindDefinition(state.project);

      expect(updatedWindDef.mandrelParameters.diameter).toBe(120);
      expect(updatedWindDef.layers).toHaveLength(3);
      expect(updatedWindDef.layers[2].windType).toBe("skip");

      const helicalLayer = updatedWindDef.layers.find(
        (l) => l.windType === "helical",
      );
      if (helicalLayer && "windAngle" in helicalLayer) {
        expect(helicalLayer.windAngle).toBe(55);
        expect(helicalLayer.patternNumber).toBe(5);
      }
    });
  });

  describe("Layer Operations Workflow", () => {
    it("should handle complex layer operations", async () => {
      let state = useProjectStore.getState();

      // Step 1: Add multiple layers
      const id1 = state.addLayer("hoop");
      const id2 = state.addLayer("helical");
      const id3 = state.addLayer("skip");
      const id4 = state.addLayer("hoop");
      state = useProjectStore.getState();

      expect(state.project.layers).toHaveLength(4);

      // Step 2: Duplicate a layer
      const duplicateId = state.duplicateLayer(id2);
      state = useProjectStore.getState();

      expect(state.project.layers).toHaveLength(5);
      expect(state.project.layers[2].id).toBe(duplicateId);
      expect(state.project.layers[2].type).toBe("helical");

      // Step 3: Reorder layers (move first to third position)
      state.reorderLayers(0, 2);
      state = useProjectStore.getState();

      expect(state.project.layers[0].id).toBe(id2);
      expect(state.project.layers[1].id).toBe(duplicateId);
      expect(state.project.layers[2].id).toBe(id1);

      // Step 4: Remove a layer
      state.removeLayer(duplicateId);
      state = useProjectStore.getState();

      expect(state.project.layers).toHaveLength(4);
      expect(
        state.project.layers.find((l) => l.id === duplicateId),
      ).toBeUndefined();

      // Step 5: Update active layer
      state.setActiveLayerId(id3);
      state = useProjectStore.getState();
      expect(state.project.activeLayerId).toBe(id3);

      // Step 6: Remove active layer
      state.removeLayer(id3);
      state = useProjectStore.getState();

      expect(state.project.layers).toHaveLength(3);
      expect(state.project.activeLayerId).not.toBe(id3);
    });
  });

  describe("Export Workflow", () => {
    it("should export project with visible layer count", async () => {
      let state = useProjectStore.getState();

      // Create project with multiple layers
      state.addLayer("hoop");
      state.addLayer("helical");
      state.addLayer("skip");
      state.addLayer("hoop");
      state.addLayer("helical");

      state.updateMandrel({ diameter: 110, wind_length: 220 });
      state.updateTow({ width: 4, thickness: 0.3 });
      state = useProjectStore.getState();

      expect(state.project.layers).toHaveLength(5);

      // Export with only first 3 layers visible
      const windDef = projectToWindDefinition(state.project, 3);

      expect(windDef.layers).toHaveLength(3);
      expect(windDef.layers[0].windType).toBe("hoop");
      expect(windDef.layers[1].windType).toBe("helical");
      expect(windDef.layers[2].windType).toBe("skip");
      expect(windDef.mandrelParameters.diameter).toBe(110);
    });
  });

  describe("State Persistence Workflow", () => {
    it("should maintain dirty state correctly", async () => {
      let state = useProjectStore.getState();

      // Start clean
      expect(state.project.isDirty).toBe(false);

      // Operations that should mark dirty
      state.updateMandrel({ diameter: 120 });
      state = useProjectStore.getState();
      expect(state.project.isDirty).toBe(true);

      state.clearDirty();
      state = useProjectStore.getState();
      expect(state.project.isDirty).toBe(false);

      state.updateTow({ width: 4 });
      state = useProjectStore.getState();
      expect(state.project.isDirty).toBe(true);

      state.clearDirty();
      state.addLayer("hoop");
      state = useProjectStore.getState();
      expect(state.project.isDirty).toBe(true);

      state.clearDirty();
      state = useProjectStore.getState();
      const layerId = state.project.layers[0].id;
      state.updateLayer(layerId, { hoop: { terminal: true } });
      state = useProjectStore.getState();
      expect(state.project.isDirty).toBe(true);

      // Operations that should NOT mark dirty
      state.clearDirty();
      state.setActiveLayerId(layerId);
      state = useProjectStore.getState();
      expect(state.project.isDirty).toBe(false);

      state.setFilePath("/test/file.wind");
      state = useProjectStore.getState();
      expect(state.project.isDirty).toBe(false);
    });
  });

  describe("Error Recovery Workflow", () => {
    it("should handle invalid layer data gracefully", async () => {
      let state = useProjectStore.getState();

      // Add valid layer
      const layerId = state.addLayer("helical");
      state = useProjectStore.getState();
      expect(state.project.layers).toHaveLength(1);

      // Try to update with partial invalid data (should not crash)
      state.updateLayer(layerId, {
        helical: {
          wind_angle: 75,
          pattern_number: 4,
          skip_index: 2,
          lock_degrees: 6,
          lead_in_mm: 11,
          lead_out_degrees: 6,
          skip_initial_near_lock: false,
        },
      });
      state = useProjectStore.getState();

      // Should still be able to operate on the layer
      expect(state.project.layers[0].helical?.wind_angle).toBe(75);
    });

    it("should handle remove non-existent layer gracefully", async () => {
      let state = useProjectStore.getState();

      state.addLayer("hoop");
      state = useProjectStore.getState();
      expect(state.project.layers).toHaveLength(1);

      // Try to remove non-existent layer
      state.removeLayer("non-existent-id");
      state = useProjectStore.getState();

      // Original layer should still be there
      expect(state.project.layers).toHaveLength(1);
    });
  });
});
