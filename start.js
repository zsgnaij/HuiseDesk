const { spawn } = require("child_process");
const path = require("path");
const { initializeEnvironment, getRuntimeEnv } = require("./init");

console.log("🔧 正在初始化开发环境...");

try {
  initializeEnvironment();
} catch (err) {
  console.error("❌ 初始化开发环境失败:", err.message);
  process.exit(1);
}

const runtimeEnv = getRuntimeEnv();

console.log("🚀 开始启动项目...");

// 启动服务器
console.log("🔧 正在启动 LLM 服务器...");
const serverProcess = spawn("npm", ["run", "serve"], {
  cwd: path.resolve(__dirname, "packages", "llm-server"),
  stdio: "inherit",
  shell: true,
  env: runtimeEnv,
});

serverProcess.on("error", (err) => {
  console.error("❌ 启动服务器失败:", err);
  process.exit(1);
});

serverProcess.on("close", (code) => {
  if (code !== 0) {
    console.error(`❌ 服务器退出，退出码: ${code}`);
    process.exit(code);
  }
});

// 等待服务器启动后再启动 Electron 应用
setTimeout(() => {
  console.log("🔧 正在启动 Electron 应用...");
  const electronProcess = spawn("npm", ["run", "dev"], {
    cwd: path.resolve(__dirname, "packages", "electron-app"),
    stdio: "inherit",
    shell: true,
    env: runtimeEnv,
  });

  electronProcess.on("error", (err) => {
    console.error("❌ 启动 Electron 应用失败:", err);
    process.exit(1);
  });

  electronProcess.on("close", (code) => {
    if (code !== 0) {
      console.error(`❌ Electron 应用退出，退出码: ${code}`);
      process.exit(code);
    }
  });

  // 监听进程退出事件，确保清理所有子进程
  process.on("SIGINT", () => {
    console.log("\n🛑 正在关闭所有进程...");
    serverProcess.kill();
    electronProcess.kill();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 正在关闭所有进程...");
    serverProcess.kill();
    electronProcess.kill();
    process.exit(0);
  });
}, 3000); // 等待3秒确保服务器启动
