import { BrowserWindow } from "electron";

class OpenWinService {
  private compressorWindow: BrowserWindow | null = null;
  private windowPool = new Map<string, BrowserWindow>();

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
  openWindowByUrl(url: string) {
    if (this.windowPool.has(url)) {
      this.windowPool.get(url)?.moveTop();
      return;
    }
    const window = new BrowserWindow({
      width: 800,
      height: 600,
    });
    window.loadURL(url);
    window.show();
    this.windowPool.set(url, window);
    window.on("closed", () => {
      this.windowPool.delete(url);
    });
  }
}

export default new OpenWinService();
