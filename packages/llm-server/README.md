# DeepSeek AI Express 服务器

基于 Express 的 AI 服务器，支持流式和非流式返回 DeepSeek 大模型响应。

## 📋 功能特性

✅ **流式响应** - 使用 Server-Sent Events (SSE) 实时返回 AI 生成内容
✅ **非流式响应** - 传统的等待完整响应模式
✅ **CORS 支持** - 允许前端跨域调用
✅ **错误处理** - 完善的错误处理机制
✅ **健康检查** - 提供健康检查接口
✅ **中文注释** - 所有代码注释均为中文

## 🚀 快速开始

### 1. 启动服务器

```bash
# 方式 1: 使用 npm script
npm run server

# 方式 2: 直接运行
node server/app.js
```

服务器将在 `http://localhost:3000` 启动。

### 2. 测试 API

访问根路径查看 API 文档:
```bash
curl http://localhost:3000
```

健康检查:
```bash
curl http://localhost:3000/health
```

## 📡 API 接口

### 1. 流式 AI 响应 (推荐)

**接口**: `POST /api/chat/stream`

**请求体**:
```json
{
  "prompt": "你的问题",
  "systemPrompt": "系统提示（可选）"
}
```

**响应格式** (Server-Sent Events):
```
data: {"content":"你","type":"chunk"}

data: {"content":"好","type":"chunk"}

data: {"type":"done","stats":{"chunks":10,"totalChars":50}}
```

**使用示例**:

```javascript
// Node.js / Electron
const response = await fetch('http://localhost:3000/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        prompt: '解释什么是 JavaScript',
        systemPrompt: '你是一个编程专家'
    })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');
    
    for (const line of lines) {
        if (line.startsWith('data: ')) {
            const data = JSON.parse(line.substring(6));
            if (data.type === 'chunk') {
                console.log(data.content); // 实时输出
            }
        }
    }
}
```

**React 示例**:

```typescript
import { useState } from 'react';

function ChatComponent() {
    const [response, setResponse] = useState('');

    const streamChat = async (prompt: string) => {
        const res = await fetch('http://localhost:3000/api/chat/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = JSON.parse(line.substring(6));
                    if (data.type === 'chunk') {
                        setResponse(prev => prev + data.content);
                    }
                }
            }
        }
    };

    return (
        <div>
            <button onClick={() => streamChat('Hello')}>发送</button>
            <div>{response}</div>
        </div>
    );
}
```

### 2. 非流式 AI 响应

**接口**: `POST /api/chat`

**请求体**:
```json
{
  "prompt": "你的问题",
  "systemPrompt": "系统提示（可选）"
}
```

**响应**:
```json
{
  "success": true,
  "content": "AI 的完整响应内容",
  "length": 156
}
```

**使用示例**:

```javascript
const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        prompt: '介绍一下 Node.js'
    })
});

const data = await response.json();
console.log(data.content); // 完整响应
```

### 3. 健康检查

**接口**: `GET /health`

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-07T10:30:00.000Z",
  "service": "DeepSeek AI Server"
}
```

## 🔧 配置

### 端口配置

默认端口为 `3000`，可以通过环境变量修改:

```bash
PORT=8080 npm run server
```

### API Key 配置

在 `server/apiKey.js` 中配置你的 DeepSeek API Key:

```javascript
export default {
    sk: "your-deepseek-api-key-here"
};
```

## 📂 文件结构

```
server/
├── app.js              # Express 服务器主文件
├── index.js            # DeepSeek 集成和函数导出
├── apiKey.js           # API Key 配置
├── client-example.js   # 客户端调用示例
└── README.md           # 本文档
```

## 🧪 测试客户端

运行客户端示例测试服务器:

```bash
# 先启动服务器
npm run server

# 新开一个终端，运行客户端示例
npm run client-example
```

## 🎯 使用场景

### 1. Electron 应用中调用

```javascript
// 在 Electron 渲染进程中
async function askAI(question) {
    const response = await fetch('http://localhost:3000/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: question })
    });

    // 处理流式响应...
}
```

### 2. React 组件中使用

参考上面的 React 示例，实现实时的对话界面。

### 3. 命令行工具

```javascript
// CLI 工具
import fetch from 'node-fetch';

const prompt = process.argv[2] || 'Hello AI';
const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
});

const data = await response.json();
console.log(data.content);
```

## ⚡ 性能优化

### 流式响应的优势

- ✅ **更快的首字响应** - 不需要等待完整内容生成
- ✅ **更好的用户体验** - 用户可以实时看到内容
- ✅ **降低超时风险** - 长文本生成不会触发请求超时

### 建议

- 对于长文本生成，使用流式接口
- 对于短问答，可以使用非流式接口
- 根据网络状况选择合适的超时时间

## 🔒 安全建议

1. **生产环境**:
   - 添加 API 认证（JWT Token）
   - 限制请求频率（Rate Limiting）
   - 使用 HTTPS
   - 配置防火墙规则

2. **API Key 保护**:
   - 不要将 API Key 提交到 Git
   - 使用环境变量管理敏感信息
   - 定期更换 API Key

## 🐛 故障排查

### 问题 1: 端口已被占用

```bash
# Windows
netstat -ano | findstr :3000
taskkill /F /PID <PID>

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### 问题 2: CORS 错误

确保服务器已启用 CORS 中间件（已配置）。

### 问题 3: 流式响应中断

检查网络连接和 DeepSeek API 状态。

## 📚 相关文档

- [Express 官方文档](https://expressjs.com/)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [LangChain.js 文档](https://js.langchain.com/)
- [DeepSeek API](https://platform.deepseek.com/)

## 🎉 完成！

现在你已经拥有一个功能完整的 AI 流式响应服务器！
