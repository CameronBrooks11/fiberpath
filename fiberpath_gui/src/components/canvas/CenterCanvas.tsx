import { ReactNode } from "react";

interface CenterCanvasProps {
  children: ReactNode;
}

export function CenterCanvas({ children }: CenterCanvasProps) {
  return (
    <div className="canvas-container">
      {children}
    </div>
  );
}
