import { useState } from "react";

interface LayerScrubberProps {
  totalLayers: number;
  currentLayer: number;
  onLayerChange: (layer: number) => void;
}

export function LayerScrubber({ totalLayers, currentLayer, onLayerChange }: LayerScrubberProps) {
  if (totalLayers === 0) {
    return null;
  }
  
  return (
    <div className="layer-scrubber">
      <div className="layer-scrubber__label">
        Layer {currentLayer} of {totalLayers}
      </div>
      <input
        type="range"
        min="1"
        max={totalLayers}
        value={currentLayer}
        onChange={(e) => onLayerChange(parseInt(e.target.value))}
        className="layer-scrubber__slider"
      />
      <div className="layer-scrubber__ticks">
        <span>1</span>
        <span>{totalLayers}</span>
      </div>
    </div>
  );
}
