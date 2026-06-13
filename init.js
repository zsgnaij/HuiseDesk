const { existsSync, readFileSync, writeFileSync } = require('node:fs');
const { delimiter, join } = require('node:path');
const { homedir } = require('node:os');
const { spawnSync } = require('node:child_process');

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    stdio: options.stdio || 'inherit',
    shell: options.shell || false,
    env: {
      ...process.env,
      BUN_INSTALL: getBunInstallDir(),
      PATH: getPathWithLocalBins(),
    },
  });
}

function getBunInstallDir() {
  return process.env.BUN_INSTALL || join(homedir(), '.bun');
}

function getBunBinDir() {
  return join(getBunInstallDir(), 'bin');
}

function getPathWithLocalBins() {
  return [getBunBinDir(), process.env.PATH || ''].filter(Boolean).join(delimiter);
}

function getRuntimeEnv() {
  return {
    ...process.env,
    BUN_INSTALL: getBunInstallDir(),
    PATH: getPathWithLocalBins(),
  };
}

function commandExists(command) {
  const result = run(command, ['--version'], { stdio: 'ignore' });
  return result.status === 0;
}

function pythonModuleExists(moduleName) {
  const result = run('python', ['-m', moduleName, '--version'], { stdio: 'ignore' });
  return result.status === 0;
}

function installBun() {
  console.log('Bun is not installed. Installing Bun...');

  const isWindows = process.platform === 'win32';
  const result = isWindows
    ? run('powershell', ['-c', 'irm bun.sh/install.ps1 | iex'])
    : run('sh', ['-c', 'curl -fsSL https://bun.sh/install | bash']);

  if (result.status !== 0) {
    throw new Error('Failed to install Bun. Please install it manually from https://bun.sh/docs/installation');
  }
}

function ensureBunShellPath() {
  if (process.platform === 'win32') {
    return;
  }

  const zshrcPath = join(homedir(), '.zshrc');
  const bunPathConfig = [
    'export BUN_INSTALL="$HOME/.bun"',
    'export PATH="$BUN_INSTALL/bin:$PATH"',
  ].join('\n');
  const currentContent = existsSync(zshrcPath) ? readFileSync(zshrcPath, 'utf8') : '';

  if (currentContent.includes('BUN_INSTALL') || currentContent.includes('.bun/bin')) {
    return;
  }

  const separator = currentContent.endsWith('\n') || currentContent.length === 0 ? '' : '\n';
  writeFileSync(zshrcPath, `${currentContent}${separator}${bunPathConfig}\n`);
  console.log('Added Bun to ~/.zshrc. Run `source ~/.zshrc` or open a new terminal to use `bun` directly.');
}

function verifyBun() {
  const bunPath = join(getBunBinDir(), process.platform === 'win32' ? 'bun.exe' : 'bun');

  if (!commandExists('bun') && !existsSync(bunPath)) {
    throw new Error('Bun installation was not found after install.');
  }

  const version = run('bun', ['--version'], { stdio: 'pipe' });
  if (version.status === 0) {
    console.log(`Bun is ready: ${String(version.stdout || '').trim()}`);
    return;
  }

  console.log(`Bun is installed at ${bunPath}. Restart your terminal if the bun command is not available.`);
}

function ensurePip() {
  const hasPip = run('python', ['-m', 'pip', '--version'], { stdio: 'ignore' });
  if (hasPip.status === 0) {
    return;
  }

  console.log('pip is not available. Bootstrapping pip...');
  const result = run('python', ['-m', 'ensurepip', '--upgrade']);
  if (result.status !== 0) {
    throw new Error('Failed to bootstrap pip. Please install pip manually for the active Python environment.');
  }
}

function installPoetry() {
  console.log('Poetry is not installed. Installing Poetry...');
  ensurePip();

  const result = run('python', ['-m', 'pip', 'install', '--user', '--upgrade', 'poetry']);
  if (result.status !== 0) {
    console.log('User-level Poetry install failed. Retrying in the active Python environment...');
    const fallbackResult = run('python', ['-m', 'pip', 'install', '--upgrade', 'poetry']);
    if (fallbackResult.status !== 0) {
      throw new Error('Failed to install Poetry. Please install it manually with: python -m pip install --upgrade poetry');
    }
  }
}

function verifyPoetry() {
  const version = run('python', ['-m', 'poetry', '--version'], { stdio: 'pipe' });
  if (version.status !== 0) {
    throw new Error('Poetry installation was not found after install.');
  }

  console.log(`Poetry is ready: ${String(version.stdout || '').trim()}`);
}

function main() {
  if (!commandExists('python')) {
    throw new Error('Python is not installed or not available in PATH.');
  }

  if (!commandExists('bun')) {
    installBun();
  }

  verifyBun();
  ensureBunShellPath();

  if (!pythonModuleExists('poetry')) {
    installPoetry();
  }

  verifyPoetry();
}

module.exports = {
  initializeEnvironment: main,
  getRuntimeEnv,
};

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
