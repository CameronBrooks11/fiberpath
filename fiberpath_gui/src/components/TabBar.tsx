import { FileCode, Radio } from "lucide-react";
import "../styles/tabs.css";

export type TabId = "main" | "stream";

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="tab-bar">
      <button
        className={`tab-bar__tab ${activeTab === "main" ? "active" : ""}`}
        onClick={() => onTabChange("main")}
        aria-label="Main workspace"
        title="Main workspace (Alt+1)"
      >
        <FileCode size={16} />
        <span>Main</span>
      </button>
      <button
        className={`tab-bar__tab ${activeTab === "stream" ? "active" : ""}`}
        onClick={() => onTabChange("stream")}
        aria-label="Marlin stream"
        title="Marlin stream (Alt+2)"
      >
        <Radio size={16} />
        <span>Stream</span>
      </button>
    </div>
  );
}
