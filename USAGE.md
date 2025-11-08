# 使用指南 - AI 对话 Electron 应用

完整的使用指南，帮助你快速上手这个 AI 对话应用。

## 🚀 快速启动（3 步）

### 步骤 1: 启动 Express 服务器

打开第一个终端：

```bash
npm run server
```

你应该看到：
```
============================================================
🚀 DeepSeek AI 服务器已启动
📡 监听端口: 3000
🌐 访问地址: http://localhost:3000
============================================================
```

### 步骤 2: 启动开发环境

打开第二个终端：

```bash
npm run dev
```

这会同时启动：
- ✅ Vite 开发服务器 (http://localhost:5173)
- ✅ Electron 应用窗口

### 步骤 3: 开始对话

在 Electron 窗口中：
1. 输入你的问题
2. 按 Enter 发送
3. 实时查看 AI 回复

## 📋 所有可用命令

```bash
# 开发相关
npm run dev              # 启动 Vite + Electron（需要先启动 server）
npm run vite             # 只启动 Vite 开发服务器
npm run server           # 启动 Express AI 服务器

# 测试相关
npm run test-server      # 测试服务器 API
npm run client-example   # 运行客户端示例

# 类型检查
npx tsc --noEmit        # TypeScript 类型检查
```

## 🎯 功能介绍

### 1. AI 对话界面

- **实时流式响应** - AI 回复会逐字显示，体验更流畅
- **对话历史** - 自动保存所有对话记录
- **快捷键支持**:
  - `Enter` - 发送消息
  - `Shift + Enter` - 换行
- **取消请求** - 可以随时中断正在进行的 AI 回复
- **清空对话** - 一键清除所有历史记录

### 2. 错误处理

- 服务器离线提示
- 网络错误处理
- 请求超时处理

### 3. 用户体验优化

- 自动滚动到最新消息
- 加载状态提示
- 字符计数显示
- 响应式布局

## 🔧 配置说明

### API 配置

服务器默认运行在 `http://localhost:3000`。

如需修改，编辑以下文件：

**服务器端口** (`server/app.js`):
```javascript
const PORT = process.env.PORT || 3000;
```

**客户端连接** (`renderer/components/ChatBox.tsx`):
```typescript
const response = await fetch('http://localhost:3000/api/chat/stream', {
  // ...
});
```

### DeepSeek API Key

在 `server/apiKey.js` 中配置你的 API Key：

```javascript
export default {
    sk: "your-deepseek-api-key-here"
};
```

### Electron 窗口设置

在 `main/main.js` 中修改窗口配置：

```javascript
const mainWindow = new BrowserWindow({
    width: 1200,      // 窗口宽度
    height: 800,      // 窗口高度
    // ... 其他配置
});
```

## 📁 项目结构

```
electron-quick-start/
├── main/                   # Electron 主进程
│   └── main.js
├── renderer/               # React 渲染进程
│   ├── components/         # React 组件
│   │   └── ChatBox.tsx    # AI 聊天组件
│   ├── styles/            # 样式文件
│   ├── App.tsx            # 主应用
│   └── index.tsx          # 入口文件
├── server/                # Express 服务器
│   ├── app.js             # 服务器主文件
│   ├── index.js           # DeepSeek 集成
│   └── apiKey.js          # API Key 配置
├── scripts/               # 构建脚本
│   ├── dev.js             # 开发脚本
│   └── vite.renderer.config.js  # Vite 配置
└── package.json           # 项目配置
```

## 🎨 自定义界面

### 修改主题颜色

在 `renderer/components/ChatBox.tsx` 中修改 `styles` 对象：

```typescript
const styles = {
  // 用户消息背景色
  userMessage: {
    backgroundColor: '#2196F3',  // 改为你喜欢的颜色
    color: 'white',
  },
  
  // AI 消息背景色
  assistantMessage: {
    backgroundColor: 'white',    // 改为你喜欢的颜色
    color: '#333',
  },
  
  // 发送按钮颜色
  sendButton: {
    backgroundColor: '#4CAF50',  // 改为你喜欢的颜色
  },
};
```

### 修改字体

在 `renderer/styles/global.css` 中添加：

```css
body {
  font-family: 'Your Font', -apple-system, sans-serif;
}
```

## 🐛 故障排查

### 问题 1: Electron 窗口打不开

**可能原因**: Vite 服务器未启动或端口被占用

**解决方案**:
```bash
# 检查 5173 端口
netstat -ano | findstr :5173  # Windows
lsof -i :5173                  # Mac/Linux

# 如果被占用，杀掉进程或修改端口
```

### 问题 2: AI 不回复

**可能原因**: Express 服务器未运行

**解决方案**:
```bash
# 确保服务器运行
npm run server

# 测试服务器
npm run test-server
```

### 问题 3: 请求失败

**可能原因**: API Key 未配置或无效

**解决方案**:
1. 检查 `server/apiKey.js`
2. 确保 API Key 有效
3. 查看服务器控制台的错误信息

### 问题 4: TypeScript 报错

**解决方案**:
```bash
# 重新安装依赖
npm install

# 检查类型错误
npx tsc --noEmit
```

### 问题 5: 样式不生效

**解决方案**:
1. 确保导入了 CSS 文件
2. 清除浏览器缓存
3. 重启开发服务器

## 📚 进阶使用

### 1. 添加系统提示

修改 `ChatBox.tsx` 中的 `systemPrompt`:

```typescript
body: JSON.stringify({
  prompt: userMessage.content,
  systemPrompt: '你是一个专业的编程助手，擅长解释技术概念。'
})
```

### 2. 保存对话历史到本地

```typescript
// 保存到 localStorage
useEffect(() => {
  localStorage.setItem('chatHistory', JSON.stringify(messages));
}, [messages]);

// 加载历史记录
useEffect(() => {
  const saved = localStorage.getItem('chatHistory');
  if (saved) {
    setMessages(JSON.parse(saved));
  }
}, []);
```

### 3. 添加代码高亮

安装 `react-syntax-highlighter`:

```bash
npm install react-syntax-highlighter
```

在 ChatBox 中使用：

```typescript
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

// 渲染消息时检测代码块
const renderMessage = (content: string) => {
  // 解析 markdown 代码块并高亮显示
};
```

### 4. 导出对话记录

```typescript
const exportChat = () => {
  const content = messages.map(m => 
    `${m.role}: ${m.content}`
  ).join('\n\n');
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chat-history.txt';
  a.click();
};
```

## 🎓 学习资源

- [React 官方文档](https://react.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Electron 官方文档](https://www.electronjs.org/)
- [Vite 官方文档](https://vitejs.dev/)
- [DeepSeek API 文档](https://platform.deepseek.com/)

## 💡 提示

- 使用 `Ctrl+Shift+I` (Windows/Linux) 或 `Cmd+Option+I` (Mac) 打开开发者工具
- 查看控制台输出来调试问题
- 使用 React DevTools 查看组件状态
- 定期保存重要的对话记录

## 🎉 开始使用吧！

现在你已经了解了所有功能，开始和 AI 对话吧！
