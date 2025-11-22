import { contextBridge, ipcRenderer } from "electron";

window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ["chrome", "node", "electron"]) {
    const version = process.versions[type];
    if (version) {
      replaceText(`${type}-version`, version);
    }
  }
});

contextBridge.exposeInMainWorld("winApi", {
  openCompressorWindow: () => ipcRenderer.send("openCompressorWindow"),
});