# HuiseDesk

一个基于monorepo管理的多模块项目，包含Electron客户端、大模型服务和ShotGrid Python脚本。

## 项目结构

```
.
├── packages/
│   ├── electron-app/          # Electron客户端应用
│   ├── llm-server/            # 大语言模型服务
│   └── sg-scripts/            # ShotGrid Python脚本
├── package.json
└── start.js
```

## 模块介绍

### 1. Electron客户端 (electron-app)

基于Electron的桌面应用，使用React和TypeScript构建。

主要功能：
- 聊天界面：与大语言模型进行交互
- ShotGrid集成：上传图片到ShotGrid系统
- 性能测试：集成性能基准测试工具
- MDT页面：支持大型数据表格展示

技术栈：
- Electron
- React 19
- TypeScript
- Vite
- Ant Design

### 2. 大语言模型服务 (llm-server)

基于Node.js和Express的大语言模型服务，支持多种AI模型。

主要功能：
- 支持DeepSeek和Mistral模型
- 流式响应和非流式响应API
- 图片上传到ShotGrid功能
- 健康检查和模型列表接口

技术栈：
- Node.js
- Express 5
- LangChain
- DeepSeek API
- Mistral API

API接口：
- `POST /api/chat/stream/deepseek` - DeepSeek流式响应
- `POST /api/chat/stream/mistral` - Mistral流式响应
- `POST /api/chat/deepseek` - DeepSeek非流式响应
- `GET /api/models` - 获取可用模型列表
- `POST /api/upload-to-shotgrid` - 上传图片到ShotGrid

### 3. ShotGrid脚本 (sg-scripts)

用于与ShotGrid系统交互的Python脚本。

主要功能：
- 上传图片到ShotGrid作为资产版本
- 自动创建资产和版本管理

技术栈：
- Python 3.10+
- ShotGrid API

## 快速开始

### 环境要求

- Node.js (推荐v18或更高版本)
- Python 3.10+
- Poetry (Python包管理器)

### 安装依赖

```bash
# 安装所有依赖（包括Python依赖）
npm install
```

### 启动开发环境

```bash
# 启动整个开发环境
npm start
```

该命令会同时启动：
1. 大语言模型服务 (http://localhost:3000)
2. Electron客户端应用

### 单独启动各模块

```bash
# 启动大语言模型服务
cd packages/llm-server
npm run serve

# 启动Electron客户端（需先启动llm-server）
cd packages/electron-app
npm run dev
```

## 构建

```bash
# 构建Electron应用
cd packages/electron-app
npm run build
```

## 配置

### 大语言模型服务配置

在`packages/llm-server/src/apiKey.js`中配置您的API密钥：

```javascript
export const DEEPSEEK_API_KEY = "your_deepseek_api_key";
export const MISTRAL_API_KEY = "your_mistral_api_key";
```

### ShotGrid配置

在`packages/sg-scripts/src/sg.py`中配置您的ShotGrid连接信息：

```python
SERVER_URL = "your_shotgrid_server_url"
SCRIPT_NAME = "your_script_name"
API_KEY = "your_api_key"
PROJECT_NAME = "your_project_name"
```