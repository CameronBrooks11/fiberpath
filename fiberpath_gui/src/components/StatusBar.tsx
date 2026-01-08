interface StatusBarProps {
  projectName?: string;
  isDirty?: boolean;
  layerCount?: number;
  cliStatus?: "ready" | "checking" | "unavailable";
}

export function StatusBar({ 
  projectName = "Untitled", 
  isDirty = false,
  layerCount = 0,
  cliStatus = "ready"
}: StatusBarProps) {
  const getCliStatusText = () => {
    switch (cliStatus) {
      case "ready":
        return "CLI: Ready";
      case "checking":
        return "CLI: Checking...";
      case "unavailable":
        return "CLI: Unavailable";
    }
  };

  const getCliStatusColor = () => {
    switch (cliStatus) {
      case "ready":
        return "var(--success)";
      case "checking":
        return "var(--text-muted)";
      case "unavailable":
        return "var(--error)";
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
