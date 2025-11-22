import { BrowserWindow } from "electron";

class OpenWinService {
  private compressorWindow: BrowserWindow | null = null;

  openCompressorWindow() {
    if (this.compressorWindow) {
      this.compressorWindow.moveTop();
      return;
    }
    this.compressorWindow = new BrowserWindow({
      width: 800,
      height: 600,
    });
    this.compressorWindow.loadURL("https://zsgnaij.github.io/qycc/");
    this.compressorWindow.show();
    this.compressorWindow.on("closed", () => {
      this.compressorWindow = null;
    });
  }
}

export default new OpenWinService();