// renderer/types/winApiTypes.ts
export interface WinApi {
  openCompressorWindow: () => void;
}

declare global {
  interface Window {
    winApi: WinApi;
  }
}

// 确保这是一个模块
export {};