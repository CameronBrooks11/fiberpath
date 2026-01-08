import { FocusEvent } from "react";
import { useProjectStore } from "../../state/projectStore";

interface HoopLayerEditorProps {
  layerId: string;
}

export function HoopLayerEditor({ layerId }: HoopLayerEditorProps) {
  const layers = useProjectStore((state) => state.project.layers);
  const updateLayer = useProjectStore((state) => state.updateLayer);
  
  const layer = layers.find(l => l.id === layerId);
  
  if (!layer || layer.type !== 'hoop' || !layer.hoop) {
    return null;
  }
  
  const handleTerminalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateLayer(layerId, {
      hoop: {
        terminal: e.target.checked,
      },
    });
  };
  
  return (
    <div className="layer-editor">
      <h3 className="layer-editor__title">Hoop Layer Properties</h3>
      
      <div className="layer-editor__group">
        <label className="layer-editor__checkbox-label">
          <input
            type="checkbox"
            checked={layer.hoop.terminal}
            onChange={handleTerminalChange}
            className="layer-editor__checkbox"
          />
          <span className="layer-editor__checkbox-text">Terminal Layer</span>
        </label>
        <p className="layer-editor__hint">
          Mark this as a terminal layer (first or last layer in the wind definition)
        </p>
      </div>
    </div>
  );
}
