import React from 'react';
import { Link } from 'react-router-dom';
import ChatBox from '@components/ChatBox';

/**
 * 聊天页面组件
 */
const ChatPage: React.FC = () => {
  return (
    <div style={styles.container}>
      {/* 导航栏 */}
      <header style={styles.header}>
        <Link to="/" style={styles.logo}>HuiseDesk</Link>
        <nav style={styles.nav}>
          <Link to="/" style={styles.navLink}>首页</Link>
          <Link to="/chat" style={styles.navLinkActive}>聊天</Link>
        </nav>
      </header>
      
      {/* 主内容区 */}
      <main style={styles.main}>
        <ChatBox />
      </main>
    </div>
  );
};

/**
 * 样式定义
 */
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e9ecef',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#4a90e2',
    textDecoration: 'none',
  },
  nav: {
    display: 'flex',
    gap: '1.5rem',
  },
  navLink: {
    color: '#666',
    textDecoration: 'none',
    padding: '0.5rem',
    transition: 'color 0.3s',
  },
  navLinkActive: {
    color: '#4a90e2',
    fontWeight: 'bold',
    textDecoration: 'none',
    padding: '0.5rem',
  },
  main: {
    flex: 1,
    overflow: 'hidden',
  },
};

export default ChatPage;