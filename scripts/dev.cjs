const { spawn } = require('child_process');
const path = require('path');
const net = require('net');

const VITE_PORT = 5173;
const VITE_HOST = 'localhost';
const SERVER_PORT = 3000;
const SERVER_HOST = 'localhost';

/**
 * Check if a port is in use
 */
function checkPort(port, host) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}

/**
 * Wait for Vite dev server to be ready
 */
async function waitForVite(maxRetries = 30) {
  console.log('⏳ Waiting for Vite dev server to start...');
  
  for (let i = 0; i < maxRetries; i++) {
    const isReady = await checkPort(VITE_PORT, VITE_HOST);
    if (isReady) {
      console.log('✅ Vite dev server is ready!');
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.error('❌ Vite dev server failed to start within timeout');
  return false;
}

/**
 * Wait for server to be ready
 */
async function waitForServer(maxRetries = 30) {
  console.log('⏳ Waiting for backend server to start...');
  
  for (let i = 0; i < maxRetries; i++) {
    const isReady = await checkPort(SERVER_PORT, SERVER_HOST);
    if (isReady) {
      console.log('✅ Backend server is ready!');
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.error('❌ Backend server failed to start within timeout');
  return false;
}

/**
 * Start Vite dev server
 */
function startVite() {
  console.log('🚀 Starting Vite dev server...');
  
  const viteProcess = spawn('npm', ['run', 'vite'], {
    cwd: path.resolve(__dirname, '..'),
    shell: true,
    stdio: 'inherit'
  });
  
  viteProcess.on('error', (err) => {
    console.error('❌ Failed to start Vite:', err);
    process.exit(1);
  });
  
  return viteProcess;
}

/**
 * Start backend server
 */
function startServer() {
  console.log('🚀 Starting backend server...');
  
  const serverProcess = spawn('npm', ['run', 'server'], {
    cwd: path.resolve(__dirname, '..'),
    shell: true,
    stdio: 'inherit'
  });
  
  serverProcess.on('error', (err) => {
    console.error('❌ Failed to start backend server:', err);
    process.exit(1);
  });
  
  return serverProcess;
}

/**
 * Start Electron application with Vite-built main process
 */
function startElectron() {
  console.log('🚀 Starting Electron with Vite-built main process...');
  
  // 先构建主进程
  const buildProcess = spawn('npm', ['run', 'vite:main'], {
    cwd: path.resolve(__dirname, '..'),
    shell: true,
    stdio: 'inherit'
  });
  
  buildProcess.on('error', (err) => {
    console.error('❌ Failed to build main process:', err);
    process.exit(1);
  });
  
  buildProcess.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ Failed to build main process');
      process.exit(1);
    }
    
    // 构建成功后启动 Electron
    const electronProcess = spawn('electron', ['--no-sandbox', './dist/main.js'], {
      cwd: path.resolve(__dirname, '..'),
      shell: true,
      stdio: 'inherit'
    });
    
    electronProcess.on('error', (err) => {
      console.error('❌ Failed to start Electron:', err);
      process.exit(1);
    });
    
    electronProcess.on('close', (code) => {
      console.log(`Electron exited with code ${code}`);
      process.exit(code);
    });
  });
  
  return buildProcess;
}

/**
 * Main function
 */
async function main() {
  console.log('🔧 Starting development environment with Vite support...\n');
  
  // Start backend server first
  const serverProcess = startServer();
  
  // Wait for server to be ready
  const serverReady = await waitForServer();
  
  if (!serverReady) {
    serverProcess.kill();
    process.exit(1);
  }
  
  // Start Vite dev server
  const viteProcess = startVite();
  
  // Wait for Vite to be ready
  const viteReady = await waitForVite();
  
  if (!viteReady) {
    viteProcess.kill();
    serverProcess.kill();
    process.exit(1);
  }
  
  // Start Electron
  const electronProcess = startElectron();
  
  // Handle cleanup on exit
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    viteProcess.kill();
    serverProcess.kill();
    electronProcess.kill();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down...');
    viteProcess.kill();
    serverProcess.kill();
    electronProcess.kill();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});