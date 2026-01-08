import { open as openExternal } from "@tauri-apps/plugin-shell";
import { join } from "@tauri-apps/api/path";
import { FormEvent, useState, useEffect } from "react";

import { FileField } from "./components/FileField";
import { ResultCard } from "./components/ResultCard";
import { StatusText } from "./components/StatusText";
import { MainLayout } from "./layouts/MainLayout";
import { MenuBar } from "./components/MenuBar";
import { StatusBar } from "./components/StatusBar";
import { LeftPanel } from "./components/panels/LeftPanel";
import { RightPanel } from "./components/panels/RightPanel";
import { BottomPanel } from "./components/panels/BottomPanel";
import { CenterCanvas } from "./components/canvas/CenterCanvas";
import { MandrelForm } from "./components/forms/MandrelForm";
import { TowForm } from "./components/forms/TowForm";
import { LayerStack } from "./components/layers/LayerStack";
import { HoopLayerEditor } from "./components/editors/HoopLayerEditor";
import { HelicalLayerEditor } from "./components/editors/HelicalLayerEditor";
import { SkipLayerEditor } from "./components/editors/SkipLayerEditor";
import { useProjectStore } from "./state/projectStore";
import {
  planWind,
  previewPlot,
  simulateProgram,
  streamProgram,
  type AxisFormat,
  type PlanSummary,
  type PlotPreviewPayload,
  type SimulationSummary,
  type StreamSummary,
} from "./lib/commands";

interface PanelState<T> {
  status: "idle" | "running" | "success" | "error";
  data?: T;
  error?: string;
}

const idleState = { status: "idle" } as const;

