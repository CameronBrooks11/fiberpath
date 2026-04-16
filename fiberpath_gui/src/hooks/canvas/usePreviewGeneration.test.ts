import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePreviewGeneration } from './usePreviewGeneration';
import type { FiberPathProject } from '../../types/project';
import { createEmptyProject, createLayer } from '../../types/project';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockPlotDefinition = vi.fn();
vi.mock('../../lib/commands', () => ({
  plotDefinition: (...args: unknown[]) => mockPlotDefinition(...args),
}));

const mockProjectToWindDefinition = vi.fn().mockReturnValue({});
vi.mock('../../types/converters', () => ({
  projectToWindDefinition: (...args: unknown[]) => mockProjectToWindDefinition(...args),
}));

const mockValidateWindDefinition = vi.fn().mockReturnValue({ valid: true, errors: [] });
vi.mock('../../lib/validation', () => ({
  validateWindDefinition: (...args: unknown[]) => mockValidateWindDefinition(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeValidProject(): FiberPathProject {
  const p = createEmptyProject();
  return {
    ...p,
    mandrel: { diameter: 50, wind_length: 200 },
    tow: { width: 5, thickness: 0.2 },
    layers: [createLayer('helical')],
  };
}

function makeHook(project: FiberPathProject = makeValidProject(), visibleLayerCount = 1) {
  const onError = vi.fn();
  const result = renderHook(() =>
    usePreviewGeneration({ project, visibleLayerCount, onError }),
  );
  return { ...result, onError };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockValidateWindDefinition.mockReturnValue({ valid: true, errors: [] });
  mockProjectToWindDefinition.mockReturnValue({});
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('usePreviewGeneration', () => {
  describe('initial state', () => {
    it('starts with null previewImage and not generating', () => {
      const { result } = makeHook();
      expect(result.current.previewImage).toBeNull();
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.warnings).toEqual([]);
    });
  });

  describe('input validation', () => {
    it('sets error when project has no layers', async () => {
      const project = { ...makeValidProject(), layers: [] };
      const { result } = makeHook(project);
      await act(async () => {
        await result.current.generatePreview();
      });
      expect(result.current.error).toBe('No layers to visualize');
      expect(mockPlotDefinition).not.toHaveBeenCalled();
    });

    it('sets error when mandrel diameter is 0', async () => {
      const project = { ...makeValidProject(), mandrel: { diameter: 0, wind_length: 200 } };
      const { result } = makeHook(project);
      await act(async () => {
        await result.current.generatePreview();
      });
      expect(result.current.error).toBe('Invalid mandrel parameters');
      expect(mockPlotDefinition).not.toHaveBeenCalled();
    });

    it('sets error when tow width is 0', async () => {
      const project = { ...makeValidProject(), tow: { width: 0, thickness: 0.2 } };
      const { result } = makeHook(project);
      await act(async () => {
        await result.current.generatePreview();
      });
      expect(result.current.error).toBe('Invalid tow parameters');
      expect(mockPlotDefinition).not.toHaveBeenCalled();
    });

    it('sets error when wind schema validation fails', async () => {
      mockValidateWindDefinition.mockReturnValue({
        valid: false,
        errors: [{ field: 'layers', message: 'bad data' }],
      });
      const { result } = makeHook();
      await act(async () => {
        await result.current.generatePreview();
      });
      expect(result.current.error).toContain('Schema validation failed');
      expect(mockPlotDefinition).not.toHaveBeenCalled();
    });
  });

  describe('successful generation', () => {
    it('sets previewImage on success', async () => {
      mockPlotDefinition.mockResolvedValue({
        imageBase64: 'abc123',
        warnings: [],
      });
      const { result } = makeHook();
      await act(async () => {
        await result.current.generatePreview();
      });
      expect(result.current.previewImage).toBe('data:image/png;base64,abc123');
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('sets warnings when the result includes them', async () => {
      mockPlotDefinition.mockResolvedValue({
        imageBase64: 'abc',
        warnings: ['low resolution', 'angle clipped'],
      });
      const { result } = makeHook();
      await act(async () => {
        await result.current.generatePreview();
      });
      expect(result.current.warnings).toEqual(['low resolution', 'angle clipped']);
    });
  });

  describe('error handling', () => {
    it('sets error and calls onError when plotDefinition throws', async () => {
      mockPlotDefinition.mockRejectedValue(new Error('CLI crashed'));
      const { result, onError } = makeHook();
      await act(async () => {
        await result.current.generatePreview();
      });
      expect(result.current.error).toContain('CLI crashed');
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('CLI crashed'));
      expect(result.current.isGenerating).toBe(false);
    });

    it('sets error when imageBase64 is empty', async () => {
      mockPlotDefinition.mockResolvedValue({ imageBase64: '', warnings: [] });
      const { result } = makeHook();
      await act(async () => {
        await result.current.generatePreview();
      });
      expect(result.current.error).toContain('Empty image data');
    });

    it('handles non-Error thrown values', async () => {
      mockPlotDefinition.mockRejectedValue('plain string error');
      const { result } = makeHook();
      await act(async () => {
        await result.current.generatePreview();
      });
      expect(result.current.error).toContain('plain string error');
    });
  });
});
