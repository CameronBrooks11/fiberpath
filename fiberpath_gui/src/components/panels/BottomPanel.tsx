import { ReactNode } from "react";

interface BottomPanelProps {
  children: ReactNode;
}

export function BottomPanel({ children }: BottomPanelProps) {
  return (
    <div className="panel-container">
      <div className="panel-header">
        <h2 className="panel-title">Layer Stack</h2>
      </div>
      <div className="panel-content">{children}</div>
    </div>
  );
}
