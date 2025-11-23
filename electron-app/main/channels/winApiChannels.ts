import { ipcMain } from "electron";
import openWinService from "../service/openWinService.js";

class WinApiChannels {
  register() {
    ipcMain.on("openCompressorWindow", () => {
      openWinService.openCompressorWindow();
    });
    ipcMain.on("openWindowByUrl", (_event, url) => {
      openWinService.openWindowByUrl(url);
    });
  }
}

export default new WinApiChannels();
