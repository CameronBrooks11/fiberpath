import { open as openExternal } from "@tauri-apps/plugin-shell";
import { join } from "@tauri-apps/api/path";
import { FormEvent, useState } from "react";

import { FileField } from "./components/FileField";
import { ResultCard } from "./components/ResultCard";
import { StatusText } from "./components/StatusText";
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

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="hero__eyebrow">Automated Composite Filament Winding</p>
        <h1>FiberPath Desktop</h1>
        <p className="hero__lead">Plan, visualize, simulate, and stream without leaving a single window.</p>
        <div className="hero__tags">
          <span>Toolpath generation</span>
          <span>Visual inspection & validation</span>
          <span>Real-time streaming control</span>
        </div>
        <div className="hero__links">
          <button type="button" onClick={handleDocsLink}>
            Documentation ↗
          </button>
        </div>
      </header>

      <main>
        <div className="panel-grid">
          <section className="panel">
            <h2>1. Plan</h2>
            <form onSubmit={handlePlan}>
              <fieldset>
                <FileField
                  label="Wind definition"
                  value={planInput}
                  onChange={setPlanInput}
                  filterExtensions={["wind"]}
                />
              </fieldset>
              <fieldset>
                <FileField
                  label="Output G-code (optional)"
                  value={planOutput}
                  onChange={setPlanOutput}
                  placeholder="Auto-generate temp file"
                  filterExtensions={["gcode"]}
                />
              </fieldset>
              <fieldset>
                <FileField
                  label="Output folder (optional)"
                  value={planOutputDir}
                  onChange={setPlanOutputDir}
                  placeholder="Defaults to system temp directory"
                  directory={true}
                />
              </fieldset>
              <fieldset>
                <label>
                  <span>Output filename (optional)</span>
                  <input
                    type="text"
                    placeholder="fiberpath"
                    value={planOutputName}
                    onChange={(e) => setPlanOutputName(e.target.value)}
                  />
                </label>
              </fieldset>
              <fieldset>
                <label>
                  <span>Axis format</span>
                  <select value={axisFormat} onChange={(e) => setAxisFormat(e.target.value as AxisFormat)}>
                    <option value="xab">XAB (Standard rotational)</option>
                    <option value="xyz">XYZ (Legacy compatibility)</option>
                  </select>
                </label>
                <small style={{ display: "block", marginTop: "0.25rem", color: "var(--text-secondary, #999)" }}>
                  XAB: A=mandrel rotation (deg), B=delivery rotation (deg). XYZ: Y/Z as linear axes for Cyclone compatibility.
                </small>
              </fieldset>
              <button className="primary" type="submit" disabled={planResult.status === "running"}>
                {planResult.status === "running" ? "Planning…" : "Plan wind"}
              </button>
            </form>
            <StatusText state={planResult.status} message={planResult.error} />
            {planResult.data ? <ResultCard title="Summary">{renderPlanSummary(planResult.data)}</ResultCard> : null}
          </section>

          <section className="panel">
            <h2>2. Plot Preview</h2>
            <form onSubmit={handlePlot}>
              <fieldset>
                <FileField label="G-code" value={plotInput} onChange={setPlotInput} filterExtensions={["gcode"]} />
              </fieldset>
              <fieldset>
                <FileField
                  label="Output folder (optional)"
                  value={plotOutputDir}
                  onChange={setPlotOutputDir}
                  placeholder="Defaults to temp directory"
                  directory
                />
              </fieldset>
              <fieldset>
                <label>
                  <span>Output filename (optional)</span>
                  <input
                    type="text"
                    placeholder="preview"
                    value={plotOutputName}
                    onChange={(e) => setPlotOutputName(e.target.value)}
                  />
                </label>
              </fieldset>
              <fieldset>
                <label>
                  <span>Scale</span>
                  <input
                    type="number"
                    min={0.1}
                    max={2}
                    step={0.1}
                    value={plotScale}
                    onChange={(event) => setPlotScale(Number(event.target.value))}
                  />
                </label>
              </fieldset>
              <button className="primary" type="submit" disabled={plotResult.status === "running"}>
                {plotResult.status === "running" ? "Rendering…" : "Render preview"}
              </button>
            </form>
            <StatusText state={plotResult.status} message={plotResult.error} />
            {plotResult.data ? (
              <ResultCard title="Preview">
                <img
                  className="preview-image"
                  src={`data:image/png;base64,${plotResult.data.imageBase64}`}
                  alt="Plot preview"
                />
                <small>PNG saved to {plotResult.data.path}</small>
              </ResultCard>
            ) : null}
          </section>

          <section className="panel">
            <h2>3. Simulate</h2>
            <form onSubmit={handleSimulate}>
              <fieldset>
                <FileField label="G-code" value={simulateInput} onChange={setSimulateInput} filterExtensions={["gcode"]} />
              </fieldset>
              <button className="primary" type="submit" disabled={simulateResult.status === "running"}>
                {simulateResult.status === "running" ? "Simulating…" : "Simulate"}
              </button>
            </form>
            <StatusText state={simulateResult.status} message={simulateResult.error} />
            {simulateResult.data ? <ResultCard title="Stats">{renderJson(simulateResult.data)}</ResultCard> : null}
          </section>

          <section className="panel">
            <h2>4. Stream</h2>
            <form onSubmit={handleStream}>
              <fieldset>
                <FileField label="G-code" value={streamInput} onChange={setStreamInput} filterExtensions={["gcode"]} />
              </fieldset>
              <fieldset>
                <label>
                  <span>Baud rate</span>
                  <input type="number" value={baudRate} onChange={(event) => setBaudRate(Number(event.target.value))} />
                </label>
              </fieldset>
              <fieldset>
                <label>
                  <span>Serial port</span>
                  <input
                    value={serialPort}
                    disabled={dryRun}
                    onChange={(event) => setSerialPort(event.target.value)}
                  />
                </label>
              </fieldset>
              <fieldset>
                <label className="toggle-field">
                  <input type="checkbox" checked={dryRun} onChange={(event) => setDryRun(event.target.checked)} />
                  Dry-run mode (recommended when no hardware is attached)
                </label>
              </fieldset>
              <button className="primary" type="submit" disabled={streamResult.status === "running"}>
                {streamResult.status === "running" ? "Streaming…" : dryRun ? "Simulate stream" : "Stream to device"}
              </button>
            </form>
            <StatusText state={streamResult.status} message={streamResult.error} />
            {streamResult.data ? <ResultCard title="Stream summary">{renderJson(streamResult.data)}</ResultCard> : null}
          </section>
        </div>
      </main>
      <footer className="app-footer">
        <small>
          CLI operations run in the existing Python environment. Ensure `fiberpath` is on PATH before launching the GUI.
        </small>
      </footer>
    </div>
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
