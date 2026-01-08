import { ReactNode } from "react";
import "../styles/layout.css";

interface MainLayoutProps {
  menuBar: ReactNode;
  leftPanel: ReactNode;
  centerCanvas: ReactNode;
  rightPanel: ReactNode;
  bottomPanel: ReactNode;
  statusBar: ReactNode;
  leftPanelCollapsed?: boolean;
  rightPanelCollapsed?: boolean;
}

export function MainLayout({
  menuBar,
  leftPanel,
  centerCanvas,
  rightPanel,
  bottomPanel,
  statusBar,
  leftPanelCollapsed = false,
  rightPanelCollapsed = false,
}: MainLayoutProps) {
  return (
    <div className="main-layout">
      <div className="main-layout__menubar">{menuBar}</div>
      
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
      
      <div className="main-layout__statusbar">{statusBar}</div>
    </div>
  );
}
