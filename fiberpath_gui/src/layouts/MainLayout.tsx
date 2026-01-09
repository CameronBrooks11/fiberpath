import { ReactNode } from "react";
import "../styles/layout.css";

interface MainLayoutProps {
  menuBar: ReactNode;
  tabBar?: ReactNode;
  content: ReactNode;
  statusBar: ReactNode;
  children?: ReactNode;
}

export function MainLayout({
  menuBar,
  tabBar,
  content,
  statusBar,
  children,
}: MainLayoutProps) {
  return (
    <div className="main-layout">
      <div className="main-layout__menubar">{menuBar}</div>
      {tabBar && <div className="main-layout__tabbar">{tabBar}</div>}
      {content}
      <div className="main-layout__statusbar">{statusBar}</div>
      {children}
    </div>
  );
}
