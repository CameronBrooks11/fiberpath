import { ReactNode } from "react";

interface StreamTabProps {
  children?: ReactNode;
}

/**
 * StreamTab - Placeholder for Marlin streaming interface
 * Will be fully implemented in later tasks with controls and log.
 */
export function StreamTab({ children }: StreamTabProps) {
  return (
    <div className="main-layout__workspace">
      <div className="panel-container" style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div className="panel-placeholder">
          <p className="panel-placeholder-text">
            Stream controls coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
