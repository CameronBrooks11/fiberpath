import { Suspense, lazy, useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { MainLayout } from "./layouts/MainLayout";
import { TabBar, TabId } from "./components/TabBar";
import { MainTab } from "./components/tabs/MainTab";
import { StreamTab } from "./components/StreamTab/StreamTab";
import { MenuBar } from "./components/MenuBar";
import { StatusBar } from "./components/StatusBar";
import { CliHealthWarning } from "./components/CliHealthWarning";
import { ToastContainer } from "./components/Toast/ToastContainer";
import { LeftPanel } from "./components/panels/LeftPanel";
import { RightPanel } from "./components/panels/RightPanel";
import { BottomPanel } from "./components/panels/BottomPanel";
import { CenterCanvas } from "./components/canvas/CenterCanvas";
import { VisualizationCanvas } from "./components/canvas/VisualizationCanvas";
import { MandrelForm } from "./components/forms/MandrelForm";
import { TowForm } from "./components/forms/TowForm";
import { MachineSettingsForm } from "./components/forms/MachineSettingsForm";
import { LayerStack } from "./components/layers/LayerStack";
import { HoopLayerEditor } from "./components/editors/HoopLayerEditor";
import { HelicalLayerEditor } from "./components/editors/HelicalLayerEditor";
import { SkipLayerEditor } from "./components/editors/SkipLayerEditor";
import { useProjectStore } from "./stores/projectStore";
import { useFileOperations } from "./hooks/useFileOperations";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

const ExportConfirmationDialog = lazy(() =>
  import("./components/dialogs/ExportConfirmationDialog").then((module) => ({
    default: module.ExportConfirmationDialog,
  })),
);

export default function App() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>("main");

  // Project store - use shallow comparison for multiple selectors
  const {
    project,
    activeLayerId,
    layers,
  } = useProjectStore(
    useShallow((state) => ({
      project: state.project,
      activeLayerId: state.project.activeLayerId,
      layers: state.project.layers,
    })),
  );

  // Find active layer
  const activeLayer = activeLayerId
    ? layers.find((l) => l.id === activeLayerId)
    : null;

  // Layout state
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const fileOps = useFileOperations();

  // Wire up keyboard shortcuts
  useKeyboardShortcuts({
    onNew: fileOps.handleNewProject,
    onOpen: fileOps.handleOpen,
    onSave: fileOps.handleSave,
    onSaveAs: fileOps.handleSaveAs,
    onExport: () => setShowExportDialog(true),
    onDuplicate: fileOps.handleDuplicateLayer,
    onDelete: fileOps.handleDeleteLayer,
  });

  // Unsaved changes prompt
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (project.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [project.isDirty]);

  // Keyboard shortcuts for tab switching (Alt+1/2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        if (e.key === "1") {
          e.preventDefault();
          setActiveTab("main");
        } else if (e.key === "2") {
          e.preventDefault();
          setActiveTab("stream");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Render appropriate tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "main":
        return (
          <MainTab
            leftPanel={
              <LeftPanel>
                <MandrelForm />
                <div className="app-form-section">
                  <TowForm />
                </div>
                <div className="app-form-section">
                  <MachineSettingsForm />
                </div>
              </LeftPanel>
            }
            centerCanvas={
              <CenterCanvas>
                <VisualizationCanvas
                  onExport={() => setShowExportDialog(true)}
                />
              </CenterCanvas>
            }
            rightPanel={
              <RightPanel>
                {!activeLayer ? (
                  <div className="panel-placeholder">
                    <p className="panel-placeholder-text">
                      Select a layer to edit its properties
                    </p>
                  </div>
                ) : activeLayer.type === "hoop" ? (
                  <HoopLayerEditor layerId={activeLayer.id} />
                ) : activeLayer.type === "helical" ? (
                  <HelicalLayerEditor layerId={activeLayer.id} />
                ) : activeLayer.type === "skip" ? (
                  <SkipLayerEditor layerId={activeLayer.id} />
                ) : null}
              </RightPanel>
            }
            bottomPanel={
              <BottomPanel>
                <LayerStack />
              </BottomPanel>
            }
            leftPanelCollapsed={leftPanelCollapsed}
            rightPanelCollapsed={rightPanelCollapsed}
          />
        );

      case "stream":
        return <StreamTab />;

      default:
        return null;
    }
  };

  return (
    <MainLayout
      menuBar={
        <MenuBar
          onToggleLeftPanel={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
          onToggleRightPanel={() =>
            setRightPanelCollapsed(!rightPanelCollapsed)
          }
        />
      }
      tabBar={<TabBar activeTab={activeTab} onTabChange={setActiveTab} />}
      content={renderTabContent()}
      statusBar={<StatusBar />}
    >
      <CliHealthWarning />
      <ToastContainer />
      <Suspense fallback={null}>
        {showExportDialog && (
          <ExportConfirmationDialog
            project={project}
            onConfirm={async () => {
              setShowExportDialog(false);
              await fileOps.handleExportGcode();
            }}
            onCancel={() => setShowExportDialog(false)}
          />
        )}
      </Suspense>
    </MainLayout>
  );
}
