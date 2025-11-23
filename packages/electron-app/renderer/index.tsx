import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

// 获取根元素
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('无法找到 root 元素');
}

// 创建 React 根节点并渲染应用
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
