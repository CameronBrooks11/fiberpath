// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  plan: (windFileName: string, outputFilePath: string) => {
    console.log('IPC Plan call - Wind File Name:', windFileName);
    console.log('IPC Plan call - Output File Path:', outputFilePath);

    // Send the data to the main process
    return ipcRenderer.invoke("plan", { windFileName, outputFilePath });
  },
  plot: (gcodeFilePath: string, outputFilePath: string) => {
    console.log('IPC Plot call - GCode File Path:', gcodeFilePath);
    console.log('IPC Plot call - Output File Path:', outputFilePath);
    return ipcRenderer.invoke("plot", { gcodeFilePath, outputFilePath });
  },
  run: (gcodeFilePath: string, serialPort: string) => {
    console.log('IPC Run call - GCode File Path:', gcodeFilePath);
    console.log('IPC Run call - Serial Port:', serialPort);
    return ipcRenderer.invoke("run", { gcodeFilePath, serialPort });
  },
});


window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector);
    if (element) {
      element.innerText = text;
    }
  };

  for (const type of ["chrome", "node", "electron"]) {
    replaceText(`${type}-version`, process.versions[type as keyof NodeJS.ProcessVersions]);
  }
});
