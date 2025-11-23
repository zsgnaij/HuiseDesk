import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Vite 配置文档: https://vitejs.dev/config/
export default defineConfig({
    // 设置基础路径为空字符串，使应用能从根路径访问
    base: '',
    // 项目根目录设置为 renderer 目录
    root: path.resolve(__dirname, '../renderer'),
    // 公共资源目录设置为项目根目录下的 public 目录
    publicDir: path.resolve(__dirname, '../public'),
    // 插件配置
    plugins: [
        react({
            // 启用 React 快速刷新
            fastRefresh: true,
            // 支持 TypeScript 的 JSX 转换
            babel: {
                parserOpts: {
                    plugins: ['decorators-legacy', 'classProperties']
                }
            }
        })
    ],

    // 路径解析配置
    resolve: {
        // 配置路径别名，方便模块导入
        alias: {
            '@': path.resolve(__dirname, '../renderer'),
            '@components': path.resolve(__dirname, '../renderer/components'),
            '@utils': path.resolve(__dirname, '../renderer/utils'),
            '@types': path.resolve(__dirname, '../renderer/types'),
        },
        // 支持的文件扩展名
        extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    },

    // 构建配置
    build: {
        outDir: path.resolve(__dirname, '../dist'), // 输出目录
        target: 'electron-renderer', // 指定 Electron 渲染进程目标
        // 生成 source map 便于调试
        sourcemap: true,
        // 清空输出目录
        emptyOutDir: true,
        // Rollup 配置
        rollupOptions: {
            input: path.resolve(__dirname, '../renderer/index.html')
        }
    },

    // 开发服务器配置
    server: {
        port: 5173, // 开发服务器端口
        strictPort: true, // 端口被占用时不自动尝试下一个端口
        host: 'localhost', // 监听地址
        // 热模块替换配置
        hmr: {
            overlay: true // 在浏览器中显示错误覆盖层
        },
        // 允许访问根目录之外的文件
        fs: {
            strict: false,
            allow: [path.resolve(__dirname, '..'), "public", "renderer"]
        },
        // 支持 SPA 路由，当访问不存在的路径时返回 index.html
        historyApiFallback: true
    },

    // TypeScript 类型检查（仅在开发模式下）
    esbuild: {
        // 支持 JSX 语法
        loader: 'tsx',
        // 在生产环境中移除 console 和 debugger
        drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
    },

    // 优化依赖预构建
    optimizeDeps: {
        // 需要预构建的依赖
        include: ['react', 'react-dom'],
        // 排除不需要预构建的依赖
        exclude: []
    }
});