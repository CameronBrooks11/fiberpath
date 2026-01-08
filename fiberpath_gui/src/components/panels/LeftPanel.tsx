import { ReactNode } from "react";

interface LeftPanelProps {
  children: ReactNode;
}

export function LeftPanel({ children }: LeftPanelProps) {
  return (
    <div className="panel-container">
      <div className="panel-header">
        <h2 className="panel-title">Parameters</h2>
      </div>
      <div className="panel-content">
        {children}
      </div>
    </div>
  );
}
