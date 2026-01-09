import { ReactNode } from "react";

interface RightPanelProps {
  children: ReactNode;
}

export function RightPanel({ children }: RightPanelProps) {
  return (
    <div className="panel-container">
      <div className="panel-header">
        <h2 className="panel-title">Properties</h2>
      </div>
      <div className="panel-content">{children}</div>
    </div>
  );
}
