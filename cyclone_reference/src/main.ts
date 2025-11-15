import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { promises as fsPromises } from 'fs';
import { createWriteStream } from 'fs';
import { MarlinPort } from "./marlin-port";
import { planWind } from "./planner";
import { plotGCode } from "./plotter";

// Function to create the window
function createWindow() {
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      nodeIntegration: false, // Important for security
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile(path.join(__dirname, "../index.html"));
  mainWindow.webContents.openDevTools();
}

// Electron ready event
app.on("ready", () => {
  createWindow();
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Window-all-closed event to quit app
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle("plan", async (_, { windFile, outputFilePath }) => {
  try {
    // Get the absolute file path from the renderer's File object
    const windFilePath = windFile.path; // This should now be passed from the renderer

    console.log("IPC Plan call - Wind File Path:", windFilePath);
    console.log("IPC Plan call - Output File Path:", outputFilePath);

    // Read the wind file using the full path
    const windData = JSON.parse(await fsPromises.readFile(windFilePath, "utf8"));
    const gcode = planWind(windData, false);
    await fsPromises.writeFile(outputFilePath, gcode.join("\n"));

    return { success: true, message: `GCode saved to ${outputFilePath}` };
  } catch (error) {
    console.error("Error in IPC Plan handler:", error.message);
    return { success: false, message: `Error: ${error.message}` };
  }
});

// Plotting and running gcode remain unchanged
ipcMain.handle("plot", async (_, { gcodeFilePath, outputFilePath }) => {
  try {
    const gcodeContent = await fsPromises.readFile(gcodeFilePath, "utf8");
    const stream = plotGCode(gcodeContent.split("\n"));
    if (!stream) throw new Error("Failed to generate plot.");
    const fileStream = createWriteStream(outputFilePath);
    stream.pipe(fileStream);
    return { success: true, message: `Plot saved to ${outputFilePath}` };
  } catch (error) {
    return { success: false, message: `Error: ${error.message}` };
  }
});

ipcMain.handle("run", async (_, { gcodeFilePath, serialPort }) => {
  try {
    const gcodeContent = await fsPromises.readFile(gcodeFilePath, "utf8");
    const marlin = new MarlinPort(serialPort, false);
    await marlin.initialize();

    gcodeContent.split("\n").forEach((command) => marlin.queueCommand(command));
    return { success: true, message: "GCode sent successfully" };
  } catch (error) {
    return { success: false, message: `Error: ${error.message}` };
  }
});
