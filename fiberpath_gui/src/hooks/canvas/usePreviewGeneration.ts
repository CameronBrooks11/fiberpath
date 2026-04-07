import { useState, useRef } from "react";
import { plotDefinition } from "../../lib/commands";
import { projectToWindDefinition } from "../../types/converters";
import { validateWindDefinition } from "../../lib/validation";
import type { FiberPathProject } from "../../types/project";

interface UsePreviewGenerationParams {
  project: FiberPathProject;
  visibleLayerCount: number;
  onError: (message: string) => void;
}

const validatePreviewInputs = (project: FiberPathProject): string | null => {
  if (project.layers.length === 0) {
    return "No layers to visualize";
  }

  if (
    !project.mandrel.diameter ||
    project.mandrel.diameter <= 0 ||
    !project.mandrel.wind_length ||
    project.mandrel.wind_length <= 0
  ) {
    return "Invalid mandrel parameters";
  }

  if (
    !project.tow.width ||
    project.tow.width <= 0 ||
    !project.tow.thickness ||
    project.tow.thickness <= 0
  ) {
    return "Invalid tow parameters";
  }

  return null;
};

export function usePreviewGeneration({
  project,
  visibleLayerCount,
  onError,
}: UsePreviewGenerationParams) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const requestIdRef = useRef(0);

  const generatePreview = async () => {
    const validationError = validatePreviewInputs(project);
    if (validationError) {
      setError(validationError);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsGenerating(true);
    setError(null);
    setWarnings([]);

    try {
      const windDefinition = projectToWindDefinition(project, visibleLayerCount);
      const validation = validateWindDefinition(windDefinition);

      if (!validation.valid) {
        const errorMessages = validation.errors
          .map((item) => `${item.field}: ${item.message}`)
          .join(", ");
        throw new Error(`Schema validation failed: ${errorMessages}`);
      }

      const definitionJson = JSON.stringify(windDefinition);
      const result = await plotDefinition(definitionJson, visibleLayerCount);

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings);
      }

      if (!result.imageBase64 || result.imageBase64.length === 0) {
        throw new Error("Empty image data returned from plot command");
      }

      setPreviewImage(`data:image/png;base64,${result.imageBase64}`);
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      onError(`Failed to generate preview: ${errorMessage}`);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsGenerating(false);
      }
    }
  };

  return {
    previewImage,
    isGenerating,
    error,
    warnings,
    generatePreview,
  };
}
