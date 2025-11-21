import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import ShotGridPage from './pages/ShotGridPage';

/**
 * 主应用组件
 */
const App: React.FC = () => {
  return (
    <Router>
      <div style={styles.app}>
        <Routes>
          {/* 首页路由 */}
          <Route path="/" element={<HomePage />} />
          {/* 聊天页面路由 */}
          <Route path="/chat" element={<ChatPage />} />
          {/* ShotGrid 页面路由 */}
          <Route path="/shotgrid" element={<ShotGridPage />} />
          {/* 重定向根路径到首页 */}
          <Route path="" element={<Navigate to="/" replace />} />
          {/* 404 页面处理 */}
          <Route path="*" element={<div style={{ padding: '2rem', textAlign: 'center' }}><h2>404 - 页面未找到</h2><p>抱歉，您访问的页面不存在。</p><a href="/">返回首页</a></div>} />
        </Routes>
      </div>
    </Router>
  );
};

/**
 * 样式定义
 */
const styles: { [key: string]: React.CSSProperties } = {
  app: {
    width: '100%',
    height: '100vh',
    margin: 0,
    padding: 0,
    overflow: 'hidden',
  },
};

export default App;
