import { ReactNode } from "react";

interface MainTabProps {
  leftPanel: ReactNode;
  centerCanvas: ReactNode;
  rightPanel: ReactNode;
  bottomPanel: ReactNode;
  leftPanelCollapsed?: boolean;
  rightPanelCollapsed?: boolean;
}

/**
 * MainTab - Contains the existing workspace layout
 * This is the original main view extracted into a tab component.
 */
export function MainTab({
  leftPanel,
  centerCanvas,
  rightPanel,
  bottomPanel,
  leftPanelCollapsed = false,
  rightPanelCollapsed = false,
}: MainTabProps) {
  return (
    <div className="main-layout__workspace">
      <aside 
        className={`main-layout__left-panel ${leftPanelCollapsed ? "collapsed" : ""}`}
        data-collapsed={leftPanelCollapsed}
      >
        {leftPanel}
      </aside>
      
      <div className="main-layout__center">
        <div className="main-layout__canvas">{centerCanvas}</div>
        <div className="main-layout__bottom-panel">{bottomPanel}</div>
      </div>
      
      <aside 
        className={`main-layout__right-panel ${rightPanelCollapsed ? "collapsed" : ""}`}
        data-collapsed={rightPanelCollapsed}
      >
        {rightPanel}
      </aside>
    </div>
  );
}
