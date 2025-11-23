import { defineConfig } from 'vite';
import path from 'path';

// Vite 配置文档: https://vitejs.dev/config/
export default defineConfig({
  // 设置基础路径为空字符串
  base: '',
  // 项目根目录设置为项目根目录
  root: path.resolve(__dirname, '..'),
  // 插件配置
  plugins: [],
  // 路径解析配置
  resolve: {
    // 支持的文件扩展名
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  // 构建配置
  build: {
    outDir: path.resolve(__dirname, '../dist'), // 输出目录
    target: 'node16', // 指定 Node.js 版本目标
    // 生成 source map 便于调试
    sourcemap: true,
    // 清空输出目录
    emptyOutDir: true,
    // Rollup 配置
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, '../main/main.ts'),
        preload: path.resolve(__dirname, '../main/preload.ts')
      },
      output: [{
        entryFileNames: '[name].js', // 输出文件名
        format: 'es' // 主进程使用 ES 模块格式
      }, {
        entryFileNames: '[name].cjs', // preload 使用 .cjs 扩展名
        format: 'cjs', // preload 使用 CommonJS 格式
        dir: path.resolve(__dirname, '../dist')
      }],
      external: [
        'electron',
        'path',
        'fs',
        'child_process',
        'os',
        'url',
        'module',
        'crypto',
        'events',
        'stream',
        'util',
        'buffer',
        'assert',
        'zlib',
        'querystring',
        'vm',
        'readline',
        'constants',
        'perf_hooks',
        'process',
        'timers',
        'tty',
        'net',
        'dgram',
        'dns',
        'tls',
        'http',
        'https',
        'http2',
        'cluster',
        'worker_threads',
        'v8',
        'trace_events',
        'async_hooks',
        'inspector',
        'wasi'
      ]
    }
  },
  // 不需要开发服务器配置，因为这是用于构建的配置
  server: undefined
});