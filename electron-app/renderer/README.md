# Renderer 渲染进程

这是 Electron 应用的渲染进程部分，使用 React + TypeScript + Vite 构建。

## 📁 目录结构

```
renderer/
├── components/          # React 组件
│   ├── ChatBox.tsx     # AI 聊天对话框组件
│   └── index.ts        # 组件导出索引
├── styles/             # 样式文件
│   └── global.css      # 全局样式
├── public/             # 公共资源
│   └── index.html      # HTML 模板
├── App.tsx             # 主应用组件
├── index.tsx           # 入口文件
└── README.md           # 本文档
```

## 🎯 主要功能

### ChatBox 组件

AI 对话聊天框组件，支持：

- ✅ **流式响应** - 实时显示 AI 回复内容
- ✅ **消息历史** - 保存完整对话记录
- ✅ **实时输入** - 支持 Enter 发送，Shift+Enter 换行
- ✅ **请求取消** - 可以中断正在进行的请求
- ✅ **错误处理** - 完善的错误提示和处理
- ✅ **清空对话** - 一键清除所有历史记录
- ✅ **美观 UI** - 现代化的聊天界面设计

## 🚀 使用方法

### 启动开发环境

```bash
# 启动 Vite + Electron
npm run dev
```

这将同时启动：
1. Vite 开发服务器 (http://localhost:5173)
2. Electron 应用窗口

### 使用聊天界面

1. 确保 Express 服务器正在运行：
   ```bash
   npm run server
   ```

2. 在输入框中输入问题

3. 按 Enter 发送（Shift+Enter 换行）

4. 实时查看 AI 回复

## 🎨 组件使用示例

### 基本使用

```typescript
import React from 'react';
import ChatBox from '@components/ChatBox';

function App() {
  return (
    <div>
      <ChatBox />
    </div>
  );
}
```

### 自定义样式

ChatBox 组件使用内联样式，可以通过修改组件内的 `styles` 对象来自定义样式。

## 🔧 配置

### 路径别名

项目配置了以下路径别名（在 `tsconfig.json` 和 `vite.renderer.config.js` 中）：

```typescript
import Component from '@/components/MyComponent';  // @/ = renderer/
import { ChatBox } from '@components';             // @components/ = renderer/components/
import utils from '@utils/helpers';                // @utils/ = renderer/utils/
import { User } from '@types/user';                // @types/ = renderer/types/
```

### API 配置

ChatBox 组件默认连接到 `http://localhost:3000/api/chat/stream`。

如果需要修改 API 地址，可以在 `ChatBox.tsx` 中修改 `fetch` 的 URL。

## 📚 技术栈

- **React 19** - UI 框架
- **TypeScript 5.7** - 类型安全
- **Vite 7** - 构建工具
- **CSS** - 样式（支持 CSS Modules）

## 💡 最佳实践

### 1. 组件结构

```typescript
// 定义接口
interface Props {
  title: string;
}

// 组件定义
const MyComponent: React.FC<Props> = ({ title }) => {
  // 状态
  const [state, setState] = useState<string>('');

  // 副作用
  useEffect(() => {
    // ...
  }, []);

  // 渲染
  return <div>{title}</div>;
};

// 样式
const styles: { [key: string]: React.CSSProperties } = {
  // ...
};

export default MyComponent;
```

### 2. 状态管理

```typescript
// 简单状态
const [count, setCount] = useState<number>(0);

// 复杂状态
interface Message {
  id: string;
  content: string;
}
const [messages, setMessages] = useState<Message[]>([]);

// 状态更新
setMessages(prev => [...prev, newMessage]);
```

### 3. 类型定义

```typescript
// 接口定义
interface User {
  id: string;
  name: string;
  email: string;
}

// 类型别名
type UserRole = 'admin' | 'user' | 'guest';

// 泛型
interface ApiResponse<T> {
  data: T;
  error?: string;
}
```

## 🐛 常见问题

### Q: 样式不生效？

**A:** 确保导入了全局样式：
```typescript
import './styles/global.css';
```

### Q: 路径别名报错？

**A:** 检查 `tsconfig.json` 和 `vite.renderer.config.js` 中的路径配置是否一致。

### Q: 热更新不工作？

**A:** 
1. 检查 Vite 开发服务器是否运行
2. 确保文件保存后触发了重新编译
3. 查看控制台是否有错误信息

### Q: ChatBox 连接失败？

**A:** 
1. 确保 Express 服务器正在运行 (`npm run server`)
2. 检查服务器地址和端口是否正确
3. 查看浏览器控制台的网络请求

## 📖 扩展功能

### 添加新组件

1. 在 `components/` 目录创建新组件：
   ```typescript
   // components/MyComponent.tsx
   import React from 'react';

   const MyComponent: React.FC = () => {
     return <div>My Component</div>;
   };

   export default MyComponent;
   ```

2. 在 `components/index.ts` 中导出：
   ```typescript
   export { default as MyComponent } from './MyComponent';
   ```

3. 在其他文件中使用：
   ```typescript
   import { MyComponent } from '@components';
   ```

### 添加全局状态管理

如果需要更复杂的状态管理，可以考虑：

- **Context API** - React 内置
- **Zustand** - 轻量级状态管理
- **Redux Toolkit** - 完整的状态管理方案

### 添加路由

如果需要多页面，可以使用 React Router：

```bash
npm install react-router-dom
```

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatBox />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## 🎉 完成！

现在你有了一个功能完整的 AI 聊天界面！
