import { useShallow } from "zustand/react/shallow";
import { useProjectStore } from "../state/projectStore";
import { useCliHealthContext } from "../contexts/CliHealthContext";

export function StatusBar() {
  // Extract only needed fields with shallow comparison
  const { filePath, layerCount, isDirty } = useProjectStore(useShallow((state) => ({
    filePath: state.project.filePath,
    layerCount: state.project.layers.length,
    isDirty: state.project.isDirty
  })));
  
  const { status: cliStatus } = useCliHealthContext();
  
  const projectName = filePath 
    ? filePath.split(/[\\/]/).pop() || 'Untitled'
    : 'Untitled';
  
  const getCliStatusText = (): string => {
    switch (cliStatus) {
      case "ready":
        return "CLI: Ready";
      case "checking":
        return "CLI: Checking...";
      case "unavailable":
        return "CLI: Unavailable";
      case "unknown":
        return "CLI: Unknown";
      default:
        return "CLI: Unknown";
    }
  };

  const getCliStatusColor = (): string => {
    switch (cliStatus) {
      case "ready":
        return "var(--success)";
      case "checking":
        return "var(--text-muted)";
      case "unavailable":
        return "var(--error)";
      case "unknown":
        return "var(--text-muted)";
      default:
        return "var(--text-muted)";
    }
  };

  return (
    <div className="statusbar">
      <div className="statusbar__item">
        <span className="statusbar__label">Project:</span>
        <span className="statusbar__value">
          {projectName}
          {isDirty && <span className="statusbar__dirty">*</span>}
        </span>
      </div>
      
      {layerCount > 0 && (
        <div className="statusbar__item">
          <span className="statusbar__label">Layers:</span>
          <span className="statusbar__value">{layerCount}</span>
        </div>
      )}
      
      <div className="statusbar__item" style={{ marginLeft: "auto" }}>
        <span className="statusbar__indicator" style={{ background: getCliStatusColor() }} />
        <span className="statusbar__value">{getCliStatusText()}</span>
      </div>
    </div>
  );
}
