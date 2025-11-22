import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import initChannels from "./channels";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "../dist/preload.cjs"), 
    },
  });

  mainWindow.loadURL("http://localhost:5173/");
  // setTimeout(() => {
  //   mainWindow.webContents.openDevTools({
  //     mode: "detach"
  //   })
  // }, 2000);
}

app.whenReady().then(() => {
  createMainWindow();
  initChannels(); 

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});