export default function App() {
  // Project store
  const project = useProjectStore((state) => state.project);
  const newProject = useProjectStore((state) => state.newProject);
  const activeLayerId = useProjectStore((state) => state.project.activeLayerId);
  const layers = useProjectStore((state) => state.project.layers);
  
  // Find active layer
  const activeLayer = activeLayerId ? layers.find(l => l.id === activeLayerId) : null;
  
  // Layout state
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  
  // Unsaved changes prompt
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (project.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [project.isDirty]);
  
  // Existing state
  const [planInput, setPlanInput] = useState("");
  const [planOutput, setPlanOutput] = useState("");
  const [planOutputDir, setPlanOutputDir] = useState("");
  const [planOutputName, setPlanOutputName] = useState("");
  const [axisFormat, setAxisFormat] = useState<AxisFormat>("xab");
  const [planResult, setPlanResult] = useState<PanelState<PlanSummary>>(idleState);

  const [plotInput, setPlotInput] = useState("");
  const [plotScale, setPlotScale] = useState(0.5);
  const [plotOutputDir, setPlotOutputDir] = useState("");
  const [plotOutputName, setPlotOutputName] = useState("");
  const [plotResult, setPlotResult] = useState<PanelState<PlotPreviewPayload>>(idleState);

  const [simulateInput, setSimulateInput] = useState("");
  const [simulateResult, setSimulateResult] = useState<PanelState<SimulationSummary>>(idleState);

  const [streamInput, setStreamInput] = useState("");
  const [serialPort, setSerialPort] = useState("/dev/ttyUSB0");
  const [baudRate, setBaudRate] = useState(250_000);
  const [dryRun, setDryRun] = useState(true);
  const [streamResult, setStreamResult] = useState<PanelState<StreamSummary>>(idleState);

  const handlePlan = async (event: FormEvent) => {
    event.preventDefault();
    if (!planInput) {
      setPlanResult({ status: "error", error: "Select a .wind file" });
      return;
    }
    setPlanResult({ status: "running" });
    try {
      let fullOutputPath: string | undefined = planOutput || undefined;
      
      if (planOutputDir) {
        let filename = planOutputName?.trim() || "fiberpath";
        if (!filename.toLowerCase().endsWith(".gcode")) {
          filename += ".gcode";
        }
        fullOutputPath = await join(planOutputDir, filename);
      }
      
      const summary = await planWind(planInput, fullOutputPath, axisFormat);
      setPlanResult({ status: "success", data: summary });
    } catch (error) {
      setPlanResult({ status: "error", error: extractError(error) });
    }
  };

  const handlePlot = async (event: FormEvent) => {
    event.preventDefault();
    if (!plotInput) {
      setPlotResult({ status: "error", error: "Select a .gcode file" });
      return;
    }
    setPlotResult({ status: "running" });
    try {
      let fullOutputPath: string | undefined;
      
      if (plotOutputDir) {
        let filename = plotOutputName?.trim() || "preview";
        if (!filename.toLowerCase().endsWith(".png")) {
          filename += ".png";
        }
        fullOutputPath = await join(plotOutputDir, filename);
      }
      
      const preview = await previewPlot(plotInput, plotScale, fullOutputPath);
      setPlotResult({ status: "success", data: preview });
    } catch (error) {
      setPlotResult({ status: "error", error: extractError(error) });
    }
  };

  const handleSimulate = async (event: FormEvent) => {
    event.preventDefault();
    if (!simulateInput) {
      setSimulateResult({ status: "error", error: "Select a .gcode file" });
      return;
    }
    setSimulateResult({ status: "running" });
    try {
      const summary = await simulateProgram(simulateInput);
      setSimulateResult({ status: "success", data: summary });
    } catch (error) {
      setSimulateResult({ status: "error", error: extractError(error) });
    }
  };

  const handleStream = async (event: FormEvent) => {
    event.preventDefault();
    if (!streamInput) {
      setStreamResult({ status: "error", error: "Select a .gcode file" });
      return;
    }
    if (!dryRun && !serialPort) {
      setStreamResult({ status: "error", error: "Port is required for live runs" });
      return;
    }
    setStreamResult({ status: "running" });
    try {
      const summary = await streamProgram(streamInput, { port: dryRun ? undefined : serialPort, baudRate, dryRun });
      setStreamResult({ status: "success", data: summary });
    } catch (error) {
      setStreamResult({ status: "error", error: extractError(error) });
    }
  };

  const handleDocsLink = () => {
    void openExternal("https://cameronbrooks11.github.io/fiberpath");
  };
  
  const handleNewProject = () => {
    if (project.isDirty) {
      const confirmed = confirm("You have unsaved changes. Create new project anyway?");
      if (!confirmed) return;
    }
    newProject();
  };

  return (
    <MainLayout
      menuBar={
        <MenuBar
          onNewProject={handleNewProject}
          onToggleLeftPanel={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
          onToggleRightPanel={() => setRightPanelCollapsed(!rightPanelCollapsed)}
        />
      }
      leftPanel={
        <LeftPanel>
          <MandrelForm />
          <div style={{ marginTop: '1.5rem' }}>
            <TowForm />
          </div>
        </LeftPanel>
      }
      centerCanvas={
        <CenterCanvas>
          <div className="canvas-placeholder">
            <div className="canvas-placeholder-icon">⬢</div>
            <div className="canvas-placeholder-text">
              2D visualization canvas will appear here in Phase 6.<br />
              Use the Tools menu to access existing workflows.
            </div>
          </div>
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
          ) : activeLayer.type === 'hoop' ? (
            <HoopLayerEditor layerId={activeLayer.id} />
          ) : activeLayer.type === 'helical' ? (
            <HelicalLayerEditor layerId={activeLayer.id} />
          ) : activeLayer.type === 'skip' ? (
            <SkipLayerEditor layerId={activeLayer.id} />
          ) : null}
        </RightPanel>
      }
      bottomPanel={
        <BottomPanel>
          <LayerStack />
        </BottomPanel>
      }
      statusBar={
        <StatusBar />
      }
      leftPanelCollapsed={leftPanelCollapsed}
      rightPanelCollapsed={rightPanelCollapsed}
    />
  );
}

function renderPlanSummary(data: PlanSummary) {
  const formatLabel = data.axisFormat === "xab" ? "XAB (Rotational)" : data.axisFormat === "xyz" ? "XYZ (Legacy)" : data.axisFormat || "XAB (Rotational)";
  
  return (
    <div>
      <div style={{ marginBottom: "0.75rem", padding: "0.5rem", background: "var(--bg-card, #1a1a1c)", borderRadius: "4px", borderLeft: "3px solid var(--primary, #12a89a)" }}>
        <strong style={{ color: "var(--primary, #12a89a)" }}>Axis Format:</strong> {formatLabel}
      </div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

function renderJson(data: unknown) {
  return <pre className="output-text">{JSON.stringify(data, null, 2)}</pre>;
}

function extractError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
