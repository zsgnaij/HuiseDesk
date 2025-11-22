import { ipcMain } from "electron";
import openWinService from "../service/openWinService.js";

class WinApiChannels {
  register() {
    ipcMain.on("openCompressorWindow", () => {
      openWinService.openCompressorWindow();
    });
  }
}

export default new WinApiChannels();